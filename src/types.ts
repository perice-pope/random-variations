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
