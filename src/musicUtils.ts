import * as tonal from 'tonal'
import * as tonalChord from 'tonal-chord'
import { transpose } from 'tonal-distance'
import * as _ from 'lodash'
import { memoize } from 'lodash/fp'
import uuid from 'uuid/v4'

import {
  NoteModifiers,
  StaffNote,
  ArpeggioModifier,
  ChromaticApproachesModifier,
  StaffTick,
  NoteCardType,
  Chord,
  ArpeggioPattern,
  ArpeggioPatternElement,
  ArpeggioPatternPreset,
} from './types'

const getAllChordOptions: () => Chord[] = memoize(() => {
  return [
    {
      type: 'm',
      title: 'Minor triad',
    },
    {
      type: 'M',
      title: 'Major triad',
    },
    {
      type: 'maj7',
      title: 'Major 7th',
    },
    {
      type: 'm7',
      title: 'Minor 7th',
    },
    {
      type: 'M69#11',
      title: 'M69#11',
    },
    // TODO: provide better names for chords
    ...tonalChord.names().map(name => ({ title: name, type: name })),
  ].map(({ type, title }) => {
    const intervals = tonalChord.intervals(type)
    return {
      type,
      title,
      notesCount: intervals.length,
    } as Chord
  }) as Chord[]
})

export const chordOptions = getAllChordOptions()
export const chordsByChordType = _.keyBy(chordOptions, 'type')

export const generateChordPatternFromPreset = ({
  chord,
  patternPreset,
}: {
  chord: Chord
  patternPreset: ArpeggioPatternPreset
}) => {
  let items: ArpeggioPatternElement[]
  let mainNoteIndex
  switch (patternPreset) {
    case 'ascending': {
      items = _.range(1, chord.notesCount + 1, 1).map(note => ({ note }))
      mainNoteIndex = 0
      break
    }
    case 'descending': {
      items = _.range(chord.notesCount, 0, -1).map(note => ({ note }))
      mainNoteIndex = items.length - 1
      break
    }
    default: {
      // "Should never happen" (c)
      items = []
      mainNoteIndex = undefined
      break
    }
  }

  const pattern: ArpeggioPattern = {
    items,
    mainNoteIndex,
  }

  return pattern
}

type PartialStaffNote = {
  // Full note name, e.g. "C4"
  noteName: string
  color: string
  isMainNote?: boolean
}

export const addApproachNotes = (
  notes: Partial<PartialStaffNote>[],
  approach: ChromaticApproachesModifier,
): PartialStaffNote[] => {
  const baseNoteIndex = notes.findIndex(n => n.isMainNote === true)
  if (baseNoteIndex < 0) {
    throw new Error(
      '"notes" must have exactly one note with "note.isMainNote ==== true"',
    )
  }
  const baseNote = notes[baseNoteIndex].noteName

  let approachNotes: Partial<PartialStaffNote>[] = []

  const approachType =
    approach.type === 'random' ? _.sample(['above', 'below']) : approach.type
  const intervalUp = tonal.Interval.fromSemitones(1)
  const intervalDown = `-${intervalUp}`

  if (approachType === 'above') {
    approachNotes = [
      {
        noteName: transpose(baseNote, intervalUp),
      },
    ]
  } else if (approachType === 'below') {
    approachNotes = [
      {
        noteName: transpose(baseNote, intervalDown),
      },
    ]
  } else if (approachType === 'up down') {
    approachNotes = [
      {
        noteName: transpose(baseNote, intervalUp),
      },
      {
        noteName: transpose(baseNote, intervalDown),
      },
    ]
  } else if (approachType === 'down up') {
    approachNotes = [
      {
        noteName: transpose(baseNote, intervalDown),
      },
      {
        noteName: transpose(baseNote, intervalUp),
      },
    ]
  }

  const approachNotesColor = '#1B34AC'
  approachNotes = approachNotes.map(
    note =>
      ({
        ...note,
        isMainNote: false,
        color: approachNotesColor,
      } as PartialStaffNote),
  )

  const notesWithApproachNotes = [...notes] as PartialStaffNote[]
  notesWithApproachNotes.splice(
    baseNoteIndex,
    0,
    ...(approachNotes as PartialStaffNote[]),
  )

  return notesWithApproachNotes
}

export const addArpeggioNotes = (
  notes: Partial<PartialStaffNote>[],
  arpeggio: ArpeggioModifier,
): PartialStaffNote[] => {
  const baseNoteIndex = notes.findIndex(n => n.isMainNote === true)
  if (baseNoteIndex < 0) {
    throw new Error(
      '"notes" must have exactly one note with "note.isMainNote ==== true"',
    )
  }
  const baseNote = notes[baseNoteIndex].noteName

  const chordName = arpeggio.chordType

  const chordIntervals = tonalChord.intervals(chordName)

  let noteNamesWithArpeggio
  const { items: arpeggioNotes, mainNoteIndex } = arpeggio.pattern
  noteNamesWithArpeggio = arpeggioNotes.map(({ note }) => {
    const interval = note ? chordIntervals[note - 1] || '1P' : '1P'
    return transpose(baseNote, interval)
  })

  console.log('noteNamesWithArpeggio: ', noteNamesWithArpeggio)

  const notesWithArpeggio = noteNamesWithArpeggio.map((noteName, index) => {
    const isMainNote = mainNoteIndex === index

    return {
      noteName,
      isMainNote,
      color: 'black',
    }
  })

  const notesWithBaseReplacedWithArpeggio = [...notes] as PartialStaffNote[]
  notesWithBaseReplacedWithArpeggio.splice(
    baseNoteIndex,
    1,
    ...notesWithArpeggio,
  )

  return notesWithBaseReplacedWithArpeggio
}

/**
 * Generates a collection of staff notes for the session, given the note cards and session modifiers.
 *
 * @param noteCards - note cards of the session from which staff notes should be generated
 * @param modifiers - session modifiers such as chromatic approach, etc
 */
export const generateStaffTicks = ({
  noteCards,
  modifiers,
  rests,
}: {
  noteCards: NoteCardType[]
  modifiers: NoteModifiers
  // Number of rests to add after each note card
  rests: number
}): StaffTick[] => {
  const ticksPerCard: StaffTick[][] = []

  noteCards.forEach(noteCard => {
    let notesForCard: Partial<StaffNote>[] = []

    const baseStaffNote = {
      noteName: noteCard.noteName,
      color: noteCard.color,
      isMainNote: true,
    }

    notesForCard = [baseStaffNote]

    if (modifiers.arpeggio.enabled) {
      notesForCard = addArpeggioNotes(notesForCard, modifiers.arpeggio)
    }

    if (modifiers.chromaticApproaches.enabled) {
      notesForCard = addApproachNotes(
        notesForCard,
        modifiers.chromaticApproaches,
      )
    }

    const notesForCardFull: StaffNote[] = notesForCard.map(
      note =>
        ({
          ...note,
          id: uuid(),
          noteCardId: noteCard.id,
          midi: tonal.Note.midi(note.noteName),
          color: note.isMainNote ? noteCard.color : note.color,
        } as StaffNote),
    )

    let ticksForCard: StaffTick[] = notesForCardFull.map(note => ({
      id: uuid(),
      noteCardId: noteCard.id,
      notes: [note],
    }))

    // Add rests if needed
    if (rests) {
      const breakTicksForCard = new Array(rests).fill(null).map(() => ({
        id: uuid(),
        noteCardId: noteCard.id,
        // Empty array means it's a break
        notes: [],
      }))
      ticksForCard = [...ticksForCard, ...breakTicksForCard]
    }

    ticksPerCard.push(ticksForCard)
  })

  const allTicks = _.flatten(ticksPerCard)
  return allTicks
}
