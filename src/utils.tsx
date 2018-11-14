import * as React from 'react'

import { mix } from 'polished'
import * as tonal from 'tonal'
import { arrayMove as reactHocArrayMove } from 'react-sortable-hoc'
import { Session } from './types'
import {
  generateChordPatternFromPreset,
  chordsByChordType,
  generateScalePatternFromPreset,
  scaleByScaleType,
} from './musicUtils'

import TimeAgo from 'react-time-ago'
import TimeAgoNoTooltip from 'react-time-ago/no-tooltip'
import 'react-time-ago/Tooltip.css'

import JavascriptTimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

JavascriptTimeAgo.locale(en)

export function timeago(timestamp, { showTooltip } = { showTooltip: false }) {
  if (!timestamp) {
    return null
  }
  const Component = showTooltip ? TimeAgo : TimeAgoNoTooltip
  return <Component>{new Date(timestamp)}</Component>
}

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

export const createDefaultSession = () => {
  const defaultSession: Partial<Session> = {
    name: 'default',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    bpm: 120,
    rests: 1,
    countInCounts: 3,
    countInEnabled: false,
    modifiers: {
      intervals: {
        enabled: false,
        direction: 'ascending',
        type: 'broken',
        interval: '5P',
      },
      scales: {
        enabled: false,
        scaleType: 'major',
        patternPreset: 'up',
        pattern: generateScalePatternFromPreset({
          scale: scaleByScaleType['major'],
          patternPreset: 'up',
        }),
      },
      chords: {
        enabled: false,
        isMelodic: true,
        chordInversion: 0,
        chordType: 'M',
        patternPreset: 'ascending',
        pattern: generateChordPatternFromPreset({
          chord: chordsByChordType['M'],
          patternPreset: 'ascending',
        }),
      },
      chromaticApproaches: {
        enabled: false,
        type: 'above',
      },
    },
    noteCards: [],
  }

  return defaultSession
}
