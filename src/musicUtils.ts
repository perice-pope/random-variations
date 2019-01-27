import * as tonal from 'tonal'
import { transpose, interval } from 'tonal-distance'
import { fromSemitones } from 'tonal-interval'
import * as _ from 'lodash'
import { memoize } from 'lodash/fp'
import uuid from 'uuid/v4'

import enclosuresData from './data/enclosures.json'
import chordsData from './data/chords.json'
import scalesData from './data/scales.json'

// @ts-ignore
window.interval = interval

import {
  NoteModifiers,
  StaffNote,
  ChordModifier,
  EnclosuresModifier,
  StaffTick,
  NoteCardType,
  Chord,
  ArpeggioPattern,
  ArpeggioPatternElement,
  ArpeggioPatternPreset,
  Scale,
  ScalePatternPreset,
  ScaleModifier,
  IntervalType,
  IntervalsModifier,
  Enclosure,
  EnclosuresType,
  ChordType,
  ScaleType,
  PatternDirection,
  PatternDirectionType,
  InstrumentTransposingOption,
  InstrumentTransposingType,
  ClefType,
  RhythmInfoWithTempoScaleFactor,
  NoteNameOrPitch,
  NotePitch,
} from './types'
import settingsStore from './services/settingsStore'

/**
 * E.g. "Db4" -> "C#4", "Db" -> "C#"
 */
export const getNoteNameWithSharp = (noteName: string) => {
  if (!noteName) {
    return noteName
  }
  if (noteName.includes('b')) {
    return tonal.Note.enharmonic(noteName) as string
  }
  return noteName
}

/**
 * E.g. "C#4" -> "Db4", "C#" -> "Db"
 */
export const getNoteNameWithFlat = (noteName: string) => {
  if (!noteName) {
    return noteName
  }
  if (noteName.includes('#')) {
    return tonal.Note.enharmonic(noteName) as string
  }
  return noteName
}

/**
 * E.g. "Db4" -> "C#"
 */
export const getNotePitchClassWithSharp = (noteName: string) => {
  const pc = tonal.Note.pc(noteName) as string
  if (!pc) {
    return noteName
  }
  if (pc.includes('b')) {
    return tonal.Note.enharmonic(pc) as string
  }
  return pc
}

/**
 * E.g. "C#4" -> "Db"
 */
export const getNotePitchClassWithFlat = (noteName: string) => {
  const pc = tonal.Note.pc(noteName) as string
  if (!pc) {
    return noteName
  }
  if (pc.includes('#')) {
    return tonal.Note.enharmonic(pc) as string
  }
  return pc
}

const enharmonicNoteVersion: { [k: string]: NotePitch } = {
  C: 'B#',
  'B#': 'C',
  Db: 'C#',
  'C#': 'Db',
  Eb: 'D#',
  'D#': 'Eb',
  E: 'Fb',
  'E#': 'F',
  Fb: 'E',
  F: 'E#',
  Gb: 'F#',
  'F#': 'Gb',
  Ab: 'G#',
  'G#': 'Ab',
  Bb: 'A#',
  'A#': 'Bb',
  B: 'Cb',
  Cb: 'B',
}

export const getEnharmonicVersionForNote = _.memoize(
  (note: NoteNameOrPitch) => {
    const pitch = tonal.Note.pc(note)

    if (!pitch) {
      return null
    }

    if (pitch === note) {
      const enharmonicPitch = enharmonicNoteVersion[pitch]
      return enharmonicPitch ? enharmonicPitch : null
    }

    const enharmonicPitch = enharmonicNoteVersion[pitch]

    if (!enharmonicPitch) {
      return null
    }

    const octave = tonal.Note.oct(note) as number
    if (pitch === 'C' || pitch === 'Cb') {
      // Octave changes to the previous octave
      const newOctave = octave - 1
      if (newOctave < 1) {
        return null
      }

      return `${enharmonicPitch}${newOctave}`
    }

    if (pitch === 'B#' || pitch === 'B') {
      // Octave changes to the next octave
      const newOctave = octave + 1
      if (newOctave > 6) {
        return null
      }

      return `${enharmonicPitch}${newOctave}`
    }

    return `${enharmonicPitch}${octave}`
  },
)

export const getNoteNameAfterInstrumentTranspose = (
  transposing: InstrumentTransposingType,
  noteName: string,
) => {
  let noteNameTransposed = noteName

  const transposingConfig = instrumentTransposingOptionsByType[transposing]
  if (transposingConfig) {
    noteNameTransposed = tonal.transpose(
      noteNameTransposed,
      transposingConfig.interval,
    ) as string
  }

  return noteNameTransposed
}

export const NoteNamesWithSharps = [
  'A',
  'A#',
  'B',
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
]

export const SemitonesToIntervalLongNameMap: { [k in IntervalType]: string } = {
  '1P': 'Unison',
  '2m': 'Minor second',
  '2M': 'Major second',
  '3m': 'Minor third',
  '3M': 'Major third',
  '4P': 'Perfect fourth',
  '5d': 'Tritone',
  '5P': 'Perfect fifth',
  '6m': 'Minor sixth',
  '6M': 'Major sixth',
  '7m': 'Minor seventh',
  '7M': 'Major seventh',
  '8P': 'Perfect octave',
}

export const SemitonesToIntervalNameMap: { [k in IntervalType]: string } = {
  '1P': 'Unison',
  '2m': 'Minor 2nd',
  '2M': 'Major 2nd',
  '3m': 'Minor 3rd',
  '3M': 'Major 3rd',
  '4P': 'Perfect 4th',
  '5d': 'Tritone',
  '5P': 'Perfect 5th',
  '6m': 'Minor 6th',
  '6M': 'Major 6th',
  '7m': 'Minor 7th',
  '7M': 'Major 7th',
  '8P': 'Octave',
}

export const ClefTypeToDefaultOctave: { [k in ClefType]: number } = {
  treble: 4,
  soprano: 4,
  'mezzo-soprano': 4,
  french: 4,
  tenor: 3,
  alto: 3,
  'baritone-c': 3,
  'baritone-f': 3,
  bass: 2,
  subbass: 2,
}

export const SemitonesToIntervalShortNameMap: {
  [k in IntervalType]: string
} = {
  '1P': 'P1',
  '2m': 'Mi2',
  '2M': 'Ma2',
  '3m': 'Mi3',
  '3M': 'Ma3',
  '4P': 'P4',
  '5d': 'tt',
  '5P': 'P5',
  '6m': 'Mi6',
  '6M': 'Ma6',
  '7m': 'Mi7',
  '7M': 'Ma7',
  '8P': 'P8',
}

export const getSemitonesTransposer = memoize((semitones: number) => {
  const transposer = note => {
    return transpose(note, fromSemitones(semitones))
  }

  return transposer
})

// @ts-ignore
window.transpose = transpose
// @ts-ignore
window.tonal = tonal
// @ts-ignore
window.getSemitonesUpTransposer = getSemitonesTransposer

const getAllPatternDirectionOptions: () => PatternDirection[] = () => {
  return [
    {
      pattern: ['forward'],
    } as Partial<PatternDirection>,
    {
      pattern: ['reversed'],
    } as Partial<PatternDirection>,
    {
      pattern: ['forward', 'reversed'],
    } as Partial<PatternDirection>,
    {
      pattern: ['reversed', 'forward'],
    } as Partial<PatternDirection>,

    {
      pattern: ['forward', 'forward', 'reversed'],
    } as Partial<PatternDirection>,
    {
      pattern: ['forward', 'reversed', 'forward'],
    } as Partial<PatternDirection>,
    {
      pattern: ['forward', 'reversed', 'reversed'],
    } as Partial<PatternDirection>,
    {
      pattern: ['reversed', 'forward', 'forward'],
    } as Partial<PatternDirection>,
    {
      pattern: ['reversed', 'forward', 'reversed'],
    } as Partial<PatternDirection>,
    {
      pattern: ['reversed', 'reversed', 'forward'],
    } as Partial<PatternDirection>,
    {
      pattern: ['reversed', 'reversed', 'forward'],
    } as Partial<PatternDirection>,

    {
      pattern: ['forward', 'forward', 'forward', 'reversed'],
    } as Partial<PatternDirection>,
    {
      pattern: ['forward', 'forward', 'reversed', 'forward'],
    } as Partial<PatternDirection>,
    {
      pattern: ['forward', 'reversed', 'forward', 'forward'],
    } as Partial<PatternDirection>,
    {
      pattern: ['reversed', 'forward', 'forward', 'forward'],
    } as Partial<PatternDirection>,

    {
      pattern: ['forward', 'forward', 'reversed', 'reversed'],
    } as Partial<PatternDirection>,
    {
      pattern: ['forward', 'reversed', 'forward', 'reversed'],
    } as Partial<PatternDirection>,
    {
      pattern: ['forward', 'reversed', 'reversed', 'forward'],
    } as Partial<PatternDirection>,
    {
      pattern: ['reversed', 'forward', 'forward', 'reversed'],
    } as Partial<PatternDirection>,
    {
      pattern: ['reversed', 'forward', 'reversed', 'forward'],
    } as Partial<PatternDirection>,
    {
      pattern: ['reversed', 'reversed', 'forward', 'forward'],
    } as Partial<PatternDirection>,

    {
      pattern: ['forward', 'reversed', 'reversed', 'reversed'],
    } as Partial<PatternDirection>,
    {
      pattern: ['reversed', 'forward', 'reversed', 'reversed'],
    } as Partial<PatternDirection>,
    {
      pattern: ['reversed', 'reversed', 'forward', 'reversed'],
    } as Partial<PatternDirection>,
    {
      pattern: ['reversed', 'reversed', 'reversed', 'forward'],
    } as Partial<PatternDirection>,
  ].map(
    ({ pattern }) =>
      ({
        pattern,
        title: pattern!.map(x => _.capitalize(x)).join(' / '),
        type: pattern!.map(x => x[0]).join(''),
      } as PatternDirection),
  )
}

const getAllChordOptions: () => Chord[] = memoize(() => {
  return _.uniqBy(
    // @ts-ignore
    chordsData.map(
      ({ name, symbol, semitones, intervals, category, notes }) => {
        return {
          semitones,
          intervals,
          category,
          notes,
          type: symbol,
          title: name,
          notesCount: semitones.length,
        } as Chord
      },
    ) as Chord[],
    'type',
  )
})

const getAllEnclosureOptions: () => Enclosure[] = memoize(() => {
  return _.uniqBy(
    // @ts-ignore
    enclosuresData.map(({ type, title, semitones }) => {
      return {
        semitones,
        type,
        title,
      } as Enclosure
    }) as Enclosure[],
    'type',
  )
})

const getAllScaleOptions: () => Scale[] = memoize(() => {
  return _.uniqBy(
    // @ts-ignore
    scalesData.map(({ name, notes, mode, semitones, intervals }) => {
      return {
        semitones,
        intervals,
        mode,
        notes,
        type: name,
        title: name,
        notesCount: semitones.length,
      } as Scale
    }),
    'type',
  )
})

const getAllInstrumentTransposingOptions: () => InstrumentTransposingOption[] = memoize(
  () => {
    return [
      {
        type: 'C',
        title: 'C (no transposing)',
        interval: '1P',
      },
      {
        type: 'Bb',
        title: 'Bb (written D, sounds C)',
        interval: '2M',
      },
      {
        type: 'A',
        title: 'A (written Eb, sounds C)',
        interval: '3m',
      },
      {
        type: 'G',
        title: 'G (written F, sounds C)',
        interval: '4P',
      },
      {
        type: 'F',
        title: 'F (written G, sounds C)',
        interval: '5P',
      },
      {
        type: 'Eb',
        title: 'Eb (written A, sounds C)',
        interval: '6M',
      },
      // TODO: add more insturments
    ].map(
      ito =>
        ({
          ...ito,
          title: ito.title || ito.type,
        } as InstrumentTransposingOption),
    )
  },
)

const getAllRhythmOptions = () => {
  const rawData = [
    ['10', '1', '10.00', ''],
    ['9', '1', '9.00', ''],
    ['8', '1', '8.00', 'Double Whole Note'],
    ['7', '1', '7.00', ''],
    ['6', '1', '6.00', 'Dotted Whole Note'],
    ['5', '1', '5.00', ''],
    ['9', '2', '4.50', ''],
    ['4', '1', '4.00', 'Whole Note'],
    ['7', '2', '3.50', 'Double Dotted Half Note'],
    ['10', '3', '3.33', ''],
    ['3', '1', '3.00', 'Dotted Half Note'],
    ['8', '3', '2.67', ''],
    ['5', '2', '2.50', ''],
    ['7', '3', '2.33', ''],
    ['9', '4', '2.25', ''],
    ['2', '1', '2.00', 'Half Note'],
    ['9', '5', '1.80', ''],
    ['7', '4', '1.75', 'Double Dotted Quarter Note'],
    ['5', '3', '1.67', ''],
    ['8', '5', '1.60', 'Half Note Quintuplet'],
    ['3', '2', '1.50', 'Dotted Quarter Note'],
    ['10', '7', '1.43', ''],
    ['7', '5', '1.40', ''],
    ['4', '3', '1.33', 'Half Note Triplet'],
    ['9', '7', '1.29', ''],
    ['5', '4', '1.25', ''],
    ['6', '5', '1.20', ''],
    ['7', '6', '1.17', ''],
    ['8', '7', '1.14', 'Half Note Septuplet'],
    ['9', '8', '1.13', ''],
    ['10', '9', '1.11', ''],
    ['1', '1', '1.00', 'Quarter Note'],
    ['9', '10', '0.90', ''],
    ['8', '9', '0.89', ''],
    ['7', '8', '0.88', ''],
    ['6', '7', '0.86', ''],
    ['5', '6', '0.83', ''],
    ['4', '5', '0.80', 'Quarter Note Quintuplet'],
    ['7', '9', '0.78', ''],
    ['3', '4', '0.75', '"Dotted 8th (Quarter Note Quadruplet)'],
    ['5', '7', '0.71', ''],
    ['7', '10', '0.70', ''],
    ['2', '3', '0.67', 'Quarter Note Triplet'],
    ['5', '8', '0.63', ''],
    ['3', '5', '0.60', ''],
    ['4', '7', '0.57', ''],
    ['5', '9', '0.56', ''],
    ['1', '2', '0.50', '8th Note'],
    ['4', '9', '0.44', '8th Note Nontuplet'],
    ['3', '7', '0.43', ''],
    ['2', '5', '0.40', '8th Note Quintuplet'],
    ['3', '8', '0.38', 'Dotted 16th Note'],
    ['1', '3', '0.33', '8th Note Triplet'],
    ['3', '10', '0.30', ''],
    ['2', '7', '0.29', '8th Note Septuplet'],
    ['1', '4', '0.25', '16th Note'],
    ['2', '9', '0.22', '16th Note Nontuplet'],
    ['1', '5', '0.20', '16th Note Quintuplet'],
    ['1', '6', '0.17', '16th Note Sextuplet'],
    ['1', '7', '0.14', '16th Note Septuplet'],
    ['1', '8', '0.13', '32nd Note'],
    ['1', '9', '0.11', '32nd Note Nontuplet'],
    ['1', '10', '0.10', '32nd Note Dectuplet'],
    ['1', '16', '0.06', '64th Note'],
  ]

  const results: RhythmInfoWithTempoScaleFactor[] = rawData.map(
    ([beats, divisions, , title]) =>
      ({
        title,
        beats: parseInt(beats, 10),
        divisions: parseInt(divisions, 10),
        tempoFactor: parseInt(divisions, 10) / parseInt(beats, 10),
      } as RhythmInfoWithTempoScaleFactor),
  )

  return _.sortBy(results, 'tempoFactor')
}

export const rhythmOptions = getAllRhythmOptions()

export const instrumentTransposingOptions = getAllInstrumentTransposingOptions()
export const instrumentTransposingOptionsByType = _.keyBy(
  instrumentTransposingOptions,
  'type',
) as { [type in InstrumentTransposingType]: InstrumentTransposingOption }

export const chordOptions = getAllChordOptions()
export const chordsByChordType = _.keyBy(chordOptions, 'type') as {
  [type in ChordType]: Chord
}

export const scaleOptions = getAllScaleOptions()
export const scaleByScaleType = _.keyBy(scaleOptions, 'type') as {
  [type in ScaleType]: Scale
}

export const enclosureOptions = getAllEnclosureOptions()
export const enclosureByEnclosureType = _.keyBy(enclosureOptions, 'type') as {
  [type in EnclosuresType]: Enclosure
}

export const patternDirectionOptions = getAllPatternDirectionOptions()
export const patternDirectionByType = _.keyBy(
  patternDirectionOptions,
  'type',
) as {
  [type: string]: PatternDirection
}

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

const ladderUp = (start: number, end: number) => {
  const result: number[] = []

  if (start === end) {
    return [start]
  }

  if (start === end - 1) {
    return [start, end]
  }

  let i = start
  while (i + 2 <= end) {
    result.push(i)
    result.push(i + 2)
    i += 1
  }
  return result
}

const ladderDown = (start: number, end: number) => {
  const result: number[] = []
  if (start === end) {
    return [start]
  }

  if (start === end - 1) {
    return [end, start]
  }

  let i = end
  while (i - 2 >= start) {
    result.push(i)
    result.push(i - 2)
    i -= 1
  }
  return result
}

export const generateScalePatternFromPreset = ({
  scale,
  patternPreset,
}: {
  scale: Scale
  patternPreset: ScalePatternPreset
}) => {
  let items: ArpeggioPatternElement[]
  let mainNoteIndex
  switch (patternPreset) {
    case 'up': {
      items = _.range(1, scale.notesCount + 1, 1).map(note => ({ note }))
      mainNoteIndex = 0
      break
    }
    case 'up, skip 1': {
      items = ladderUp(1, scale.notesCount).map(note => ({ note }))
      mainNoteIndex = 0
      break
    }
    case 'down': {
      items = _.range(scale.notesCount, 0, -1).map(note => ({ note }))
      mainNoteIndex = 0
      break
    }
    case 'down, skip 1': {
      items = ladderDown(1, scale.notesCount).map(note => ({ note }))
      mainNoteIndex = 0
      break
    }
    case 'up down': {
      items = [
        ..._.range(1, scale.notesCount + 1, 1).map(note => ({ note })),
        ..._.range(scale.notesCount - 1, 0, -1).map(note => ({ note })),
      ]
      mainNoteIndex = 0
      break
    }
    case 'down up': {
      items = [
        ..._.range(scale.notesCount, 0, -1).map(note => ({ note })),
        ..._.range(2, scale.notesCount + 1, 1).map(note => ({ note })),
      ]
      mainNoteIndex = 0
      break
    }
    case 'down up, skip 1': {
      items = [
        ...ladderDown(1, scale.notesCount),
        ..._.slice(ladderUp(1, scale.notesCount), 1),
      ].map(note => ({ note }))
      mainNoteIndex = 0
      break
    }
    case 'up down, skip 1': {
      items = [
        ...ladderUp(1, scale.notesCount),
        ..._.slice(ladderDown(1, scale.notesCount), 1),
      ].map(note => ({ note }))
      mainNoteIndex = 0
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

export const addEnclosureNotes = (
  ticks: StaffTick[],
  enclosureModifier: EnclosuresModifier,
): StaffTick[] => {
  if (!ticks || ticks.length === 0) {
    return ticks
  }
  let tickWithBaseNoteIndex = ticks.findIndex(
    ({ notes }) => notes.find(n => n.isMainNote === true) != null,
  )
  if (tickWithBaseNoteIndex < 0) {
    tickWithBaseNoteIndex = 0
    console.error(
      '"ticks" must have exactly one tick with "tick.notes[i].isMainNote ==== true"',
    )
  }

  const tickWithBaseNote = ticks[tickWithBaseNoteIndex]
  let baseNoteIndex = tickWithBaseNote.notes.findIndex(
    n => n.isMainNote === true,
  )

  if (baseNoteIndex < 0) {
    baseNoteIndex = 0
  }
  const baseNote = tickWithBaseNote.notes[baseNoteIndex]

  let enclosureNotes: Partial<StaffNote>[] = []

  const enclosureToUse =
    enclosureModifier.enclosure.type === 'random'
      ? _.sample(enclosureOptions)!
      : enclosureModifier.enclosure

  enclosureNotes = enclosureToUse.semitones
    .map(semitoneStep => {
      // For notes above the base note, use flats
      if (semitoneStep > 0) {
        return tonal.Note.fromMidi(
          tonal.Note.midi(baseNote.noteName)! + semitoneStep,
        )
      }
      // For notes above the base note, use sharps
      return tonal.Note.fromMidi(
        tonal.Note.midi(baseNote.noteName)! + semitoneStep,
        true,
      )
    })
    .map(noteName => ({ noteName }))

  const enclosureNotesColor = '#1B34AC'

  const ticksWithEnclosureNotes = enclosureNotes.map(
    ({ noteName }) =>
      ({
        noteCardId: tickWithBaseNote.noteCardId,
        id: uuid(),
        notes: [
          {
            noteName,
            midi: tonal.Note.midi(noteName!),
            isMainNote: false,
            color: enclosureNotesColor,
            id: uuid(),
          } as StaffNote,
        ],
      } as StaffTick),
  )
  const updatedTicks = [...ticks]
  updatedTicks.splice(tickWithBaseNoteIndex, 0, ...ticksWithEnclosureNotes)
  return updatedTicks
}

const DEFAULT_SCALE_NAME = 'ionian'
const DEFAULT_CHORD_NAME = 'maj'

export const addChordNotes = (
  ticks: StaffTick[],
  chordModifier: ChordModifier,
): StaffTick[] => {
  let tickWithBaseNoteIndex = ticks.findIndex(
    ({ notes }) => notes.find(n => n.isMainNote === true) != null,
  )
  if (tickWithBaseNoteIndex < 0) {
    tickWithBaseNoteIndex = 0
    console.error(
      '"ticks" must have exactly one tick with "tick.notes[i].isMainNote ==== true"',
    )
  }

  const tickWithBaseNote = ticks[tickWithBaseNoteIndex]
  let baseNoteIndex = tickWithBaseNote.notes.findIndex(
    n => n.isMainNote === true,
  )
  if (baseNoteIndex < 0) {
    baseNoteIndex = 0
  }
  const baseNote = tickWithBaseNote.notes[baseNoteIndex]

  const chord =
    chordsByChordType[chordModifier.chordType] ||
    chordsByChordType[DEFAULT_CHORD_NAME]

  if (!chordModifier.isMelodic) {
    // Add harmonic chord notes in a single staff tick
    const ticksUpdated = [...ticks]
    ticksUpdated.splice(tickWithBaseNoteIndex, 1, {
      ...tickWithBaseNote,
      notes: _.sortBy(
        chord.intervals
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
              color: 'black',
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
    const interval = note ? chord.intervals[note - 1] || '1P' : '1P'
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
                color: 'black',
              } as StaffNote,
            ]
          : [],
      } as StaffTick),
  )

  const ticksUpdated = [...ticks]
  ticksUpdated.splice(tickWithBaseNoteIndex, 1, ...ticksWithArpeggioNotes)
  return ticksUpdated
}

export const addScaleNotes = (
  ticks: StaffTick[],
  scaleModifier: ScaleModifier,
): StaffTick[] => {
  let tickWithBaseNoteIndex = ticks.findIndex(
    ({ notes }) => notes.find(n => n.isMainNote === true) != null,
  )
  if (tickWithBaseNoteIndex < 0) {
    tickWithBaseNoteIndex = 0
    console.error(
      '"ticks" must have exactly one tick with "tick.notes[i].isMainNote ==== true"',
    )
  }

  const tickWithBaseNote = ticks[tickWithBaseNoteIndex]
  let baseNoteIndex = tickWithBaseNote.notes.findIndex(
    n => n.isMainNote === true,
  )
  if (baseNoteIndex < 0) {
    baseNoteIndex = 0
  }
  const baseNote = tickWithBaseNote.notes[baseNoteIndex]

  const scale =
    scaleByScaleType[scaleModifier.scaleType] ||
    scaleByScaleType[DEFAULT_SCALE_NAME]
  const { intervals } = scale || []

  // Add melodic (arpeggio) scale notes, each in its own staff tick
  let noteNamesWithArpeggio
  const { items: arpeggioNotes } = scaleModifier.pattern
  noteNamesWithArpeggio = arpeggioNotes.map(({ note, muted }) => {
    if (muted) {
      return undefined
    }
    const interval = note ? intervals[note - 1] || '1P' : '1P'
    return tonal.Distance.transpose(baseNote.noteName, interval)
  })

  const ticksWithArpeggioNotes = noteNamesWithArpeggio.map(
    (noteName, index) => {
      return {
        noteCardId: tickWithBaseNote.noteCardId,
        id: uuid(),
        notes: noteName
          ? [
              {
                noteName,
                isMainNote: false,
                id: uuid(),
                midi: tonal.Note.midi(noteName),
                color:
                  tonal.Note.pc(noteName) === tonal.Note.pc(baseNote.noteName)
                    ? baseNote.color
                    : 'black',
              } as StaffNote,
            ]
          : [],
      } as StaffTick
    },
  )

  const ticksUpdated = [...ticks]
  ticksUpdated.splice(tickWithBaseNoteIndex, 1, ...ticksWithArpeggioNotes)
  return ticksUpdated
}

export const addIntervalNotes = (
  ticks: StaffTick[],
  intervals: IntervalsModifier,
): StaffTick[] => {
  let tickWithBaseNoteIndex = ticks.findIndex(
    ({ notes }) => notes.find(n => n.isMainNote === true) != null,
  )
  if (tickWithBaseNoteIndex < 0) {
    tickWithBaseNoteIndex = 0
    console.error(
      '"ticks" must have exactly one tick with "tick.notes[i].isMainNote ==== true"',
    )
  }

  const tickWithBaseNote = ticks[tickWithBaseNoteIndex]
  let baseNoteIndex = tickWithBaseNote.notes.findIndex(
    n => n.isMainNote === true,
  )
  if (baseNoteIndex < 0) {
    baseNoteIndex = 0
  }
  const baseNote = tickWithBaseNote.notes[baseNoteIndex]

  const { interval, type, direction } = intervals

  const intervalNoteName = transpose(
    baseNote.noteName,
    `${direction === 'ascending' ? '' : '-'}${interval}`,
  )

  if (!intervalNoteName) {
    return []
  }

  let ticksWithIntervals: StaffTick[]
  if (type === 'stacked') {
    ticksWithIntervals = [
      {
        noteCardId: tickWithBaseNote.noteCardId,
        id: uuid(),
        notes: [
          {
            color: 'red',
            id: uuid(),
            isMainNote: true,
            midi: tonal.Note.midi(baseNote.noteName),
            noteName: baseNote.noteName,
          },
          {
            color: 'black',
            id: uuid(),
            isMainNote: false,
            midi: tonal.Note.midi(intervalNoteName),
            noteName: intervalNoteName,
          },
        ],
      } as StaffTick,
    ]
  } else {
    ticksWithIntervals = [
      {
        noteCardId: tickWithBaseNote.noteCardId,
        id: uuid(),
        notes: [
          {
            color: 'red',
            id: uuid(),
            isMainNote: true,
            midi: tonal.Note.midi(baseNote.noteName),
            noteName: baseNote.noteName,
          },
        ],
      } as StaffTick,
      {
        noteCardId: tickWithBaseNote.noteCardId,
        id: uuid(),
        notes: [
          {
            color: 'black',
            id: uuid(),
            isMainNote: false,
            midi: tonal.Note.midi(intervalNoteName),
            noteName: intervalNoteName,
          },
        ],
      } as StaffTick,
    ]
  }

  const ticksUpdated = [...ticks]
  ticksUpdated.splice(tickWithBaseNoteIndex, 1, ...ticksWithIntervals)
  return ticksUpdated
}

/**
 * Generates a collection of staff notes for the session, given the note cards and session modifiers.
 *
 * @param noteCards - note cards of the session from which staff notes should be generated
 * @param modifiers - session modifiers such as chromatic enclosure, etc
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
}): { ticks: StaffTick[]; tickLabels: { [tickIndex: number]: string } } => {
  const ticksPerCard: StaffTick[][] = []
  const tickLabels: { [tickIndex: number]: string } = {}

  let currentTickIndex = 0
  let currentDirectionIndex = 0

  noteCards.forEach((noteCard, noteCardIndex) => {
    let ticksForCard: StaffTick[] = [
      {
        noteCardId: noteCard.id,
        id: uuid(),
        notes: [
          {
            id: uuid(),
            noteName: noteCard.noteName,
            midi: tonal.Note.midi(noteCard.noteName) as number,
            color: noteCard.color,
            isMainNote: true,
          },
        ],
      },
    ]

    if (modifiers.chords.enabled) {
      ticksForCard = addChordNotes(ticksForCard, modifiers.chords)
    } else if (modifiers.scales.enabled) {
      ticksForCard = addScaleNotes(ticksForCard, modifiers.scales)
    } else if (modifiers.intervals.enabled) {
      ticksForCard = addIntervalNotes(ticksForCard, modifiers.intervals)
    }

    if (modifiers.enclosures.enabled) {
      ticksForCard = addEnclosureNotes(ticksForCard, modifiers.enclosures)
    }

    if (modifiers.directions.enabled) {
      let direction: PatternDirectionType = 'forward'
      if (modifiers.directions.random) {
        direction = Math.random() > 0.5 ? 'forward' : 'reversed'
      } else {
        direction =
          modifiers.directions.direction.pattern[currentDirectionIndex]
        currentDirectionIndex =
          (currentDirectionIndex + 1) %
          modifiers.directions.direction.pattern.length
      }

      if (direction === 'reversed') {
        ticksForCard = ticksForCard.reverse()
      }
    }

    ticksForCard.forEach(tick => {
      tick.notes.forEach(note => {
        note.color =
          note.noteName === noteCard.noteName ? noteCard.color : note.color
      })
    })

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

    // Generate tick labels (with chord names if needed)
    let noteNameTransposed = noteCard.noteName
    if (settingsStore.instrumentTransposing !== 'C') {
      const transposingConfig =
        instrumentTransposingOptionsByType[settingsStore.instrumentTransposing]
      if (transposingConfig) {
        noteNameTransposed = tonal.transpose(
          noteNameTransposed,
          transposingConfig.interval,
        ) as string
      }
    }

    tickLabels[currentTickIndex] = `${tonal.Note.pc(noteNameTransposed)}${
      modifiers.chords.enabled ? modifiers.chords.chordType : ''
    }`
    currentTickIndex += ticksForCard.length

    ticksPerCard.push(ticksForCard)
  })

  const allTicks = _.flatten(ticksPerCard)
  return { ticks: allTicks, tickLabels }
}
