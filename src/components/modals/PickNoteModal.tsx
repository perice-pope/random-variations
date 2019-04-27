import * as React from 'react'
import * as _ from 'lodash'
import * as tonal from 'tonal'
import * as TonalRange from 'tonal-range'

import PianoKeyboard from '../PianoKeyboard'

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

import { Flex, Box, BaseButton, Paper, BaseButtonProps } from '../ui'

import { getColorForNote } from '../../utils'
import { css, cx } from 'emotion'
import { lighten, transparentize } from 'polished'
import {
  withAudioEngine,
  WithAudioEngineInjectedProps,
} from '../withAudioEngine'
import styled from 'react-emotion'
import { IconButton, Typography } from '@material-ui/core'
import {
  getNotePitchClassWithSharp,
  getNoteNameWithSharp,
  getEnharmonicVersionForNote,
  getDefaultEnharmonicPitchVersion,
  getPreferredEnharmonicNoteVersion,
  getDefaultEnharmonicNoteVersion,
} from '../../musicUtils'
import sessionStore from '../../services/sessionStore'

type PickNoteModalProps = {
  disabledNotePitches?: string[]
  isOpen: boolean
  onClose: () => any
  onSubmit: (args: { noteName: string }) => any
  noteName?: string
}

type PickNoteModalState = {
  range?: any
  noteName?: string
  octave?: number

  noteNameMouseOver?: string
}

type NoteButtonProps = {
  active: boolean
  disabled?: boolean
} & BaseButtonProps

const NoteButton = styled(BaseButton)<NoteButtonProps>`
  transition: all 200ms;
  transform: ${({ active }) => (active ? 'scale(1.2)' : 'none')};

  background-color: ${({ active, bg }) =>
    active ? lighten(0.1, bg as string) : bg};

  ${({ active, bg }) => (active ? lighten(0.1, bg as string) : bg)};

  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
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
        range: this.getNoteRange(this.props.noteName),
        noteName: this.props.noteName,
      })
    }
  }

  getNoteRange = noteName => {
    const defaultEnharmonicNoteVersion = getDefaultEnharmonicNoteVersion(
      noteName,
    )

    const octave = noteName ? tonal.Note.oct(defaultEnharmonicNoteVersion)! : 4
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
      this.setState(
        {
          octave: octaveValue,
          range: this.getNoteRange(newNoteName),
        },
        () => {
          this.onNoteSelected(newNoteName)
        },
      )
    } else {
      this.setState({
        range: this.getNoteRange(`C${octaveValue}`),
        octave: octaveValue,
      })
    }
  }

  onNoteSelected = (noteName?: string, skipPlayingNote?: boolean) => {
    if (!noteName) {
      this.setState({
        noteName: undefined,
        octave: undefined,
      })
      return
    }

    console.log('TCL: onNoteSelected -> noteName', noteName)

    if (!skipPlayingNote) {
      const midi = tonal.Note.midi(noteName)

      if (midi) {
        this.props.audioEngine.playNote(
          {
            midi,
          },
          0,
          0.5,
        )
      }
    }

    const noteEnharmonicName = getEnharmonicVersionForNote(noteName)
    if (this.state.noteName === noteName && !!noteEnharmonicName) {
      // This is a second click on a card with "enharmonic-capable" note...

      const defaultEnharmonicPitchName =
        getDefaultEnharmonicPitchVersion(noteName) ||
        (tonal.Note.pc(noteEnharmonicName) as string)

      const isUsingDefaultEnharmonicVariant =
        (getDefaultEnharmonicPitchVersion(noteName) as string) ===
        (tonal.Note.pc(noteEnharmonicName) as string)

      sessionStore.activeSession!.enharmonicVariantsMap[
        defaultEnharmonicPitchName
      ] = !isUsingDefaultEnharmonicVariant

      this.setState({
        noteName: noteEnharmonicName,
      })

      return
    }

    this.setState({
      noteName: noteName,
    })
  }

  private isMidiNoteDisabled = (midi: number) => {
    if (!this.props.disabledNotePitches) {
      return false
    }
    const pitchClass = getNotePitchClassWithSharp(tonal.Note.fromMidi(
      midi,
      true,
    ) as string)

    return this.props.disabledNotePitches.findIndex(n => n === pitchClass) > -1
  }

  private getPianoNoteColor = (midi: number) => {
    const noteNameWithSharp = getNoteNameWithSharp(tonal.Note.fromMidi(
      midi,
      true,
    ) as string)

    if (this.isMidiNoteDisabled(midi)) {
      return transparentize(0.6, '#bbb')
    }

    if (
      !!this.state.noteNameMouseOver &&
      getNoteNameWithSharp(this.state.noteNameMouseOver) === noteNameWithSharp
    ) {
      return transparentize(0.7, getColorForNote(this.state.noteNameMouseOver))
    }

    if (
      !!this.state.noteName &&
      getNoteNameWithSharp(this.state.noteName) === noteNameWithSharp
    ) {
      return transparentize(0.7, getColorForNote(this.state.noteName))
    }

    return undefined
  }

  render() {
    const octaveOrDefault = this.state.octave || 4
    const noteNamesAsFlats = TonalRange.chromatic([
      `C${octaveOrDefault}`,
      `B${octaveOrDefault}`,
    ])

    let disabledNotePitchClassesMap = {}
    if (this.props.disabledNotePitches) {
      this.props.disabledNotePitches.forEach(n => {
        disabledNotePitchClassesMap[n] = true
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

              {/* 
                // @ts-ignore */}
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
                onPlayNote={midi => {
                  const noteNameWithFlat = tonal.Note.fromMidi(
                    midi,
                    false,
                  ) as string

                  this.onNoteSelected(
                    getPreferredEnharmonicNoteVersion(noteNameWithFlat),
                    true,
                  )
                }}
                getIsNoteDisabled={this.isMidiNoteDisabled}
                getNoteColor={this.getPianoNoteColor}
              />
            </Box>

            {this.props.disabledNotePitches &&
              this.props.disabledNotePitches.length > 0 && (
                <p className={cx('text-soft', css(`font-size: 0.8em;`))}>
                  Notes that are already used in the session are grayed out. If
                  you want to allow repeating notes, toggle the switch in the
                  previous window.
                </p>
              )}

            <Flex flexWrap="wrap" flex={1}>
              {noteNamesAsFlats.map(noteNameAsFlat => {
                const noteName = getPreferredEnharmonicNoteVersion(
                  noteNameAsFlat,
                )
                const notePitch = tonal.Note.pc(noteName) as string

                const isSelected =
                  notePitch === tonal.Note.pc(this.state.noteName!)
                const bgColor = getColorForNote(notePitch)

                const isDisabled =
                  disabledNotePitchClassesMap[
                    getNotePitchClassWithSharp(notePitch)
                  ] === true

                return (
                  <Box key={noteNameAsFlat} width={1 / 4} p={[1, 2, 2]}>
                    <NoteButton
                      // @ts-ignore
                      component={Paper}
                      disabled={isDisabled}
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
                      {notePitch}
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
