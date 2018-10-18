export type NoteCardType = {
  id: string

  // Full note name, e.g. "C#4"
  noteName: string
  freq: number
  midi: number

  // Text to show on the card, e.g. "C#"
  text: string

  color: string
}

export type StaffNoteType = {
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

export type ArpeggioType = 'M' | 'm' | 'maj7' | 'm7'
export type ArpeggioDirection = 'up' | 'down' | 'up down' | 'down up'

export type ArpeggioModifier = {
  enabled: boolean
  type?: ArpeggioType
  direction?: ArpeggioDirection
}

export type NoteModifiers = {
  arpeggio: ArpeggioModifier
}
