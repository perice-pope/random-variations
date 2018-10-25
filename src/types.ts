export interface PlayableNote {
  midi: number
}

export type ChromaticNoteSharps = 'A#' | 'C#' | 'D#' | 'F#' | 'G#'

export type EnharmonicFlatsMap = { [key in ChromaticNoteSharps]: boolean }

export type User = {
  displayName: string | null
}

export interface PlayableLoopTick {
  // If empty, it represents a break
  notes: PlayableNote[]
  meta: {
    // ID of the note card from which this tick was generated
    noteCardId: string
    staffTickIndex: number
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
  noteCardId: string

  notes: StaffNote[]
}

export interface NoteCardType extends PlayableNote {
  id: string
  // Full note name, e.g. "C#4"
  noteName: string
  // Text to show on the card, e.g. "C#"
  text: string
  color: string
}

export type ArpeggioType = 'M' | 'm' | 'maj7' | 'm7' | 'M69#11'
export type ArpeggioDirection = 'up' | 'down' | 'up down' | 'down up'

export type ArpeggioModifier = {
  enabled: boolean
  type: ArpeggioType
  direction: ArpeggioDirection
}

export type ChromaticApproachesType =
  | 'above'
  | 'below'
  | 'up down'
  | 'down up'
  | 'random'

export type ChromaticApproachesModifier = {
  enabled: boolean
  type: ChromaticApproachesType
}

export type NoteModifiers = {
  arpeggio: ArpeggioModifier
  chromaticApproaches: ChromaticApproachesModifier
}
