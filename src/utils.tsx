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
  enclosureByEnclosureType,
  patternDirectionOptions,
} from './musicUtils'

import TimeAgo from 'react-time-ago'
import TimeAgoNoTooltip from 'react-time-ago/no-tooltip'
import 'react-time-ago/Tooltip.css'

import JavascriptTimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

JavascriptTimeAgo.locale(en)

export const downloadBlob = (data, fileName, mimeType) => {
  var blob, url
  blob = new Blob([data], {
    type: mimeType,
  })
  url = window.URL.createObjectURL(blob)
  downloadURL(url, fileName)
  setTimeout(function() {
    return window.URL.revokeObjectURL(url)
  }, 1000)
}

export const downloadURL = (data, fileName) => {
  var a
  a = document.createElement('a')
  a.href = data
  a.download = fileName
  document.body.appendChild(a)
  a.style = 'display: none'
  a.click()
  a.remove()
}

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
  const pitchName = tonal.Note.pc(fullNoteName) as string
  return NoteNameToColorMap[pitchName]
}

const DEFAULT_SCALE_NAME = 'ionian'
const DEFAULT_CHORD_NAME = 'maj'

export const parseIntEnsureInBounds = (value, min, max) => {
  let parsedValue = parseInt(value, 10)
  if (isNaN(parsedValue)) {
    parsedValue = 0
  }

  if (parsedValue > max) {
    parsedValue = max
  } else if (parsedValue < min) {
    parsedValue = min
  }
  return parsedValue
}

export const createDefaultSession = () => {
  const defaultSession: Partial<Session> = {
    name: 'Default session',
    id: 'default-session',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    bpm: 120,
    rests: 1,
    offset: 0,
    rhythm: { beats: 1, divisions: 1 },

    countInCounts: 3,
    countInEnabled: false,
    modifiers: {
      directions: {
        enabled: false,
        random: false,
        direction: patternDirectionOptions[0],
      },
      intervals: {
        enabled: false,
        direction: 'ascending',
        type: 'broken',
        interval: '5P',
      },
      scales: {
        enabled: false,
        scaleType: DEFAULT_SCALE_NAME,
        patternPreset: 'up',
        pattern: generateScalePatternFromPreset({
          scale: scaleByScaleType[DEFAULT_SCALE_NAME],
          patternPreset: 'up',
        }),
      },
      chords: {
        enabled: false,
        isMelodic: true,
        chordInversion: 0,
        chordType: DEFAULT_CHORD_NAME,
        patternPreset: 'ascending',
        pattern: generateChordPatternFromPreset({
          chord: chordsByChordType[DEFAULT_CHORD_NAME],
          patternPreset: 'ascending',
        }),
      },
      enclosures: {
        enabled: false,
        enclosure: enclosureByEnclosureType['one up, one down'],
      },
    },
    noteCards: [],
  }

  return defaultSession
}
