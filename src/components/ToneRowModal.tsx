import * as React from 'react'
import * as _ from 'lodash'
import * as tonal from 'tonal'

import PianoKeyboard from './PianoKeyboard'

import DeleteIcon from '@material-ui/icons/Close'
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
import { observer } from 'mobx-react'
import uuid from 'uuid/v4'
import withMobileDialog, {
  InjectedProps,
} from '@material-ui/core/withMobileDialog'

import { Flex, Box } from './ui'
import Tooltip from './ui/Tooltip'

import { getNoteCardColorByNoteName, arrayMove } from '../utils'
import { css } from 'emotion'
import {
  withAudioEngine,
  WithAudioEngineInjectedProps,
} from './withAudioEngine'
import { NoteNamesWithSharps } from '../musicUtils'
import { Typography, IconButton } from '@material-ui/core'
import settingsStore from '../services/settingsStore'
import NoteCards, { NoteCardNote } from './NoteCards'
import { ChromaticNoteSharps } from '../types'

type ToneRowModalProps = {
  isOpen: boolean
  maxNotesCount: number
  defaultNotesCount: number
  onClose: () => any
  onSubmit: (args: { noteNames: string[] }) => any
  noteName?: string
}

type ToneRowModalState = {
  range?: any
  noteName?: string
  octave?: number

  noteEditingModalIsOpen: boolean
  noteEditingModalNoteIndex?: number

  noteNameMouseOver?: string

  notes: NoteCardNote[]
}

const generateRandomNotes = (
  count,
  octave: number = 4,
  firstNoteName?: string,
) =>
  (firstNoteName
    ? [firstNoteName, ..._.sampleSize(NoteNamesWithSharps, count - 1)]
    : _.sampleSize(NoteNamesWithSharps, count)
  ).map(
    (name, index) =>
      ({
        noteName: !firstNoteName || index > 0 ? `${name}${octave}` : name,
        id: uuid(),
      } as NoteCardNote),
  )

// @ts-ignore
@observer
class ToneRowModal extends React.Component<
  ToneRowModalProps & InjectedProps & WithAudioEngineInjectedProps,
  ToneRowModalState
> {
  constructor(props) {
    super(props)

    const octave: number = props.noteName ? tonal.Note.oct(props.noteName)! : 4
    this.state = {
      range: this.getNoteRange(octave),
      noteName: props.noteName,
      octave: octave,

      noteEditingModalIsOpen: false,

      notes: generateRandomNotes(
        props.defaultNotesCount,
        octave,
        props.noteName,
      ),
    }
  }

  getNoteRange = octave => {
    const firstNote = octave === 1 ? `C${octave}` : `A${octave - 1}`
    const lastNote = octave === 6 ? `B${octave}` : `D${octave + 1}`
    const noteRange = {
      first: tonal.Note.midi(firstNote),
      last: tonal.Note.midi(lastNote),
    }
    return noteRange
  }

  randomizeNotes = () => {
    if (this.state.notes.length === 0) {
      return
    }
    this.setState({
      notes: generateRandomNotes(
        this.state.notes.length,
        this.state.octave,
        this.state.notes.length > 0 ? this.state.notes[0].noteName : undefined,
      ),
    })
  }

  setNoteNameMouseOver = noteName =>
    this.setState({ noteNameMouseOver: noteName })

  handleIncreaseOctave = () => {
    this.setOctave(this.state.octave != null ? this.state.octave + 1 : 1)
  }

  handleDecreaseOctave = () => {
    this.setOctave(this.state.octave != null ? this.state.octave - 1 : 6)
  }

  submit = () => {
    this.props.onSubmit({
      noteNames: this.state.notes.map(n => n.noteName),
    })
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

    this.setState({
      octave: octaveValue,
      range: this.getNoteRange(octaveValue),
    })
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
    const noteEnharmonicName = tonal.Note.enharmonic(noteName) as string

    setTimeout(
      () =>
        this.setState({ range: this.getNoteRange(tonal.Note.oct(noteName)) }),
      100,
    )

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
      })

      return
    }

    this.setState(
      {
        noteName: noteName,
        octave: tonal.Note.oct(noteName)!,
      },
      () => {
        if (this.state.notes.length < this.props.maxNotesCount) {
          this.addNote(noteName)
        }
      },
    )
  }

  private handleNotesCountChange = (event, count) =>
    this.setState({
      notes: generateRandomNotes(
        count,
        this.state.octave,
        this.state.notes.length > 0 && count > 0
          ? this.state.notes[0].noteName
          : undefined,
      ),
    })

  private handleChangeNoteCardToEnharmonicClick = (index: number) =>
    this.setState({
      notes: this.state.notes.map(
        (n, i) =>
          i === index
            ? {
                ...n,
                noteName: tonal.Note.enharmonic(n.noteName) as string,
              }
            : n,
      ),
    })

  private deleteNoteCard = (index: number) =>
    this.setState({ notes: this.state.notes.filter((n, i) => i !== index) })

  private handleCardsReorder = ({ oldIndex, newIndex }) =>
    this.setState({
      notes: arrayMove(this.state.notes, oldIndex, newIndex),
    })

  private addNote = noteName => {
    this.setState({ notes: [...this.state.notes, { noteName, id: uuid() }] })
  }

  private clearAllNotes = () => {
    this.setState({ notes: [] })
  }

  render() {
    const { notes } = this.state
    if (!this.props.isOpen) {
      return null
    }

    return (
      <Dialog
        fullScreen={this.props.fullScreen}
        fullWidth={true}
        scroll="paper"
        open={this.props.isOpen}
        onClose={this.submit}
        aria-labelledby="pick-note-dialog"
      >
        <DialogTitle id="pick-note-dialog">Add a tone row</DialogTitle>

        <DialogContent className={css(`overflow-x: hidden;`)}>
          <Box width={1} maxWidth={600} mx="auto" flex={1} mt={2}>
            <Box mb={2} width={1}>
              <Typography id="slider-label" className={css(`font-size: 20px;`)}>
                Notes count: {notes.length}
              </Typography>
              <Slider
                classes={{
                  container: css(`padding: 1rem;`),
                }}
                value={notes.length}
                min={0}
                max={this.props.maxNotesCount}
                step={1}
                aria-labelledby="slider-label"
                onChange={this.handleNotesCountChange}
              />
            </Box>

            <Flex width={1} justifyContent="center">
              <Tooltip title="Randomize notes" disableFocusListener={true}>
                <Button
                  color="primary"
                  variant="extendedFab"
                  className={css({ minWidth: '40px', marginRight: '0.5rem' })}
                  size="small"
                  aria-label="Randomize notes"
                  disabled={this.state.notes.length < 2}
                  onClick={this.randomizeNotes}
                >
                  <ArrowsIcon
                    fontSize="small"
                    className={css({ marginRight: '0.5rem' })}
                  />{' '}
                  Randomize
                </Button>
              </Tooltip>

              <Tooltip
                title="Clear all notes"
                variant="gray"
                disableFocusListener
              >
                <Button
                  disabled={this.state.notes.length === 0}
                  color="secondary"
                  onClick={this.clearAllNotes}
                >
                  <DeleteIcon
                    fontSize="small"
                    className={css({ margin: '0 0.5rem' })}
                  />
                  Clear all
                </Button>
              </Tooltip>
            </Flex>

            <Flex flexWrap="wrap" flex={1} mt={2}>
              <NoteCards
                zIndex={10000000}
                notes={this.state.notes}
                onCardsReorder={this.handleCardsReorder}
                onCardDraggedOut={this.deleteNoteCard}
                onChangeToEnharmonicClick={
                  this.handleChangeNoteCardToEnharmonicClick
                }
                onDeleteClick={this.deleteNoteCard}
              />
            </Flex>

            <Flex alignItems="center" justifyContent="center">
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
                  className: css({ fontSize: '1.8rem' }),
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

            <Box mt={3} width={1}>
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
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={this.props.onClose} color="secondary">
            Cancel
          </Button>
          <Button
            disabled={!this.state.notes || this.state.notes.length === 0}
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
