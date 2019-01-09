import { AudioFontId } from './audioFontsConfig'

export interface PlayableNote {
  midi: number
}

export type ChromaticNoteSharps = 'A#' | 'C#' | 'D#' | 'F#' | 'G#'

export type EnharmonicFlatsMap = { [key in ChromaticNoteSharps]?: boolean }

export type User = {
  displayName: string | null
}

export interface PlayableLoopTick {
  // If empty, it represents a break
  notes: PlayableNote[]
  meta: {
    // ID of the note card from which this tick was generated
    noteCardId: string
    staffTickIndex?: number
  }
}

/**
 * Collection of playable notes or breaks, organized
 * along the tempo-agnostic "ticks" axis
 * (e.g. the same PlayableLoop can be played at various tempos)
 *
 * Ticks come at equal intervals.
 */
export interface PlayableLoop {
  ticks: PlayableLoopTick[]
}

export interface StaffNote extends PlayableNote {
  id: string
  // Full note name, e.g. "C#4"
  noteName: string
  isMainNote: boolean
  color: string
}

export interface StaffTick {
  id: string
  notes: StaffNote[]

  noteCardId?: string
}

export interface NoteCardType extends PlayableNote {
  id: string
  // Full note name, e.g. "C#4"
  noteName: string
  // Text to show on the card, e.g. "C#"
  text: string
  color: string
}

// Add more
export type ChordType = string

export interface Chord {
  type: ChordType
  category: string
  notes?: string
  title: string
  semitones: number[]
  intervals: string[]
  notesCount: number
}

// Add more
export type ScaleType = 'CHROMATIC' | string

export interface Scale {
  type: ScaleType
  notes?: string
  mode: string
  semitones: number[]
  // Intervals of "tonal" JS library: "1P", "2M" and so on
  intervals: string[]
  title: string
  notesCount: number
}

export type ArpeggioPatternPreset = 'custom' | 'ascending' | 'descending'

export interface ArpeggioPatternElement {
  note: number
  muted?: boolean
}

export interface RhythmInfo {
  beats: number
  divisions: number
}

export interface RhythmInfoWithTempoScaleFactor extends RhythmInfo {
  tempoFactor: number
  title?: string
}

export interface ArpeggioPattern {
  items: ArpeggioPatternElement[]
  mainNoteIndex: number
}

export interface ChordModifier {
  enabled: boolean
  chordType: ChordType
  // TODO: switch to "type: 'broken' | 'stacked'"
  isMelodic: boolean
  chordInversion: number
  patternPreset: ArpeggioPatternPreset
  pattern: ArpeggioPattern
}

export type ScalePatternPreset =
  | 'custom'
  | 'up'
  | 'down'
  | 'up down'
  | 'down up'
  | 'up, skip 1'
  | 'down, skip 1'
  | 'up down, skip 1'
  | 'down, skip 1'
  | 'down up, skip 1'

export interface ScalePattern extends ArpeggioPattern {}

export interface ScaleModifier {
  enabled: boolean
  scaleType: ScaleType
  patternPreset: ScalePatternPreset
  pattern: ScalePattern
}

export type EnclosuresType =
  | 'random'
  | 'one up'
  | 'one down'
  | 'two up'
  | 'two down'
  | 'one up, one down'
  | 'one down, one up'
  | 'three up'
  | 'three down'
  | 'two up, one down'
  | 'two down, one up'
  | 'one up, two down'
  | 'one down, two up'
  | 'four up'
  | 'four down'
  | 'three up, one down'
  | 'three down, one up'
  | 'two up, two down'
  | 'two down, two up'
  | 'one up, three down'
  | 'one down, three up'

export interface Enclosure {
  type: EnclosuresType
  title: string
  semitones: number[]
}

export interface EnclosuresModifier {
  enabled: boolean
  enclosure: Enclosure
}

export type PatternDirectionType = 'forward' | 'reversed'

export interface PatternDirection {
  title: string
  type: string
  pattern: PatternDirectionType[]
}

export type IntervalType =
  | '1P'
  | '2m'
  | '2M'
  | '3m'
  | '3M'
  | '4P'
  | '5d'
  | '5P'
  | '6m'
  | '6M'
  | '7m'
  | '7M'
  | '8P'

export interface DirectionsModifier {
  enabled: boolean
  random: boolean
  direction: PatternDirection
}

export type InstrumentTransposingType = 'C' | 'Bb' | 'Eb' | 'F'

export interface InstrumentTransposingOption {
  type: InstrumentTransposingType
  title: string
  interval: IntervalType
}

export interface IntervalsModifier {
  enabled: boolean
  // See https://danigb.github.io/tonal/api/module-Distance.html#.interval
  interval: IntervalType
  type: 'broken' | 'stacked'
  direction: 'ascending' | 'descending'
}

export interface NoteModifiers {
  chords: ChordModifier
  scales: ScaleModifier
  enclosures: EnclosuresModifier
  intervals: IntervalsModifier
  directions: DirectionsModifier
}

export interface SessionNoteCard {
  id: string
  noteName: string
}

export interface SharedSessionInfo {
  user: string
  session: string
}

/**
 * Persisted sharable session
 */
export interface Session {
  id: string
  sharedKey?: string
  author?: string
  name: string

  createdAt: string
  updatedAt: string

  bpm: number
  // Number of beats to wait between note groups
  rests: number
  // Number of offset beats to wait before playing the notes
  offset: number
  rhythm: RhythmInfo

  // Number of metronome clicks to play before playing notes
  countInCounts: number
  countInEnabled: boolean
  metronomeEnabled: boolean

  noteCards: SessionNoteCard[]
  modifiers: NoteModifiers
}

export type ClefType =
  | 'treble'
  | 'bass'
  | 'alto'
  | 'tenor'
  | 'soprano'
  | 'mezzo-soprano'
  | 'baritone-c'
  | 'baritone-f'
  | 'subbass'
  | 'french'

export interface LocalAppState {
  audioFontId: AudioFontId
  enharmonicFlatsMap: EnharmonicFlatsMap

  clef: ClefType
}
