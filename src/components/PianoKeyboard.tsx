import * as React from 'react'
import { css, cx } from 'react-emotion'
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
  className?: any
  width: number
  height: number
  activeNotesMidi?: number[]
  activeNotesColor?: string
  noteRange?: MidiNoteRange
  onPlayNote?: (noteMidi: number) => any
  onStopNote?: (noteMidi: number) => any
}

class PianoKeyboard extends React.Component<PianoKeyboardProps> {
  private onPlayNote = noteMidi => {
    if (this.props.onPlayNote) {
      this.props.onPlayNote(noteMidi)
    }
  }

  private onStopNote = noteMidi => {
    if (this.props.onStopNote) {
      this.props.onStopNote(noteMidi)
    }
  }

  private getNoteRange = () => {
    const { noteRange, width } = this.props

    if (noteRange) {
      return noteRange
    }
    if (width > 1000) {
      return pianoNoteRangeWide
    }
    if (width > 400) {
      return pianoNoteRangeMiddle
    }
    return pianoNoteRangeNarrow
  }

  public render() {
    const {
      className,
      height,
      width,
      activeNotesMidi,
      activeNotesColor,
    } = this.props

    return (
      <Box>
        <ReactPiano.Piano
          noteRange={this.getNoteRange()}
          className={cx(
            `${css`
              height: ${height}px !important;

              .ReactPiano__Key {
                transition: background-color 300ms;
              }

              .ReactPiano__Key--active {
                background-color: ${activeNotesColor};
              }
            `}`,
            className,
          )}
          playNote={this.onPlayNote}
          stopNote={this.onStopNote}
          activeNotes={activeNotesMidi || []}
          width={width}
          keyboardShortcuts={keyboardShortcuts}
        />
      </Box>
    )
  }
}

export default PianoKeyboard
