import * as React from 'react'
import { css } from 'react-emotion'
import * as _ from 'lodash'
import * as ReactPiano from 'react-piano'
import * as tonal from 'tonal'

import { Box } from './ui'

const pianoNoteRangeWide: MidiNoteRange = {
  first: tonal.Note.midi('C3'),
  last: tonal.Note.midi('B5'),
}

const pianoNoteRangeMiddle: MidiNoteRange = {
  first: tonal.Note.midi('G3'),
  last: tonal.Note.midi('E5'),
}

const pianoNoteRangeNarrow: MidiNoteRange = {
  first: tonal.Note.midi('C4'),
  last: tonal.Note.midi('B4'),
}

const keyboardShortcuts = ReactPiano.KeyboardShortcuts.create({
  first: pianoNoteRangeNarrow.first,
  last: pianoNoteRangeNarrow.last,
  keyboardConfig: ReactPiano.KeyboardShortcuts.QWERTY_ROW,
})

type MidiNoteRange = {
  first: number
  last: number
}

type PianoKeyboardProps = {
  width: number
  activeNotesMidi?: number[]
  activeNotesColor?: string
  noteRange?: MidiNoteRange
  onPlayNote?: (noteMidi: number) => any
  onStopNote?: (noteMidi: number) => any
}

class PianoKeyboard extends React.Component<PianoKeyboardProps> {
  public render() {
    const {
      width,
      activeNotesMidi,
      activeNotesColor,
      onPlayNote,
      onStopNote,
      noteRange,
    } = this.props

    return (
      <Box>
        <ReactPiano.Piano
          noteRange={
            noteRange
              ? noteRange
              : width > 900
                ? pianoNoteRangeWide
                : width > 600
                  ? pianoNoteRangeMiddle
                  : pianoNoteRangeNarrow
          }
          className={`${css`
            .ReactPiano__Key {
              transition: background-color 300ms;
            }

            .ReactPiano__Key--active {
              background-color: ${activeNotesColor};
            }
          `}`}
          playNote={onPlayNote}
          stopNote={onStopNote}
          activeNotes={activeNotesMidi || []}
          width={width}
          keyboardShortcuts={keyboardShortcuts}
        />
      </Box>
    )
  }
}

export default PianoKeyboard
