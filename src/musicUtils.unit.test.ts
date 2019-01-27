import {
  getNoteNameWithSharp,
  getNotePitchClassWithSharp,
  getNoteNameAfterInstrumentTranspose,
  getEnharmonicVersionForNote,
} from './musicUtils'
import { InstrumentTransposingType } from './types'

const getNoteSharpEnharmonicsTestData = (
  octaveInput = pitch => '',
  octaveOutput = pitch => '',
) =>
  [
    ['Cb', 'B'],
    ['C', 'C'],
    ['C#', 'C#'],
    ['Db', 'C#'],
    ['D', 'D'],
    ['D#', 'D#'],
    ['Eb', 'D#'],
    ['E', 'E'],
    ['F', 'F'],
    ['F#', 'F#'],
    ['Gb', 'F#'],
    ['G', 'G'],
    ['G#', 'G#'],
    ['Ab', 'G#'],
    ['A', 'A'],
    ['A#', 'A#'],
    ['Bb', 'A#'],
    ['B', 'B'],
  ].map(([i, o]) => [`${i}${octaveInput(i)}`, `${o}${octaveOutput(i)}`])

describe('getNoteNameWithSharp', () => {
  describe('for full note names', () => {
    test.each(
      getNoteSharpEnharmonicsTestData(
        () => '4',
        pitch => (pitch === 'Cb' ? '3' : '4'),
      ),
    )('Converts note to its sharp enharmonics: %s -> %s', (note, expected) => {
      expect(getNoteNameWithSharp(note)).toBe(expected)
    })
  })
  describe('for pitch classes', () => {
    test.each(getNoteSharpEnharmonicsTestData())(
      'Converts note to its sharp enharmonics: %s -> %s',
      (note, expected) => {
        expect(getNoteNameWithSharp(note)).toBe(expected)
      },
    )
  })
})

describe('getNotePitchClassWithSharp', () => {
  describe('for full note names', () => {
    test.each(getNoteSharpEnharmonicsTestData(() => '4'))(
      'Converts note to its sharp enharmonics: %s -> %s',
      (note, expected) => {
        expect(getNotePitchClassWithSharp(note)).toBe(expected)
      },
    )
  })
  describe('for pitch classes', () => {
    test.each(getNoteSharpEnharmonicsTestData())(
      'Converts note to its sharp enharmonics: %s -> %s',
      (note, expected) => {
        expect(getNotePitchClassWithSharp(note)).toBe(expected)
      },
    )
  })
})

describe.only('getEnharmonicVersionForNote', () => {
  const getEnharmonicVersionForNoteTests = [
    ['C', 'B#'],
    ['C2', 'B#1'],
    ['C6', 'B#5'],
    ['C1', null],

    ['B#', 'C'],
    ['B#1', 'C2'],
    ['B#5', 'C6'],
    ['B#6', null],

    ['Cb', 'B'],
    ['Cb2', 'B1'],
    ['Cb6', 'B5'],
    ['Cb1', null],

    ['B', 'Cb'],
    ['B1', 'Cb2'],
    ['B5', 'Cb6'],
    ['B6', null],

    ['D', null],
    ['G', null],
    ['A', null],
    ['D3', null],
    ['G4', null],
    ['A5', null],

    ['Db', 'C#'],
    ['Db4', 'C#4'],
    ['C#', 'Db'],
    ['C#4', 'Db4'],

    ['Eb', 'D#'],
    ['Eb4', 'D#4'],
    ['D#', 'Eb'],
    ['D#4', 'Eb4'],

    ['Fb', 'E'],
    ['Fb4', 'E4'],
    ['E', 'Fb'],
    ['E4', 'Fb4'],

    ['F', 'E#'],
    ['F4', 'E#4'],
    ['E#', 'F'],
    ['E#4', 'F4'],

    ['Gb', 'F#'],
    ['Gb4', 'F#4'],
    ['F#', 'Gb'],
    ['F#4', 'Gb4'],

    ['Ab', 'G#'],
    ['Ab4', 'G#4'],
    ['G#', 'Ab'],
    ['G#4', 'Ab4'],

    ['Bb', 'A#'],
    ['Bb4', 'A#4'],
    ['A#', 'Bb'],
    ['A#4', 'Bb4'],
  ]

  test.each(getEnharmonicVersionForNoteTests)(
    '%s -> %s',
    (note, expectedEnharmonicVersion) => {
      expect(getEnharmonicVersionForNote(note)).toBe(expectedEnharmonicVersion)
    },
  )
})
