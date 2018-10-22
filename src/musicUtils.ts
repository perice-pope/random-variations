import * as tonal from 'tonal'
import * as Chord from 'tonal-chord'
import { transpose } from 'tonal-distance'
import * as _ from 'lodash'
import uuid from 'uuid/v4'

import {
  NoteModifiers,
  StaffNote,
  ArpeggioModifier,
  ChromaticApproachesModifier,
  StaffTick,
  NoteCardType,
} from './types'

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

  const chordName = arpeggio.type

  const chordIntervals = Chord.intervals(chordName)

  let noteNamesWithArpeggio
  let mainNoteIndex
  switch (arpeggio.direction) {
    case 'up': {
      noteNamesWithArpeggio = [
        ...chordIntervals.map(interval => transpose(baseNote, interval)),
      ]
      mainNoteIndex = 0
      break
    }
    case 'down': {
      noteNamesWithArpeggio = [
        ..._.reverse([
          ...chordIntervals.map(interval => transpose(baseNote, interval)),
        ]),
      ]
      mainNoteIndex = noteNamesWithArpeggio.length - 1
      break
    }
    case 'up down': {
      const arpeggioNotes = chordIntervals.map(interval =>
        transpose(baseNote, interval),
      )
      noteNamesWithArpeggio = [
        ...arpeggioNotes,
        ..._.reverse([...arpeggioNotes]),
      ]
      mainNoteIndex = 0
      break
    }
    case 'down up': {
      const arpeggioNotes = _.reverse([
        ...chordIntervals.map(interval => transpose(baseNote, interval)),
      ])
      noteNamesWithArpeggio = [
        ...arpeggioNotes,
        ..._.reverse([...arpeggioNotes]).slice(1),
      ]
      mainNoteIndex = arpeggioNotes.length - 1
      break
    }
    default:
      throw new Error(`Unknown arpeggio direction: ${arpeggio.direction}`)
  }

  const notesWithArpeggio = noteNamesWithArpeggio.map((noteName, index) => {
    const isMainNote = mainNoteIndex === index

    const mainColor = 'black'
    const upColor = '#10520A'
    const downColor = '#801415'

    let color = mainColor
    if (arpeggio.direction === 'up') {
      color = isMainNote ? mainColor : upColor
    } else if (arpeggio.direction === 'down') {
      color = isMainNote ? mainColor : downColor
    } else if (arpeggio.direction === 'up down') {
      if (index >= noteNamesWithArpeggio.length / 2) {
        color = downColor
      } else if (index < noteNamesWithArpeggio.length / 2) {
        color = upColor
      }
    } else if (arpeggio.direction === 'down up') {
      if (index < mainNoteIndex) {
        color = downColor
      } else if (index > mainNoteIndex) {
        color = upColor
      }
    }

    return {
      noteName,
      isMainNote,
      color,
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
