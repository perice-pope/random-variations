import * as React from 'react'
import { css, cx } from 'react-emotion'
import * as _ from 'lodash'
import * as ReactPiano from 'react-piano'
import * as tonal from 'tonal'
// @ts-ignore
import { lighten, darken, getLuminance, opacify, rgb, rgba } from 'polished'

import { Box } from './ui'
import { withAudioEngine } from './withAudioEngine'
import AudioEngine from '../services/audioEngine'
import { AudioFontId } from '../audioFontsConfig'
import { getNotePitchClassWithSharp } from '../musicUtils'

export const pianoNoteRangeWide: MidiNoteRange = {
  first: tonal.Note.midi('C3') as number,
  last: tonal.Note.midi('B5') as number,
}

export const pianoNoteRangeMiddle: MidiNoteRange = {
  first: tonal.Note.midi('G3') as number,
  last: tonal.Note.midi('E5') as number,
}

export const pianoNoteRangeNarrow: MidiNoteRange = {
  first: tonal.Note.midi('C4') as number,
  last: tonal.Note.midi('B4') as number,
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
  audioEngine: AudioEngine
  audioFontId: AudioFontId
  className?: any
  width: number
  height: number
  noteRange?: MidiNoteRange
  disabledNoteNames: string[]
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
  playingNoteEnvelopes: { [midi: string]: any } = {}

  state = {
    notesColor: 'rgba(0,0,0,0)',
  }

  private boxRef = React.createRef<typeof Box>()

  static getDerivedStateFromProps(props) {
    if (props.notesColor) {
      return {
        notesColor: props.notesColor,
      }
    }

    return null
  }

  private onPlayNote = noteMidi => {
    const normalizedNoteName = getNotePitchClassWithSharp(tonal.Note.fromMidi(noteMidi))

    const isDisabled =
      !!this.props.disabledNoteNames &&
      !!this.props.disabledNoteNames.find(n => n === normalizedNoteName)

    if (isDisabled) {
      return
    }

    if (this.props.onPlayNote) {
      this.props.onPlayNote(noteMidi)
    }

    this.playingNoteEnvelopes[noteMidi] = this.props.audioEngine.playNote(
      {
        midi: noteMidi,
      },
      0,
      1.5,
    )
  }

  private onStopNote = noteMidi => {
    if (this.playingNoteEnvelopes[noteMidi]) {
      this.props.audioEngine.stopNote(this.playingNoteEnvelopes[noteMidi])
      delete this.playingNoteEnvelopes[noteMidi]
    }
    if (this.props.onStopNote) {
      this.props.onStopNote(noteMidi)
    }
  }

  private getWidth = () => {
    let { width } = this.props
    if (width == null && this.boxRef.current) {
      // @ts-ignore
      width = this.boxRef.current.getBoundingClientRect().width
    }
    return width
  }

  private getNoteRange = () => {
    const { noteRange } = this.props
    const width = this.getWidth()

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
    const shouldRenderCircles = this.props.width != null
    const circleSize =
      this.props.width != null ? `${widthPerNote - 4}px` : '25px'

    const isPrimary = this.props.primaryNotesMidi
      ? this.props.primaryNotesMidi.findIndex(n => n === midiNumber) >= 0
      : false
    const isSecondary = this.props.secondaryNotesMidi
      ? this.props.secondaryNotesMidi.findIndex(n => n === midiNumber) >= 0
      : false

    const normalizedNoteName = getNotePitchClassWithSharp(
      tonal.Note.fromMidi(midiNumber),
    )

    const isDisabled =
      !!this.props.disabledNoteNames &&
      !!this.props.disabledNoteNames.find(n => n === normalizedNoteName)

    return (
      <>
        <span
          className={cx(
            isDisabled && '--disabled',
            isPrimary ? '--primary' : undefined,
            !isPrimary && isSecondary ? '--secondary' : undefined,
            'vf-key-overlay',
            css(`
              transition: 0.3s background-color;
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
            `),
          )}
        />
        {shouldRenderCircles ? (
          <span
            className={cx(
              isPrimary ? '--primary' : undefined,
              !isPrimary && isSecondary ? '--secondary' : undefined,
              'vf-note-label',
              css({
                transition: '0.3s background-color',
                display: 'inline-block',
                padding: '3px',
                width: circleSize,
                height: circleSize,
                borderRadius: '100%',
              }),
            )}
          />
        ) : null}
      </>
    )
  }

  public render() {
    const { className, height } = this.props

    let naturalColor = this.state.notesColor

    if (getLuminance(naturalColor) > 0.91) {
      naturalColor = darken(0.1, naturalColor)
    }

    let accidentalColor = this.state.notesColor
    if (getLuminance(accidentalColor) < 0.5) {
      accidentalColor = lighten(0.1, accidentalColor)
    }

    const naturalLabelColor = darken(0.1, naturalColor)
    const accidentalLabelColor = lighten(0.1, accidentalColor)

    return (
      <Box innerRef={this.boxRef}>
        <ReactPiano.Piano
          noteRange={this.getNoteRange()}
          className={cx(
            css(`
              height: ${height}px !important;

              .ReactPiano__NoteLabelContainer {
                text-align: center;
              }

              .ReactPiano__Key {
                position: absolute;
                bottom: 0;
                top: 0;

                -webkit-tap-highlight-color: rgba(0,0,0,0);
                -webkit-tap-highlight-color: transparent;
                
                .vf-note-label {
                  opacity: 0;
                }

                &:hover {
                  border: none;

                  &.ReactPiano__Key--natural {
                    background: #f6f5f3;
                    border: 1px solid #888;
                  }

                  &.ReactPiano__Key--accidental {
                    background: #555;
                    border: 1px solid #fff;
                  }

                  .vf-key-overlay {
                    background-color: ${rgba('salmon', 0.1)};
                  }
                }

                &.ReactPiano__Key--active {
                  border: none;

                  &.ReactPiano__Key--natural {
                    background: #f6f5f3;
                    border: 1px solid #888;
                  }

                  &.ReactPiano__Key--accidental {
                    background: #555;
                    border: 1px solid #fff;
                  }

                  .vf-key-overlay {
                    background-color: ${rgba('salmon', 0.4)};
                  }
                }

                &.ReactPiano__Key--natural {
                  .vf-note-label {
                    &.--primary {
                      background-color: ${naturalLabelColor} !important;
                    }
                    &.--secondary {
                      background-color: ${rgba(
                        naturalLabelColor,
                        0.3,
                      )} !important;
                    }
                  }
                }

                &.ReactPiano__Key--accidental {
                  .vf-note-label {
                    &.--primary {
                      background-color: ${accidentalLabelColor} !important;
                    }
                    &.--secondary {
                      background-color: ${rgba(
                        accidentalLabelColor,
                        0.4,
                      )} !important;
                    }
                  }
                }

                .vf-note-label {
                  &.--primary, &.--secondary  {
                    opacity: 1 !important;
                  }
                }

                &.ReactPiano__Key--natural {
                  .vf-key-overlay {
                    &.--primary {
                      background-color: ${rgba(naturalColor, 0.7)} !important;
                    }
                    &.--secondary {
                      background-color: ${rgba(naturalColor, 0.2)} !important;
                    }
                  }
                }

                &.ReactPiano__Key--accidental {
                  .vf-key-overlay {
                    &.--primary {
                      background-color: ${rgba(
                        accidentalColor,
                        0.8,
                      )} !important;
                    }
                    
                    &.--secondary {
                      background-color: ${rgba(
                        accidentalColor,
                        0.5,
                      )} !important;
                    }
                  }
                }

                &.ReactPiano__Key--accidental,&.ReactPiano__Key--natural {
                  .vf-key-overlay {
                    &.--disabled {
                      cursor: default !important;
                      background-color: #cfcfcf !important;
                    }
                  }
                }
              }
            `),
            className,
          )}
          playNote={this.onPlayNote}
          stopNote={this.onStopNote}
          width={this.getWidth()}
          keyboardShortcuts={keyboardShortcuts}
          renderNoteLabel={this.renderNoteLabel}
        />
      </Box>
    )
  }
}

export default withAudioEngine(PianoKeyboard)
