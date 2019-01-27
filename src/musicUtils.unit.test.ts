import { getNoteNameWithSharp, getNotePitchClassWithSharp } from './musicUtils'

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
