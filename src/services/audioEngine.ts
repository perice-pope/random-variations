import Tone from 'tone'
import WebAudioFontPlayer from 'webaudiofont'
import * as _ from 'lodash'
import UnmuteButton from 'unmute'

import { PlayableLoop, PlayableNote, PlayableLoopTick } from 'src/types'
import audioFontsConfig, { AudioFontId, AudioFont } from 'src/audioFontsConfig'

const audioFontsConfigById = _.keyBy(audioFontsConfig, 'id')

type AnimationCallbackArg = {
  tick: PlayableLoopTick
  loop: PlayableLoop
}

export type AnimationCallback = (arg: AnimationCallbackArg) => any

// Needed to enable the webaudio in Safari and on iOS devices
UnmuteButton({ tone: Tone })

export default class AudioEngine {
  private loop: PlayableLoop = { ticks: [] }
  private bpm: number = 120

  private animationCallback?: AnimationCallback

  private audioFontId: AudioFontId = audioFontsConfig[0].id
  private audioFontPlayer?: typeof WebAudioFontPlayer
  private audioFontCache: { [audioFontId in AudioFontId]?: AudioFont } = {}
  private hasLoadedAudioFontMap: { [audioFontId in AudioFontId]?: boolean } = {}
  private isLoadingAudioFontMap: { [audioFontId in AudioFontId]?: boolean } = {}

  private scheduledEvents: any[] = []
  // @ts-ignore
  private isPlayingLoop: boolean = false

  constructor() {
    Tone.Transport.loopEnd = `0:${this.loop.ticks.length}`
    Tone.Transport.loop = true
    Tone.Transport.bpm.value = this.bpm
    this.audioFontPlayer = new WebAudioFontPlayer()
  }

  public cleanUp = () => {
    this.removeScheduledEvents()
  }

  public hasLoadedAudioFont = (audioFontId: AudioFontId) => {
    return this.hasLoadedAudioFontMap[audioFontId] === true
  }

  public setAudioFont = async (audioFontId: AudioFontId) => {
    if (!this.hasLoadedAudioFont[audioFontId]) {
      await this.loadAudioFont(audioFontId)
    }

    this.audioFontId = audioFontId
  }

  private loadAudioFont = async audioFontId => {
    const audioFont = audioFontsConfigById[audioFontId]

    if (!audioFont) {
      throw new Error('Could not find audio font with name')
    }

    this.isLoadingAudioFontMap[audioFontId] = true
    const audioFontLoadingPromise = new Promise((resolve, reject) => {
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

  public setAnimationCallback = (value: AnimationCallback) => {
    this.animationCallback = value
  }

  public setBpm = (bpm: number) => {
    this.bpm = Math.max(bpm, 0.0001)
    Tone.Transport.bpm.value = this.bpm
    this.rescheduleLoopNotes()
  }

  public playLoop = () => {
    this.rescheduleLoopNotes()
    Tone.Master.volume.rampTo(1, 100)
    this.isPlayingLoop = true
    Tone.Transport.start()
  }

  public stopLoop = () => {
    const rampTimeMs = 100
    Tone.Master.volume.rampTo(0, rampTimeMs)
    this.isPlayingLoop = false
    setTimeout(() => {
      Tone.Transport.stop()
    }, rampTimeMs)
  }

  public playNote = (
    note: PlayableNote,
    when: number = 0,
    duration: number = 10000000,
  ) => {
    if (!this.audioFontPlayer || !this.hasLoadedAudioFont(this.audioFontId)) {
      return
    }

    return this.audioFontPlayer.queueWaveTable(
      Tone.context,
      Tone.context.destination,
      this.audioFontCache[this.audioFontId],
      when,
      note.midi,
      duration,
      // Volume
      1.0,
    )
  }

  public stopNote = envelope => {
    if (!envelope) {
      return
    }

    envelope.cancel()
  }

  public setLoop = (loop: PlayableLoop) => {
    this.loop = loop
    Tone.Transport.loopEnd = `0:${loop.ticks.length}`
    this.rescheduleLoopNotes()
  }

  private removeScheduledEvents = () => {
    this.scheduledEvents.forEach(eventId => Tone.Transport.clear(eventId))
  }

  private rescheduleLoopNotes = () => {
    this.removeScheduledEvents()

    this.loop.ticks.forEach((tick, index) => {
      const time = `0:${index}`
      // Duration in seconds, based on the current BPM
      const duration = 60.0 / this.bpm
      this.scheduledEvents.push(this.scheduleTick(tick, index, time, duration))
    })
  }

  private scheduleTick = (
    tick: PlayableLoopTick,
    tickIndex: number,
    // Transport time when to schedule the notes
    time: string = '0:0',
    // Duration in seconds
    duration: number,
  ) => {
    if (!this.audioFontPlayer || !this.hasLoadedAudioFont(this.audioFontId)) {
      return
    }

    const midiNotes = tick.notes.map(note => note.midi)

    return Tone.Transport.schedule(contextTime => {
      this.audioFontPlayer.queueChord(
        Tone.context,
        Tone.context.destination,
        this.audioFontCache[this.audioFontId],
        contextTime,
        midiNotes,
        duration,
        // Volume
        1.0,
      )

      // Call animation callback
      Tone.Draw.schedule(() => {
        if (this.animationCallback) {
          this.animationCallback({
            tick,
            loop: this.loop,
          })
        }
      }, contextTime)
    }, Tone.Time(time))
  }
}
