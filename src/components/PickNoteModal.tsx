import * as React from 'react'
import * as _ from 'lodash'
import * as tonal from 'tonal'
import * as TonalRange from 'tonal-range'

import PianoKeyboard from './PianoKeyboard'

import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import PlusIcon from '@material-ui/icons/Add'
import MinusIcon from '@material-ui/icons/Remove'
import withMobileDialog, {
  InjectedProps,
} from '@material-ui/core/withMobileDialog'
import { observer } from 'mobx-react'

import { Flex, Box, BaseButton, Paper, BaseButtonProps } from './ui'

import { getNoteCardColorByNoteName } from '../utils'
import { ChromaticNoteSharps } from '../types'
import { css } from 'emotion'
import { lighten } from 'polished'
import {
  withAudioEngine,
  WithAudioEngineInjectedProps,
} from './withAudioEngine'
import styled from 'react-emotion'
import settingsStore from '../services/settingsStore'
import { IconButton, Typography } from '@material-ui/core'
import {
  getNotePitchClassWithSharp,
  instrumentTransposingOptionsByType,
} from '../musicUtils'

type PickNoteModalProps = {
  disabledNoteNames?: string[]
  isOpen: boolean
  onClose: () => any
  onSubmit: (args: { noteName: string }) => any
  noteName?: string
}

type PickNoteModalState = {
  range?: any
  noteName?: string
  notePitchName?: string
  octave?: number

  noteNameMouseOver?: string
}

type NoteButtonProps = {
  active: boolean
} & BaseButtonProps

const NoteButton = styled(BaseButton)<NoteButtonProps>`
  transition: all 200ms;
  transform: ${({ active }) => (active ? 'scale(1.2)' : 'none')};

  background-color: ${({ active, bg }) =>
    active ? lighten(0.1, bg as string) : bg};

  ${({ active, bg }) => (active ? lighten(0.1, bg as string) : bg)};
`

// @ts-ignore
@observer
class PickNoteModal extends React.Component<
  PickNoteModalProps & InjectedProps & WithAudioEngineInjectedProps,
  PickNoteModalState
> {
  state: PickNoteModalState

  constructor(props) {
    super(props)
    this.state = {
      range: this.getNoteRange(props.noteName),
      noteName: props.noteName,
      octave: props.noteName ? tonal.Note.oct(props.noteName)! : 4,
      notePitchName: props.noteName
        ? tonal.Note.pc(props.noteName)!
        : undefined,
    }
  }

  componentDidUpdate(
    prevProps: PickNoteModalProps &
      InjectedProps &
      WithAudioEngineInjectedProps,
  ) {
    if (this.props.isOpen !== prevProps.isOpen && this.props.isOpen) {
      this.setState({
        octave: this.props.noteName ? tonal.Note.oct(this.props.noteName)! : 4,
        notePitchName: this.props.noteName
          ? tonal.Note.pc(this.props.noteName)!
          : undefined,
        range: this.getNoteRange(this.props.noteName),
        noteName: this.props.noteName,
      })
    }
  }

  getNoteRange = noteName => {
    console.log('getNoteRange', noteName)
    const octave = noteName ? tonal.Note.oct(noteName)! : 4
    const firstNote = octave === 1 ? `C${octave}` : `A${octave - 1}`
    const lastNote = octave === 6 ? `B${octave}` : `D${octave + 1}`
    const noteRange = {
      first: tonal.Note.midi(firstNote),
      last: tonal.Note.midi(lastNote),
    }
    return noteRange
  }

  setNoteNameMouseOver = noteName => {
    this.setState({ noteNameMouseOver: noteName })
  }

  handleIncreaseOctave = () => {
    this.setOctave(this.state.octave != null ? this.state.octave + 1 : 1)
  }

  handleDecreaseOctave = () => {
    this.setOctave(this.state.octave != null ? this.state.octave - 1 : 6)
  }

  submit = () => {
    if (this.state.noteName) {
      this.props.onSubmit({ noteName: this.state.noteName })
    }
  }

  private handleOctaveChange = e => {
    let octaveValue = this.state.octave
    try {
      if (!e.target.value) {
        octaveValue = undefined
      } else {
        octaveValue = parseInt(e.target.value, 10)
        if (isNaN(octaveValue)) {
          octaveValue = undefined
        } else if (octaveValue < 1) {
          octaveValue = 1
        } else if (octaveValue > 6) {
          octaveValue = 6
        }
      }
    } finally {
      console.log('TCL: octaveValue', octaveValue)
      this.setOctave(octaveValue)
    }
  }

  private setOctave = octave => {
    const octaveValue =
      octave != null ? Math.max(1, Math.min(octave, 6)) : undefined

    if (octaveValue != null && this.state.noteName != null) {
      const newNoteName = `${tonal.Note.pc(this.state.noteName)}${octaveValue}`
      this.onNoteSelected(newNoteName)
    } else {
      this.setState({
        octave: octaveValue,
      })
    }
  }

  onNoteSelected = (noteName?: string, skipPlayingNote?: boolean) => {
    if (!noteName) {
      this.setState({
        noteName: undefined,
        notePitchName: undefined,
        octave: undefined,
      })
      return
    }

    console.log('TCL: onNoteSelected -> noteName', noteName)
    const noteEnharmonicName = tonal.Note.enharmonic(noteName) as string

    setTimeout(() => this.setState({ range: this.getNoteRange(noteName) }), 100)

    if (!skipPlayingNote) {
      this.props.audioEngine.playNote(
        {
          midi: tonal.Note.midi(noteName)!,
        },
        0,
        0.5,
      )
    }

    if (noteName !== noteEnharmonicName && this.state.noteName === noteName) {
      // This is a second click on a card with "enharmonic-capable" note...
      // this.props.onEnharmonicChange(noteNameWithSharp)
      const noteNameWithSharp = (noteName.includes('#')
        ? noteName
        : noteEnharmonicName) as string
      const notePitchWithSharp = tonal.Note.pc(
        noteNameWithSharp!,
      ) as ChromaticNoteSharps

      settingsStore.enharmonicFlatsMap = {
        ...settingsStore.enharmonicFlatsMap,
        [notePitchWithSharp]: !Boolean(
          settingsStore.enharmonicFlatsMap[notePitchWithSharp],
        ),
      }

      this.setState({
        noteName: noteEnharmonicName!,
        octave: tonal.Note.oct(noteEnharmonicName)!,
        notePitchName: tonal.Note.pc(noteEnharmonicName)!,
      })

      return
    }

    this.setState({
      noteName: noteName,
      octave: tonal.Note.oct(noteName)!,
      notePitchName: tonal.Note.pc(noteName)!,
    })
  }

  render() {
    const octaveOrDefault = this.state.octave || 4
    const noteNames = TonalRange.chromatic(
      [`C${octaveOrDefault}`, `B${octaveOrDefault}`],
      true,
    )

    let disabledNoteNamesMap = {}
    if (this.props.disabledNoteNames) {
      this.props.disabledNoteNames.forEach(n => {
        disabledNoteNamesMap[n] = true
      })
    }

    return (
      <Dialog
        fullWidth={true}
        fullScreen={this.props.fullScreen}
        open={this.props.isOpen}
        maxWidth="sm"
        scroll="paper"
        onClose={this.props.onClose}
        aria-labelledby="pick-note-dialog"
      >
        <DialogTitle id="pick-note-dialog">
          <Typography variant="h4">Pick a note</Typography>
        </DialogTitle>

        <DialogContent>
          <Box width={1} flex={1}>
            <Flex alignItems="center" width={1} justifyContent="center">
              <IconButton
                color="default"
                onClick={this.handleDecreaseOctave}
                disabled={this.state.octave == null || this.state.octave === 1}
              >
                <MinusIcon fontSize="large" />
              </IconButton>

              <TextField
                className={css({
                  maxWidth: '80px',
                  marginTop: '1rem',
                  marginLeft: '1rem',
                  marginRight: '1rem',
                })}
                InputLabelProps={{
                  className: css({ fontSize: '1.2rem' }),
                }}
                InputProps={{
                  className: css({ fontSize: '2rem' }),
                }}
                label="Octave"
                id="bpm"
                type="number"
                // @ts-ignore
                step="1"
                min="1"
                max="6"
                value={`${this.state.octave}`}
                onChange={this.handleOctaveChange}
              />
              <IconButton
                color="default"
                onClick={this.handleIncreaseOctave}
                disabled={this.state.octave == null || this.state.octave === 6}
              >
                <PlusIcon fontSize="large" />
              </IconButton>
            </Flex>

            <Box mt={3} mb={4} width={1}>
              <PianoKeyboard
                height={70}
                noteRange={this.state.range}
                onPlayNote={midiNote => {
                  const noteNameWithSharp = tonal.Note.fromMidi(midiNote, true)
                  const notePitchWithSharp = tonal.Note.pc(noteNameWithSharp)!
                  const noteName = settingsStore.enharmonicFlatsMap[
                    notePitchWithSharp
                  ]
                    ? tonal.Note.enharmonic(noteNameWithSharp)!
                    : noteNameWithSharp

                  this.onNoteSelected(noteName, true)
                }}
                disabledNoteNames={this.props.disabledNoteNames}
                primaryNotesMidi={
                  this.state.noteName
                    ? [tonal.Note.midi(this.state.noteName)]
                    : undefined
                }
                secondaryNotesMidi={
                  this.state.noteNameMouseOver
                    ? [tonal.Note.midi(this.state.noteNameMouseOver)]
                    : undefined
                }
                notesColor={
                  this.state.noteName || this.state.noteNameMouseOver
                    ? getNoteCardColorByNoteName(
                        // @ts-ignore
                        this.state.noteName || this.state.noteNameMouseOver,
                      )
                    : undefined
                }
              />
            </Box>

            <Flex flexWrap="wrap" flex={1}>
              {noteNames.map(noteNameWithSharp => {
                const notePitchWithSharp = tonal.Note.pc(noteNameWithSharp)!

                const shouldUseFlat =
                  settingsStore.enharmonicFlatsMap[notePitchWithSharp] === true

                const noteName = shouldUseFlat
                  ? tonal.Note.enharmonic(noteNameWithSharp)
                  : noteNameWithSharp

                const notePitch = tonal.Note.pc(noteName)

                const isSelected = notePitch === this.state.notePitchName
                const bgColor = getNoteCardColorByNoteName(noteName)

                const isDisabled =
                  disabledNoteNamesMap[getNotePitchClassWithSharp(noteName)] === true

                let transposedNoteName = noteName
                let transposedNotePitch = notePitch
                if (settingsStore.instrumentTransposing !== 'C') {
                  const transposingConfig =
                    instrumentTransposingOptionsByType[
                      settingsStore.instrumentTransposing
                    ]
                  if (transposingConfig) {
                    transposedNoteName = tonal.transpose(
                      noteName,
                      transposingConfig.interval,
                    ) as string
                    transposedNotePitch = tonal.Note.pc(transposedNoteName)!
                  }
                }

                return (
                  <Box key={noteNameWithSharp} width={1 / 4} p={[1, 2, 2]}>
                    <NoteButton
                      // @ts-ignore
                      component={Paper}
                      active={isSelected}
                      fontWeight="bold"
                      fontSize={[2, 3, 3]}
                      p={[2, 2, 3]}
                      bg={isDisabled ? '#cfcfcf' : bgColor}
                      onMouseOver={() => this.setNoteNameMouseOver(noteName)}
                      onMouseLeave={() => this.setNoteNameMouseOver(undefined)}
                      hoverBg={
                        isDisabled
                          ? '#cfcfcf'
                          : isSelected
                            ? bgColor
                            : undefined
                      }
                      width={1}
                      onClick={() => {
                        if (isDisabled) {
                          return
                        }
                        this.onNoteSelected(noteName)
                      }}
                    >
                      {transposedNotePitch}
                    </NoteButton>
                  </Box>
                )
              })}
            </Flex>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={this.props.onClose} color="secondary">
            Cancel
          </Button>
          <Button
            disabled={!this.state.noteName || !this.state.octave}
            onClick={this.submit}
            color="primary"
            autoFocus
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
}

export default withAudioEngine(
  withMobileDialog<PickNoteModalProps>({ breakpoint: 'xs' })(PickNoteModal),
)
