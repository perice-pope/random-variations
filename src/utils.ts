import { mix } from 'polished'
import * as tonal from 'tonal'
import { arrayMove as reactHocArrayMove } from 'react-sortable-hoc'

/**
 * Returns a copy of the array shuffled randomly
 */
export function shuffle(array: any[]) {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const arrayMove = reactHocArrayMove

const NoteNameToColorMap = {
  A: '#D783FF',
  B: '#0096FF',
  C: '#8EFA00',
  D: '#FFFB02',
  E: '#FFD479',
  F: '#FF7E79',
  G: '#FF5097',
}

const baseNotes = Object.keys(NoteNameToColorMap)

const getNextNoteLetter = (letter: string) => {
  if (letter === 'G') {
    return 'A'
  }
  return String.fromCharCode(letter.charCodeAt(0) + 1)
}

const getPrevNoteLetter = (letter: string) => {
  if (letter === 'A') {
    return 'G'
  }
  return String.fromCharCode(letter.charCodeAt(0) - 1)
}

baseNotes.forEach(baseNote => {
  const nextLetter = getNextNoteLetter(baseNote)
  const prevLetter = getPrevNoteLetter(baseNote)
  NoteNameToColorMap[`${baseNote}#`] = mix(
    0.6,
    NoteNameToColorMap[baseNote],
    NoteNameToColorMap[nextLetter],
  )
  NoteNameToColorMap[`${baseNote}b`] = mix(
    0.6,
    NoteNameToColorMap[baseNote],
    NoteNameToColorMap[prevLetter],
  )
})

/**
 * @param fullNoteName Full note name, e.g. "C#4"
 */
export const getNoteCardColorByNoteName = (fullNoteName: string) => {
  const pitchName = tonal.Note.pc(fullNoteName)
  return NoteNameToColorMap[pitchName]
}
