export type NoteCardType = {
  id: string
  note: string
  text: string
  midi: number
  color: string
}

export type StaffNoteType = {
  index: number
  note: string
  freq: number
  midi: number
  color: string
  duration: '4'
}

export type ArpeggioType = 'major triad' | 'minor triad'
export type ArpeggioDirection = 'up' | 'down' | 'up down' | 'down up'

export type ArpeggioModifier = {
  enabled: boolean
  type?: ArpeggioType
  direction?: ArpeggioDirection
}
