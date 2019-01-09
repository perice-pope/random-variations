import Tone from 'tone'
import WebAudioFontPlayer from 'webaudiofont'
import * as _ from 'lodash'
import * as tonal from 'tonal'
import UnmuteButton from 'unmute'

import {
  PlayableLoop,
  PlayableNote,
  PlayableLoopTick,
  StaffTick,
  RhythmInfo,
} from '../types'
import audioFontsConfig, { AudioFontId, AudioFont } from '../audioFontsConfig'

const audioFontsConfigById = _.keyBy(audioFontsConfig, 'id')

type AnimationCallbackArg = {
  tick: PlayableLoopTick
  loop: PlayableLoop
}

export type AnimationCallback = (arg: AnimationCallbackArg) => any

// Needed to enable the webaudio in Safari and on iOS devices
UnmuteButton({ tone: Tone })

// @ts-ignore
window.Tone = Tone

export default class AudioEngine {
  private loop: PlayableLoop = { ticks: [] }

  // BPM of the metronome
  private bpm: number = 120

  // Notes can be played at a BPM different than that of the metronome.
  // The BPM of the notes playback is calculated as:
  // notes' BPM = metronome's BPM * notesTempoFactor
  private notesTempoFactor: number = 1.0

  private countIn: number = 0
  private offset: number = 0
  private metronomeEnabled: boolean = false

  private notesSequence?: typeof Tone.Sequence
  private metronomeSequence?: typeof Tone.Sequence
  private countInSequence?: typeof Tone.Sequence

  private animationCallback?: AnimationCallback

  private audioFontId: AudioFontId = audioFontsConfig[1].id
  private audioFontPlayer?: typeof WebAudioFontPlayer
  private audioFontCache: { [audioFontId in AudioFontId]?: AudioFont } = {}
  private hasLoadedAudioFontMap: { [audioFontId in AudioFontId]?: boolean } = {}
  private isLoadingAudioFontMap: { [audioFontId in AudioFontId]?: boolean } = {}

  // @ts-ignore
  private isPlayingLoop: boolean = false

  constructor() {
    Tone.Transport.bpm.value = this.bpm

    this.audioFontPlayer = new WebAudioFontPlayer()
    this.loadAudioFont('metronome')
  }

  public cleanUp = () => {
    if (this.notesSequence) {
      this.notesSequence.dispose()
    }
    if (this.metronomeSequence) {
      this.metronomeSequence.dispose()
    }
    if (this.countInSequence) {
      this.countInSequence.dispose()
    }
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

  private loadAudioFont = async (audioFontId: AudioFontId) => {
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
  }

  public setNotesRhythm = (rhythm: RhythmInfo) => {
    this.notesTempoFactor = rhythm.divisions / rhythm.beats
    if (this.notesSequence) {
      console.log('setNotesRhythm: ', this.notesTempoFactor)
      this.notesSequence.playbackRate = this.notesTempoFactor
    }
  }

  public setCountIn = (counts: number) => {
    this.countIn = counts || 0
  }

  public setNotesOffset = (offset: number) => {
    this.offset = offset || 0
  }

  public setMetronomeEnabled = (enabled: boolean) => {
    this.metronomeEnabled = enabled
  }

  public playLoop = async () => {
    this.rescheduleLoopNotes()
    this.isPlayingLoop = true

    this.startWithCountIn()
  }

  public startWithCountIn = () => {
    Tone.Transport.start('+0.1')
    this.countInSequence.start()
    this.notesSequence.start(`0:${this.countIn + this.offset / this.notesTempoFactor}`)
    this.metronomeSequence.start(`0:${this.countIn}`)
    Tone.Master.volume.rampTo(1, 100)
  }

  public stopLoop = (callback?: () => any) => {
    const rampTimeMs = 100
    Tone.Master.volume.rampTo(0, rampTimeMs)
    this.isPlayingLoop = false

    setTimeout(() => {
      Tone.Transport.stop()
      if (this.countInSequence) {
        this.countInSequence.stop()
      }
      if (this.notesSequence) {
        this.notesSequence.stop()
      }
      if (this.metronomeSequence) {
        this.metronomeSequence.stop()
      }
      if (callback) {
        callback()
      }
    }, rampTimeMs)
  }

  public playNote = (
    note: PlayableNote,
    when: number = 0,
    duration: number = 10000000,
    audioFontId?: AudioFontId,
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

  public setLoop = (staffTicks: StaffTick[]) => {
    // Generate loop
    const loopTicks: PlayableLoopTick[] = staffTicks.map(
      (staffTick, index) => ({
        notes: staffTick.notes,
        meta: {
          staffTickIndex: index,
          noteCardId: staffTick.noteCardId!,
        },
      }),
    )

    const loop: PlayableLoop = { ticks: loopTicks }

    this.loop = loop
    if (!this.loop.ticks) {
      this.loop.ticks = []
    }
    this.rescheduleLoopNotes()
  }

  private rescheduleLoopNotes = () => {
    console.log('rescheduleLoopNotes')

    if (!this.notesSequence) {
      this.notesSequence = new Tone.Sequence(
        (contextTime, tick) => {
          try {
            const duration = 60.0 / this.bpm
            const midiNotes = tick.notes.map(note => note.midi)

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
          } catch (error) {
            console.error(error)
          }
        },
        this.loop.ticks,
        '4n',
      )
      this.notesSequence.loop = true
      this.notesSequence.playbackRate = this.notesTempoFactor
    } else {
      this.notesSequence.removeAll()
      this.loop.ticks.forEach((tick, index) => {
        this.notesSequence.add(index, tick)
      })
      this.notesSequence.loopEnd = `0:${this.loop.ticks.length}`
      this.notesSequence.playbackRate = this.notesTempoFactor
    }

    if (!this.metronomeSequence) {
      this.metronomeSequence = new Tone.Sequence(
        contextTime => {
          try {
            if (this.metronomeEnabled && this.hasLoadedAudioFont('metronome')) {
              this.audioFontPlayer.queueChord(
                Tone.context,
                Tone.context.destination,
                this.audioFontCache['metronome'],
                contextTime,
                [tonal.Note.midi('C6')],
                0.3,
                // Volume
                1.0,
              )
            }
          } catch (error) {
            console.error(error)
          }
        },
        [{ notes: [] }],
        '4n',
      )
      this.metronomeSequence.loop = true
    } else {
      this.metronomeSequence.removeAll()
      this.metronomeSequence.add(0, { notes: [] })
      this.metronomeSequence.loopEnd = '0:1'
    }

    if (!this.countInSequence) {
      this.countInSequence = new Tone.Sequence(
        contextTime => {
          if (this.hasLoadedAudioFont('metronome')) {
            this.audioFontPlayer.queueChord(
              Tone.context,
              Tone.context.destination,
              this.audioFontCache['metronome'],
              contextTime,
              [tonal.Note.midi('C6')],
              0.3,
              // Volume
              1.0,
            )
          }
        },
        new Array(this.countIn).fill(null).map(() => 'C6'),
        '4n',
      )
      this.countInSequence.loop = false
    } else {
      this.countInSequence.removeAll()
      new Array(this.countIn).fill(null).forEach((value, index) => {
        this.countInSequence.add(index, 'C6')
      })
    }
  }
}
