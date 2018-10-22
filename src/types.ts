export interface PlayableNote {
  midi: number
}

export interface PlayableLoopTick {
  // If empty, it represents a break
  notes: PlayableNote[]
  meta: {
    // ID of the note card from which this tick was generated
    noteCardId: string
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

export interface NoteCardType extends PlayableNote {
  id: string

  // Full note name, e.g. "C#4"
  noteName: string

  // Text to show on the card, e.g. "C#"
  text: string

  color: string
}

export interface StaffNoteType extends PlayableNote {
  index: number
  // A reference back to note card which "generated" this staff note
  noteCardId: string
  // "true" for exactly one (the base) note from the same "note card" notes bucket
  isMainNote: boolean

  // Full note name, e.g. "C#4"
  noteName: string

  duration: '4'
  freq: number
  midi: number

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
