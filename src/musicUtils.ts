import * as tonal from 'tonal'
import * as tonalChord from 'tonal-chord'
import { transpose } from 'tonal-distance'
import * as _ from 'lodash'
import { memoize } from 'lodash/fp'
import uuid from 'uuid/v4'

import {
  NoteModifiers,
  StaffNote,
  ChordModifier,
  ChromaticApproachesModifier,
  StaffTick,
  NoteCardType,
  Chord,
  ArpeggioPattern,
  ArpeggioPatternElement,
  ArpeggioPatternPreset,
} from './types'

const getAllChordOptions: () => Chord[] = memoize(() => {
  return _.uniqBy(
    [
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
    }) as Chord[],
    'type',
  )
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

export const addApproachNotes = (
  ticks: StaffTick[],
  approach: ChromaticApproachesModifier,
): StaffTick[] => {
  const tickWithBaseNoteIndex = ticks.findIndex(
    ({ notes }) => notes.find(n => n.isMainNote === true) != null,
  )
  if (tickWithBaseNoteIndex < 0) {
    throw new Error(
      '"ticks" must have exactly one tick with "tick.notes[i].isMainNote ==== true"',
    )
  }

  const tickWithBaseNote = ticks[tickWithBaseNoteIndex]
  const baseNoteIndex = tickWithBaseNote.notes.findIndex(
    n => n.isMainNote === true,
  )
  const baseNote = tickWithBaseNote.notes[baseNoteIndex]

  let approachNotes: Partial<StaffNote>[] = []

  const approachType =
    approach.type === 'random' ? _.sample(['above', 'below']) : approach.type
  const intervalUp = tonal.Interval.fromSemitones(1)
  const intervalDown = `-${intervalUp}`

  if (approachType === 'above') {
    approachNotes = [
      {
        noteName: transpose(baseNote.noteName, intervalUp),
      },
    ]
  } else if (approachType === 'below') {
    approachNotes = [
      {
        noteName: transpose(baseNote.noteName, intervalDown),
      },
    ]
  } else if (approachType === 'up down') {
    approachNotes = [
      {
        noteName: transpose(baseNote.noteName, intervalUp),
      },
      {
        noteName: transpose(baseNote.noteName, intervalDown),
      },
    ]
  } else if (approachType === 'down up') {
    approachNotes = [
      {
        noteName: transpose(baseNote.noteName, intervalDown),
      },
      {
        noteName: transpose(baseNote.noteName, intervalUp),
      },
    ]
  }

  const approachNotesColor = '#1B34AC'

  const ticksWithApproachNotes = approachNotes.map(
    ({ noteName }) =>
      ({
        noteCardId: tickWithBaseNote.noteCardId,
        id: uuid(),
        notes: [
          {
            noteName,
            midi: tonal.Note.midi(noteName),
            isMainNote: false,
            color: approachNotesColor,
            id: uuid(),
          } as StaffNote,
        ],
      } as StaffTick),
  )
  const updatedTicks = [...ticks]
  updatedTicks.splice(tickWithBaseNoteIndex, 0, ...ticksWithApproachNotes)
  return updatedTicks
}

export const addChordNotes = (
  ticks: StaffTick[],
  chordModifier: ChordModifier,
): StaffTick[] => {
  const tickWithBaseNoteIndex = ticks.findIndex(
    ({ notes }) => notes.find(n => n.isMainNote === true) != null,
  )
  if (tickWithBaseNoteIndex < 0) {
    throw new Error(
      '"ticks" must have exactly one tick with "tick.notes[i].isMainNote ==== true"',
    )
  }

  const tickWithBaseNote = ticks[tickWithBaseNoteIndex]
  const baseNoteIndex = tickWithBaseNote.notes.findIndex(
    n => n.isMainNote === true,
  )
  const baseNote = tickWithBaseNote.notes[baseNoteIndex]

  const chordIntervals = tonalChord.intervals(chordModifier.chordType)

  if (!chordModifier.isMelodic) {
    // Add harmonic chord notes in a single staff tick
    const ticksUpdated = [...ticks]
    ticksUpdated.splice(tickWithBaseNoteIndex, 1, {
      ...tickWithBaseNote,
      notes: _.sortBy(
        chordIntervals
          .map((interval, index) => {
            let resultNote = transpose(baseNote.noteName, interval)
            if (
              chordModifier.chordInversion > 0 &&
              index >= chordModifier.chordInversion
            ) {
              resultNote = transpose(resultNote, '-8P')
            }
            return resultNote
          })
          .map((noteName, index) => {
            const isRootNote = index === 0
            return {
              noteName,
              midi: tonal.Note.midi(noteName),
              id: uuid(),
              color: isRootNote ? baseNote.color : 'black',
              isMainNote: isRootNote,
            } as StaffNote
          }),
        'midi',
      ),
    })

    return ticksUpdated
  }

  // Add melodic (arpeggio) chord notes, each in its own staff tick
  let noteNamesWithArpeggio
  const { items: arpeggioNotes, mainNoteIndex } = chordModifier.pattern
  noteNamesWithArpeggio = arpeggioNotes.map(({ note, muted }) => {
    if (muted) {
      return undefined
    }
    const interval = note ? chordIntervals[note - 1] || '1P' : '1P'
    return transpose(baseNote.noteName, interval)
  })

  const ticksWithArpeggioNotes = noteNamesWithArpeggio.map(
    (noteName, index) =>
      ({
        noteCardId: tickWithBaseNote.noteCardId,
        id: uuid(),
        notes: noteName
          ? [
              {
                noteName,
                id: uuid(),
                midi: tonal.Note.midi(noteName),
                isMainNote: mainNoteIndex === index,
                color: mainNoteIndex === index ? baseNote.color : 'black',
              } as StaffNote,
            ]
          : [],
      } as StaffTick),
  )

  const ticksUpdated = [...ticks]
  ticksUpdated.splice(tickWithBaseNoteIndex, 1, ...ticksWithArpeggioNotes)
  return ticksUpdated
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
    let ticksForCard: StaffTick[] = [
      {
        noteCardId: noteCard.id,
        id: uuid(),
        notes: [
          {
            id: uuid(),
            noteName: noteCard.noteName,
            midi: tonal.Note.midi(noteCard.noteName),
            color: noteCard.color,
            isMainNote: true,
          },
        ],
      },
    ]

    if (modifiers.chords.enabled) {
      ticksForCard = addChordNotes(ticksForCard, modifiers.chords)
    }

    if (modifiers.chromaticApproaches.enabled) {
      ticksForCard = addApproachNotes(
        ticksForCard,
        modifiers.chromaticApproaches,
      )
    }

    // Add rests if needed
    if (rests) {
      const breakTicksForCard = new Array(rests).fill(null).map(
        () =>
          ({
            id: uuid(),
            noteCardId: noteCard.id,
            // Empty array means it's a break
            notes: [],
          } as StaffTick),
      )
      ticksForCard = [...ticksForCard, ...breakTicksForCard]
    }

    ticksPerCard.push(ticksForCard)
  })

  const allTicks = _.flatten(ticksPerCard)
  return allTicks
}
