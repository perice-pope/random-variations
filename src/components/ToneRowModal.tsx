import * as React from 'react'
import * as _ from 'lodash'
import * as tonal from 'tonal'

import PianoKeyboard from './PianoKeyboard'

import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Dialog from '@material-ui/core/Dialog'
import Slider from '@material-ui/lab/Slider'
import ArrowsIcon from '@material-ui/icons/Cached'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import PlusIcon from '@material-ui/icons/Add'
import MinusIcon from '@material-ui/icons/Remove'
import withMobileDialog, {
  InjectedProps,
} from '@material-ui/core/withMobileDialog'

import { Flex, Box } from './ui'

import { getNoteCardColorByNoteName } from '../utils'
import { EnharmonicFlatsMap, ChromaticNoteSharps } from '../types'
import { css } from 'emotion'
import {
  withAudioEngine,
  WithAudioEngineInjectedProps,
} from './withAudioEngine'
import { NoteNamesWithSharps } from '../musicUtils'
import { Tooltip, Typography } from '@material-ui/core'

type ToneRowModalProps = {
  isOpen: boolean
  enharmonicFlatsMap: EnharmonicFlatsMap
  maxNotesCount: number
  defaultNotesCount: number
  onClose: () => any
  onSubmit: (args: { noteNames: string[] }) => any
  onEnharmonicFlatsMapToggle?: (notePitch: ChromaticNoteSharps) => any
  noteName?: string
}

type ToneRowModalState = {
  range?: any
  noteName?: string
  notePitchName?: string
  octave?: number
  enharmonicFlatsMap: EnharmonicFlatsMap

  noteEditingModalIsOpen: boolean
  noteEditingModalNoteIndex?: number

  noteNameMouseOver?: string

  noteNames: string[]
}

const generateRandomNotes = count =>
  _.sampleSize(NoteNamesWithSharps, count).map(name => `${name}4`) as string[]

// @ts-ignore
class ToneRowModal extends React.Component<
  ToneRowModalProps & InjectedProps & WithAudioEngineInjectedProps,
  ToneRowModalState
> {
  constructor(props) {
    super(props)
    this.state = {
      range: this.getNoteRange(props.noteName),
      noteName: props.noteName,
      octave: props.noteName ? tonal.Note.oct(props.noteName)! : 4,
      notePitchName: props.noteName
        ? tonal.Note.pc(props.noteName)!
        : undefined,
      enharmonicFlatsMap: this.props.enharmonicFlatsMap,

      noteEditingModalIsOpen: false,

      noteNames: generateRandomNotes(props.defaultNotesCount),
    }
  }

  getNoteRange = noteName => {
    const octave = noteName ? tonal.Note.oct(noteName)! : 4
    const firstNote = octave === 1 ? `C${octave}` : `A${octave - 1}`
    const lastNote = octave === 6 ? `B${octave}` : `D${octave + 1}`
    const noteRange = {
      first: tonal.Note.midi(firstNote),
      last: tonal.Note.midi(lastNote),
    }
    return noteRange
  }

  randomizeNotes = () =>
    this.setState({
      noteNames: generateRandomNotes(this.state.noteNames.length),
    })

  setNoteNameMouseOver = noteName =>
    this.setState({ noteNameMouseOver: noteName })

  handleIncreaseOctave = () => {
    this.setOctave(this.state.octave != null ? this.state.octave + 1 : 1)
  }

  handleDecreaseOctave = () => {
    this.setOctave(this.state.octave != null ? this.state.octave - 1 : 6)
  }

  submit = () => {
    this.props.onSubmit({ noteNames: this.state.noteNames })
    this.props.onClose()
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

      this.setState({
        noteName: noteEnharmonicName!,
        octave: tonal.Note.oct(noteEnharmonicName)!,
        notePitchName: tonal.Note.pc(noteEnharmonicName)!,
        enharmonicFlatsMap: {
          ...this.state.enharmonicFlatsMap,
          [notePitchWithSharp]: !Boolean(
            this.state.enharmonicFlatsMap[notePitchWithSharp],
          ),
        },
      })

      if (this.props.onEnharmonicFlatsMapToggle) {
        this.props.onEnharmonicFlatsMapToggle(notePitchWithSharp)
      }

      return
    }

    this.setState({
      noteName: noteName,
      octave: tonal.Note.oct(noteName)!,
      notePitchName: tonal.Note.pc(noteName)!,
    })
  }

  handleNotesCountChange = (event, count) =>
    this.setState({ noteNames: generateRandomNotes(count) })

  render() {
    const { noteNames } = this.state

    return (
      <Dialog
        fullScreen={this.props.fullScreen}
        fullWidth={true}
        open={this.props.isOpen}
        onClose={this.submit}
        aria-labelledby="pick-note-dialog"
      >
        <DialogTitle id="pick-note-dialog">Add a tone row</DialogTitle>
        <DialogContent
          className={css({ display: 'flex', alignItems: 'center' })}
        >
          <Flex flexDirection="column" alignItems="center" width={1} flex={1}>
            <Box mb={2} width={1}>
              <Typography id="slider-label">
                Notes count: {noteNames.length}
              </Typography>
              <Slider
                classes={{
                  container: css(`padding: 1rem;`),
                }}
                value={noteNames.length}
                min={1}
                max={this.props.maxNotesCount}
                step={1}
                aria-labelledby="slider-label"
                onChange={this.handleNotesCountChange}
              />
            </Box>

            <Tooltip title="Randomize pattern" disableFocusListener={true}>
              <Button
                color="primary"
                className={css({ minWidth: '40px' })}
                size="small"
                variant="outlined"
                aria-label="Randomize notes"
                disabled={this.state.noteNames.length < 2}
                onClick={this.randomizeNotes}
              >
                <ArrowsIcon
                  fontSize="small"
                  className={css({ marginRight: '0.5rem' })}
                />{' '}
                Randomize
              </Button>
            </Tooltip>

            <Flex flexWrap="wrap" flex={1} mt={2}>
              {noteNames.map((noteNameWithSharp, index) => {
                const notePitchWithSharp = tonal.Note.pc(noteNameWithSharp)!

                const shouldUseFlat =
                  this.state.enharmonicFlatsMap[notePitchWithSharp] === true

                const noteName = shouldUseFlat
                  ? tonal.Note.enharmonic(noteNameWithSharp)
                  : noteNameWithSharp

                return (
                  <Box p={2} key={`${index}${noteName}`}>
                    {noteName}
                  </Box>
                )
              })}
            </Flex>

            <Flex alignItems="center">
              <Button
                variant="fab"
                color="default"
                onClick={this.handleDecreaseOctave}
                disabled={this.state.octave == null || this.state.octave === 1}
              >
                <MinusIcon />
              </Button>
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
              <Button
                variant="fab"
                color="default"
                onClick={this.handleIncreaseOctave}
                disabled={this.state.octave == null || this.state.octave === 6}
              >
                <PlusIcon />
              </Button>
            </Flex>

            <Box mt={4} width={1}>
              <PianoKeyboard
                height={100}
                noteRange={this.state.range}
                onPlayNote={midiNote => {
                  const noteNameWithSharp = tonal.Note.fromMidi(midiNote, true)
                  const notePitchWithSharp = tonal.Note.pc(noteNameWithSharp)!
                  const noteName = this.state.enharmonicFlatsMap[
                    notePitchWithSharp
                  ]
                    ? tonal.Note.enharmonic(noteNameWithSharp)!
                    : noteNameWithSharp

                  this.onNoteSelected(noteName, true)
                }}
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
          </Flex>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.props.onClose} color="secondary">
            Cancel
          </Button>
          <Button
            disabled={!this.state.noteNames}
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
  withMobileDialog<ToneRowModalProps>()(ToneRowModal),
)
