import { darken, lighten } from 'polished'
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

const NOTE_NAME_TO_COLOR_MAP = {
  A: '#D783FF',
  B: '#0096FF',
  C: '#8EFA00',
  D: '#FFFB02',
  E: '#FFD479',
  F: '#FF7E79',
  G: '#FF5097',
}

/**
 * @param fullNoteName Full note name, e.g. "C#4"
 */
export const getNoteCardColorByNoteName = (fullNoteName: string) => {
  const [letter, accidental] = tonal.Note.tokenize(fullNoteName)
  const baseColor = NOTE_NAME_TO_COLOR_MAP[letter.toUpperCase()]
  if (accidental === '#') {
    return lighten(0.1, baseColor)
  } else if (accidental === 'b') {
    return darken(0.1, baseColor)
  }
  return baseColor
}
