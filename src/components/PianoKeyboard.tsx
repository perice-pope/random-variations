import * as React from 'react'
import { css, cx } from 'react-emotion'
import * as _ from 'lodash'
import * as ReactPiano from 'react-piano'
import * as tonal from 'tonal'
// @ts-ignore
import { lighten, darken, getLuminance } from 'polished'

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
  noteRange?: MidiNoteRange
  primaryNotesMidi?: number[]
  secondaryNotesMidi?: number[]
  notesColor?: string
  onPlayNote?: (noteMidi: number) => any
  onStopNote?: (noteMidi: number) => any
}

type PianoKeyboardState = {
  notesColor: string
}

class PianoKeyboard extends React.Component<
  PianoKeyboardProps,
  PianoKeyboardState
> {
  midiToKeyRefMap: { [midi: string]: HTMLElement } = {}
  midiToKeyLabelRefMap: { [midi: string]: HTMLElement } = {}

  state = {
    notesColor: 'salmon',
  }

  saveNoteRef = (midi, labelComponent) => {
    this.midiToKeyLabelRefMap[midi] = labelComponent
      ? labelComponent
      : undefined
    this.midiToKeyRefMap[midi] = labelComponent
      ? labelComponent.parentElement.parentElement
      : undefined
  }

  static getDerivedStateFromProps(props) {
    if (props.notesColor) {
      return { notesColor: props.notesColor }
    }

    return null
  }

  componentDidUpdate(prevProps) {
    if (prevProps.secondaryNotesMidi !== this.props.secondaryNotesMidi) {
      // Update the secondary note classes
      if (prevProps.secondaryNotesMidi) {
        prevProps.secondaryNotesMidi.forEach(midi => {
          const keyRef = this.midiToKeyRefMap[midi]

          if (!keyRef) {
            return
          }

          if (!keyRef) {
            return
          }
          keyRef.classList.remove('ReactPiano__Key--secondary')
        })
      }

      if (this.props.secondaryNotesMidi) {
        this.props.secondaryNotesMidi.forEach(midi => {
          const keyRef = this.midiToKeyRefMap[midi]

          if (!keyRef) {
            return
          }

          if (!keyRef) {
            return
          }
          keyRef.classList.add('ReactPiano__Key--secondary')
        })
      }
    }

    if (prevProps.primaryNotesMidi !== this.props.primaryNotesMidi) {
      if (prevProps.primaryNotesMidi) {
        prevProps.primaryNotesMidi.forEach(midi => {
          const keyRef = this.midiToKeyRefMap[midi]

          if (!keyRef) {
            return
          }

          if (!keyRef) {
            return
          }
          keyRef.classList.remove('ReactPiano__Key--primary')
        })
      }

      // Update the primary note classes
      if (this.props.primaryNotesMidi) {
        this.props.primaryNotesMidi.forEach(midi => {
          const keyRef = this.midiToKeyRefMap[midi]

          if (!keyRef) {
            return
          }

          if (!keyRef) {
            return
          }
          keyRef.classList.remove('ReactPiano__Key--secondary')
          keyRef.classList.add('ReactPiano__Key--primary')
        })
      }
    }
  }

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

  private renderNoteLabel = ({ midiNumber }) => {
    const range = this.getNoteRange()
    const widthPerNote = this.props.width / (range.last - range.first + 1)
    const size = widthPerNote > 40 ? '35px' : '20px'
    return (
      <span
        className={cx(
          'vf-note-label',
          css({
            display: 'inline-block',
            padding: '3px',
            width: size,
            height: size,
            borderRadius: '100%',
            transition: '0.3s opacity',
            marginBottom: '10px',
          }),
        )}
        ref={c => this.saveNoteRef(midiNumber, c)}
      />
    )
  }

  public render() {
    const { className, height, width } = this.props

    let naturalColor = this.state.notesColor
    if (getLuminance(naturalColor) > 0.3) {
      naturalColor = darken(0.1, naturalColor)
    }

    let accidentalColor = this.state.notesColor
    if (getLuminance(accidentalColor) < 0.3) {
      accidentalColor = lighten(0.2, accidentalColor)
    }

    return (
      <Box>
        <ReactPiano.Piano
          noteRange={this.getNoteRange()}
          className={cx(
            css(`
              height: ${height}px !important;

              .ReactPiano__NoteLabelContainer {
                text-align: center;
              }

              .ReactPiano__Key {
                transition: background-color 300ms;

                .vf-note-label {
                  opacity: 0;
                }

                &.ReactPiano__Key--primary {
                  .vf-note-label {
                    opacity: 1 !important;
                  }
                }

                &.ReactPiano__Key--secondary {
                  .vf-note-label {
                    opacity: 0.4 !important;
                  }
                }
              }

              .ReactPiano__Key--natural {
                .vf-note-label {
                  background-color: ${naturalColor}
                }

                &:hover {
                  background-color: ${lighten(0.2, 'salmon')};
                }

                &.ReactPiano__Key--active {
                  &:hover {
                    background-color: ${lighten(0.1, 'salmon')};
                  }
                }
              }

              .ReactPiano__Key--accidental {
                .vf-note-label {
                  background-color: ${accidentalColor}
                }

                &:hover {
                  background-color: ${lighten(0.1, '#5E2F2D')};
                }

                &.ReactPiano__Key--active {
                  &:hover {
                    background-color: ${lighten(0.15, '#5E2F2D')};
                  }
                }
              }
            `),
            className,
          )}
          playNote={this.onPlayNote}
          stopNote={this.onStopNote}
          width={width}
          keyboardShortcuts={keyboardShortcuts}
          renderNoteLabel={this.renderNoteLabel}
        />
      </Box>
    )
  }
}

export default PianoKeyboard
