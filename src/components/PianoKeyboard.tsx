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

  getIsNoteDisabled?: (noteMidi: number) => boolean
  getIsCirclesShown?: (noteMidi: number) => boolean
  getNoteColor?: (noteMidi: number) => string | undefined

  onPlayNote?: (noteMidi: number) => any
  onStopNote?: (noteMidi: number) => any
}

class PianoKeyboard extends React.Component<PianoKeyboardProps> {
  playingNoteEnvelopes: { [midi: string]: any } = {}

  static defaultProps = {
    getNoteColor: (midi: number) => undefined,
    getIsCirclesShown: (midi: number) => false,
    getIsNoteDisabled: (midi: number) => false,
  }

  private boxRef = React.createRef<typeof Box>()

  private onPlayNote = noteMidi => {
    const isDisabled = this.props.getIsNoteDisabled!(noteMidi)
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

    const isDisabled = this.props.getIsNoteDisabled!(midiNumber)
    const isCircleShown = this.props.getIsCirclesShown!(midiNumber)

    let naturalColor = this.props.getNoteColor!(midiNumber) || 'rgba(0,0,0,0)'
    if (getLuminance(naturalColor) > 0.91) {
      naturalColor = darken(0.1, naturalColor)
    }

    let accidentalColor =
      this.props.getNoteColor!(midiNumber) || 'rgba(0,0,0,0)'
    if (getLuminance(accidentalColor) < 0.5) {
      accidentalColor = lighten(0.1, accidentalColor)
    }

    const isAccidental = tonal.Note.fromMidi(midiNumber, true).includes('#')

    const naturalLabelColor = darken(0.1, naturalColor)
    const accidentalLabelColor = lighten(0.1, accidentalColor)

    return (
      <>
        <span
          className={cx(
            isDisabled && '--disabled',
            'vf-key-overlay',
            css(`
              transition: 0.3s background-color;
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;

              background-color: ${opacify(
                isAccidental ? 0.15 : 0,
                isAccidental ? accidentalColor : naturalColor,
              )};
            `),
          )}
        />
        {shouldRenderCircles ? (
          <span
            className={cx(
              'vf-note-label',
              css({
                transition: '0.3s background-color',
                display: 'inline-block',
                padding: '3px',
                width: circleSize,
                height: circleSize,
                borderRadius: '100%',
              }),
              css(
                `background-color: ${
                  isAccidental ? accidentalLabelColor : naturalLabelColor
                };`,
              ),
              isCircleShown
                ? css(`
                  opacity: 1.0;
                `)
                : css(`
                  opacity: 0;
                `),
            )}
          />
        ) : null}
      </>
    )
  }

  public render() {
    const { className, height } = this.props

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

                &:hover {
                  border: none;

                  &.ReactPiano__Key--natural {
                    background: #f6f5f3;
                    border: 1px solid #888;

                    .vf-key-overlay {
                      background-color: ${rgba('salmon', 0.1)};
                    }
                  }

                  &.ReactPiano__Key--accidental {
                    background: #555;
                    border: 1px solid #fff;

                    .vf-key-overlay {
                      background-color: ${rgba('salmon', 0.25)};
                    }
                  }

                }

                &.ReactPiano__Key--active {
                  border: none;

                  &.ReactPiano__Key--natural {
                    background: #f6f5f3;
                    border: 1px solid #888;

                    .vf-key-overlay {
                      background-color: ${rgba('salmon', 0.4)};
                    }
                  }

                  &.ReactPiano__Key--accidental {
                    background: #555;
                    border: 1px solid #fff;

                    .vf-key-overlay {
                      background-color: ${rgba('salmon', 0.7)};
                    }
                  }
                }

                &.ReactPiano__Key--accidental, &.ReactPiano__Key--natural {
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
