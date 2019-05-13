/**
 * This module implements AudioEngine class which can:
 * - load soundfonts
 * - play individual sounds
 * - set up multiple channels each capable of playing looped sequences of sounds
 * - control channels' params such as volume, solo and mute
 *
 * Each `Channel` has its own `ChannelAudioContent` object, which describes
 * audio events and playback params (is looped, loop end / start, playback rate) for that `Channel`.
 *
 * Time is measured in `ticks`, and the global playback speed is controlled by the global param `bpm`,
 * which affects each `Channel`.
 *
 * Every `Channel` can also define its own `playbackRate` field, which is combined with `bpm`
 * (multipied by it) to determine that `Channel`'s final playback rate.
 */

import Tone from 'tone'
import WebAudioFontPlayer from 'webaudiofont'
import * as _ from 'lodash'
import UnmuteButton from 'unmute'

import {
  AudioFontId,
  AudioFont,
  instrumentAudioFontConfigs,
  percussionAudioFontConfigs,
} from '../audioFontsConfig'
import { merge, groupBy, some, keys } from 'lodash'

const audioFontsConfigById = _.keyBy(
  [...instrumentAudioFontConfigs, ...percussionAudioFontConfigs],
  'id',
)

export default class AudioEngine {
  // private loop: NotesLoop = { ticks: [] }

  // BPM of the metronome
  private bpm: number = 120

  // Configs for Channels
  private channels: ChannelConfig[] = []
  // Audio content for each Channel
  private channelContent: ChannelsAudioContent = {}
  // Tone's Sequence instances, one per Channel
  private channelSequence: ChannelsToneSequence = {}

  // Client can register a callback to be called on each tick
  private tickCallback?: TickCallback

  private audioFontPlayer?: typeof WebAudioFontPlayer
  private audioFontCache: { [audioFontId in AudioFontId]?: AudioFont } = {}
  private hasLoadedAudioFontMap: { [audioFontId in AudioFontId]?: boolean } = {}
  private isLoadingAudioFontMap: { [audioFontId in AudioFontId]?: boolean } = {}

  constructor() {
    Tone.Transport.bpm.value = this.bpm
    this.audioFontPlayer = new WebAudioFontPlayer()
  }

  /**
   * Updates parameters of a Channel.
   */
  public setChannels = async (channels: ChannelConfig[]) => {
    console.log('AudioEngine / setChannels', channels)
    this.channels = channels
    return this.rescheduleSoundEventsAfterAudioContentUpdate()
  }

  /**
   * Updates parameters of a Channel.
   */
  public updateChannel = async (
    channelId: ChannelId,
    channelConfigUpdate: Partial<ChannelConfig>,
    skipRescheduling = false,
  ) => {
    console.log('AudioEngine / updateChannel', channelId, channelConfigUpdate)
    this.channels[channelId] = merge(
      this.channels[channelId],
      channelConfigUpdate,
    )
    if (!skipRescheduling) {
      this.rescheduleSoundEventsAfterAudioContentUpdate()
    }
  }

  public updateChannels = async (
    update: {
      [channelId: string]: Partial<ChannelConfig>
    },
    skipRescheduling = false,
  ) => {
    console.log('AudioEngine / updateChannels', update)
    this.channels.forEach((channel, index) => {
      if (update[channel.channelId]) {
        this.channels[index] = merge(channel, update[channel.channelId])
      }
    })
    if (!skipRescheduling) {
      this.rescheduleSoundEventsAfterAudioContentUpdate()
    }
  }

  /**
   * Updates audio content for all Channels
   */
  public setAudioContent = (channelsAudioContent: ChannelsAudioContent) => {
    console.log('AudioEngine / setAudioContent', channelsAudioContent)
    this.channelContent = channelsAudioContent
    this.rescheduleSoundEventsAfterAudioContentUpdate()
  }

  public cleanUp = () => {
    // Dispose of all Tone's Sequences
    this.channels
      .map(ch => ch.channelId)
      .map(channelId => this.channelSequence[channelId])
      .filter(x => !!x)
      .forEach(sequence => sequence.stop())
  }

  /**
   * Fetches an audio font, resolves when the audio font is loaded
   */
  public loadAudioFont = async (audioFontId: AudioFontId) => {
    console.log('AudioEngine / loadAudioFont', audioFontId)

    const audioFont = audioFontsConfigById[audioFontId]

    if (!audioFont) {
      throw new Error(
        `Could not find audio font with id ${audioFontId}, available options are: ${Object.keys(
          audioFontsConfigById,
        ).join(', ')}`,
      )
    }

    this.isLoadingAudioFontMap[audioFontId] = true
    const audioFontLoadingPromise = new Promise(resolve => {
      // See https://surikov.github.io/webaudiofont/
      this.audioFontPlayer.loader.startLoad(
        Tone.context,
        audioFont.url,
        audioFont.globalVarName,
      )

      // TODO: add error handling
      const waitLoad = () => {
        if (typeof window[audioFont.globalVarName] === 'undefined') {
          setTimeout(waitLoad, 1000)
          return
        }

        this.audioFontCache[audioFont.id] = window[audioFont.globalVarName]
        this.isLoadingAudioFontMap[audioFontId] = false
        this.hasLoadedAudioFontMap[audioFontId] = true

        resolve()
      }

      waitLoad()
    })

    return audioFontLoadingPromise
  }

  public setTickCallback = (callback: TickCallback) => {
    this.tickCallback = callback
  }

  public setBpm = (bpm: number) => {
    this.bpm = Math.max(bpm, 0.0001)
    Tone.Transport.bpm.value = this.bpm
  }

  public playLoop = async () => {
    console.log('AudioEngine / playLoop')
    this.rescheduleSoundEventsAfterAudioContentUpdate()

    Tone.Transport.start('+0.1')

    // Start all Tone's Sequences
    this.channels.forEach(ch => {
      const sequence = this.channelSequence[ch.channelId]
      if (!sequence) {
        return
      }

      const content = this.channelContent[ch.channelId]
      if (!content) {
        return
      }
      const sequenceOffset = content.startAt || 0
      sequence.start(`0:${sequenceOffset}`)
    })

    Tone.Master.volume.rampTo(1, 100)
  }

  public stopLoop = (callback?: () => any) => {
    console.log('AudioEngine / stopLoop')

    const rampTimeMs = 100
    Tone.Master.volume.rampTo(0, rampTimeMs)

    setTimeout(() => {
      Tone.Transport.stop()

      // Stop all Tone's Sequences
      this.channels
        .map(ch => ch.channelId)
        .map(channelId => this.channelSequence[channelId])
        .filter(x => !!x)
        .forEach(sequence => sequence.stop())

      if (callback) {
        callback()
      }
    }, rampTimeMs)
  }

  /**
   * Plays a single sound.
   * Returns an object that can be used to cancel the playing sound before its duration ends.
   */
  public playSingleSound = (
    sound: SoundConfig,
    duration: number = 10000000,
    volume: number = 1.0,
    when: number = 0,
  ) => {
    console.log('AudioEngine / playNote', sound, duration, volume, when)

    if (
      !this.audioFontPlayer ||
      !this.hasLoadedAudioFontMap[sound.audioFontId]
    ) {
      console.error(
        `Trying to play a Note with AudioFontId = "${
          sound.audioFontId
        }" before the Audio Font has been loaded, ignoring`,
      )
      return
    }

    const noteEnvelope = this.audioFontPlayer.queueWaveTable(
      Tone.context,
      Tone.context.destination,
      this.audioFontCache[sound.audioFontId],
      when,
      sound.midi,
      duration,
      volume,
    )

    const envelope: SoundEnvelope = {
      cancel: () => noteEnvelope.cancel(),
    }

    return envelope
  }

  private rescheduleSoundEventsAfterAudioContentUpdate = () => {
    console.log('rescheduleSoundEventsAfterAudioContentUpdate')

    const { channelSequence, channelContent, channels } = this

    channels.forEach(channel => {
      const content = channelContent[channel.channelId]
      const events = content ? content.events : []

      if (!content) {
        return
        // throw new Error(`no content for channel ${channel.channelId}`)
      }

      console.log('content = ', channel.channelId, channel, content)

      let sequence = channelSequence[channel.channelId]
      if (!sequence) {
        sequence = new Tone.Sequence(
          (
            contextTime: number,
            { event, eventIndex }: { event: SoundEvent; eventIndex: number },
          ) => {
            const isAnyChannelSoloing = some(channels.map(ch => ch.isSolo))
            const isChannelAudible =
              (isAnyChannelSoloing && channel.isSolo) ||
              (!isAnyChannelSoloing && !channel.isMuted)

              
              const content = channelContent[channel.channelId]
              console.log(
                'tick',
                channel.channelId,
                channel.volume,
                channel,
                isAnyChannelSoloing,
                isChannelAudible,
                content
              )
              if (!content) {
              return
            }

            try {
              const duration =
                (60.0 / (this.bpm * content.playbackRate)) *
                (event.duration || 1)
              const soundsGroupedByAudioFontId = groupBy(
                event.sounds,
                'audioFontId',
              )
              Object.keys(soundsGroupedByAudioFontId).forEach(audioFontId => {
                const sounds = soundsGroupedByAudioFontId[audioFontId]
                const midiNotes = sounds.map(sound => sound.midi)
                const volume =
                  channel.volume *
                  (event.volume || 1) *
                  (isChannelAudible ? 1 : 0)

                  if (volume > 0) {

                this.audioFontPlayer.queueChord(
                  Tone.context,
                  Tone.context.destination,
                  this.audioFontCache[audioFontId],
                  contextTime,
                  midiNotes,
                  duration,
                  volume,
                )
                  }
              })
              // Call animation callback
              Tone.Draw.schedule(() => {
                if (this.tickCallback) {
                  this.tickCallback({
                    event,
                    events,
                    eventIndex,
                  })
                }
              }, contextTime)
            } catch (error) {
              console.error(error)
            }
          },
          events.map((event, eventIndex) => ({ event, eventIndex })),
          '4n',
        )
        channelSequence[channel.channelId] = sequence
      } else {
        // Update sound events in the Sequence
        events
          .map((event, eventIndex) => ({ event, eventIndex }))
          .forEach((event, index) => {
            sequence.at(index, event)
          })
      }

      sequence.playbackRate = content.playbackRate

      if (!!content.loop) {
        sequence.loop = true
        sequence.loopStart = `0:${content.loop.startAt}`
        sequence.loopEnd = `0:${content.loop.endAt}`
      }
    })
  }
}

// Needed to enable the webaudio in Safari and on iOS devices
UnmuteButton({ tone: Tone })

// @ts-ignore
window.Tone = Tone

export type ChannelId = string

export type ChannelConfig = {
  channelId: ChannelId
  volume: number
  isMuted: boolean
  isSolo: boolean
}

export type SoundConfig = {
  audioFontId: AudioFontId
  midi: number
}

export type SoundEvent<DataType = any> = {
  sounds: SoundConfig[]
  // Event duration in ticks. Default: 1
  duration?: number
  // Any data associated with an event. Default: undefined
  data?: DataType
  // Volume of the event. Default: 1
  volume?: number
}

export type ChannelAudioContent<DataType = any> = {
  events: SoundEvent<DataType>[]
  playbackRate: number
  // Start playback with a given offset (measured in ticks)
  startAt: number
  // If specified, the sound event sequence will be looped
  loop?: {
    // Loop start (measured in ticks)
    startAt: number
    // Loop end, including the last event (measured in ticks)
    endAt: number
  }
}

export type ChannelsAudioContent<DataType = any> = {
  [channelId in ChannelId]?: ChannelAudioContent<DataType>
}

type TickCallbackParams = {
  event: SoundEvent
  eventIndex: number
  events: SoundEvent[]
}

export type TickCallback = (params: TickCallbackParams) => any

type ChannelsToneSequence = { [channelId in ChannelId]?: Tone.Sequence }

export type SoundEnvelope = {
  cancel: () => void
}
