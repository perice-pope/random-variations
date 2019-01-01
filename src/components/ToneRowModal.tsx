import * as React from 'react'
import * as _ from 'lodash'
import * as tonal from 'tonal'
import pluralize from 'pluralize'

import PianoKeyboard from './PianoKeyboard'

import DeleteIcon from '@material-ui/icons/Close'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Dialog from '@material-ui/core/Dialog'
import Slider from '@material-ui/lab/Slider'
import ArrowsIcon from '@material-ui/icons/Cached'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
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
import { NoteNamesWithSharps, normalizeNoteName } from '../musicUtils'
import {
  Typography,
  IconButton,
  Hidden,
  FormControlLabel,
  Switch,
} from '@material-ui/core'
import settingsStore from '../services/settingsStore'
import NoteCards, { NoteCardNote } from './NoteCards'
import { ChromaticNoteSharps } from '../types'

type ToneRowModalProps = {
  isOpen: boolean
  maxNotesCount: number
  notesUsedInSession: string[]
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

  allowRepeatingNotes: boolean

  noteNameMouseOver?: string

  notes: NoteCardNote[]
}

const sampleRepeating = (array, count) =>
  _.range(count).map(() => _.sample(array))
const sampleNonRepeating = (array, count) => _.sampleSize(array, count)

const generateRandomNotes = (
  availableNotes: string[],
  allowRepeatingNotes: boolean,
  count,
  octave: number = 4,
  firstNoteName?: string,
) =>
  (firstNoteName
    ? [
        firstNoteName,
        ...(allowRepeatingNotes ? sampleRepeating : sampleNonRepeating)(
          _.difference(availableNotes, [normalizeNoteName(firstNoteName)]),
          count - 1,
        ),
      ]
    : (allowRepeatingNotes ? sampleRepeating : sampleNonRepeating)(
        availableNotes,
        count,
      )
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
      allowRepeatingNotes: false,

      notes: _.range(props.defaultNotesCount).map(() => ({
        noteName: 'C4',
      })) as NoteCardNote[],
    }

    this.setRandomPatternWithFirstNotePreserved()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.isOpen !== this.props.isOpen && this.props.isOpen) {
      this.setState(
        {
          notes: _.range(this.props.defaultNotesCount).map(() => ({
            noteName: 'C4',
          })) as NoteCardNote[],
        },
        this.setRandomPatternWithFirstNotePreserved,
      )
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

  setRandomPatternWithFirstNotePreserved = () => {
    if (this.state.notes.length === 0) {
      return
    }

    const availableNotes = this.getAvailableNoteNamesWithSharps()

    let firstNoteName =
      this.state.notes.length > 0 ? this.state.notes[0].noteName : undefined

    if (
      firstNoteName &&
      !_.includes(availableNotes, normalizeNoteName(firstNoteName))
    ) {
      firstNoteName = _.sample(availableNotes)
    }

    let count = this.state.notes.length
    if (this.state.allowRepeatingNotes && count > availableNotes.length) {
      count = availableNotes.length
    }

    this.setState({
      notes: generateRandomNotes(
        availableNotes,
        this.state.allowRepeatingNotes,
        count,
        this.state.octave,
        firstNoteName,
      ),
    })
  }

  handleNoteCardMouseOver = index => {
    this.setState({ noteNameMouseOver: this.state.notes[index].noteName })
  }

  handleNoteCardMouseLeave = () => {
    this.setState({ noteNameMouseOver: undefined })
  }

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

  onKeyboardNotePlayed = (noteName?: string) => {
    if (!noteName) {
      this.setState({
        noteName: undefined,
        octave: undefined,
      })
      return
    }

    const noteEnharmonicName = tonal.Note.enharmonic(noteName) as string

    setTimeout(
      () =>
        this.setState({ range: this.getNoteRange(tonal.Note.oct(noteName)) }),
      100,
    )

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
      })

      return
    }

    this.setState(
      {
        noteName: noteName,
      },
      () => {
        if (this.state.notes.length < this.getMaxNumberOfNotesToAdd()) {
          this.addNote(noteName)
        }
      },
    )
  }

  private handleNotesCountChange = (event, count) => {
    const commonPrefixLength = Math.min(count, this.state.notes.length)

    const notesInUseWithSharps = this.state.notes.map(n =>
      normalizeNoteName(n.noteName),
    )
    let availableNotes = this.getAvailableNoteNamesWithSharps()
    if (!this.state.allowRepeatingNotes) {
      availableNotes = _.difference(availableNotes, notesInUseWithSharps)
    }

    const newRandomNotes =
      count > this.state.notes.length
        ? generateRandomNotes(
            availableNotes,
            this.state.allowRepeatingNotes,
            count - commonPrefixLength,
            this.state.octave,
          )
        : []

    let notes = newRandomNotes
    if (commonPrefixLength > 0) {
      notes = [
        ...this.state.notes.slice(0, commonPrefixLength),
        ...newRandomNotes,
      ]
    }
    this.setState({ notes })
  }

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

  handleEditNote = (index: number, { noteName }) =>
    this.setState({
      notes: this.state.notes.map(
        (n, i) =>
          i === index
            ? {
                ...n,
                noteName,
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

  private handleChangeAllowRepeatedNotes = (e, checked) => {
    this.setState(
      {
        allowRepeatingNotes: Boolean(checked),
      },
      () => {
        if (
          !this.state.allowRepeatingNotes &&
          this.state.notes.length > this.getMaxNumberOfNotesToAdd()
        ) {
          this.handleNotesCountChange(
            undefined,
            this.getMaxNumberOfNotesToAdd(),
          )
        }

        this.setRandomPatternWithFirstNotePreserved()
      },
    )
  }

  private getAvailableNoteNamesWithSharps = () => {
    if (this.state.allowRepeatingNotes) {
      return NoteNamesWithSharps
    }

    const noteNamesUsedInSession = _.uniq(
      this.props.notesUsedInSession.map(normalizeNoteName),
    )

    return _.difference(NoteNamesWithSharps, noteNamesUsedInSession) as string[]
  }

  private getDisabledNotes = () => {
    if (this.state.allowRepeatingNotes) {
      return []
    }

    const notesInUseWithSharps = this.state.notes.map(n =>
      normalizeNoteName(n.noteName),
    )
    const noteNamesUsedInSession = _.uniq(
      this.props.notesUsedInSession.map(normalizeNoteName),
    )
    return _.uniq(_.union(notesInUseWithSharps, noteNamesUsedInSession))
  }

  private getMaxNumberOfNotesToAdd = () => {
    if (this.state.allowRepeatingNotes) {
      return this.props.maxNotesCount
    }

    return Math.min(
      this.props.maxNotesCount,
      this.getAvailableNoteNamesWithSharps().length,
    )
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
        maxWidth="sm"
        scroll="paper"
        open={this.props.isOpen}
        onClose={this.submit}
        aria-labelledby="pick-note-dialog"
      >
        <DialogContent className={css(`overflow-x: hidden;`)}>
          <Flex flexDirection="column" height="100%">
            <Hidden mdDown>
              <Box mb={3}>
                <Typography variant="h4">Add a tone row</Typography>
              </Box>
            </Hidden>

            <Box mb={2}>
              <Typography id="slider-label" className={css(`font-size: 20px;`)}>
                Add notes: {notes.length} {pluralize('notes', notes.length)}
              </Typography>
              <Slider
                classes={{
                  container: css(`padding: 1rem;`),
                }}
                value={notes.length}
                min={0}
                max={this.getMaxNumberOfNotesToAdd()}
                step={1}
                aria-labelledby="slider-label"
                onChange={this.handleNotesCountChange}
              />
            </Box>

            <Flex width={1} justifyContent="center">
              <div>
                <Tooltip title="Randomize notes" disableFocusListener>
                  <Button
                    color="primary"
                    variant="outlined"
                    className={css({ minWidth: '40px', marginRight: '0.5rem' })}
                    aria-label="Randomize notes"
                    disabled={this.state.notes.length < 2}
                    onClick={this.setRandomPatternWithFirstNotePreserved}
                  >
                    <ArrowsIcon
                      fontSize="small"
                      className={css({ marginRight: '0.5rem' })}
                    />{' '}
                    Randomize
                  </Button>
                </Tooltip>

                <Tooltip title="Clear all notes" variant="gray">
                  <Button
                    disabled={this.state.notes.length === 0}
                    color="secondary"
                    onClick={this.clearAllNotes}
                  >
                    <DeleteIcon
                      fontSize="small"
                      className={css({ margin: '0 0.5rem' })}
                    />
                    Clear
                  </Button>
                </Tooltip>
              </div>
            </Flex>

            <Flex width={1} justifyContent="center">
              <FormControlLabel
                classes={{
                  label: css(`user-select: none;`),
                }}
                control={
                  <Switch
                    onChange={this.handleChangeAllowRepeatedNotes}
                    checked={this.state.allowRepeatingNotes}
                    color="primary"
                  />
                }
                label="Allow repeating notes"
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

                  this.onKeyboardNotePlayed(noteName)
                }}
                disabledNoteNames={this.getDisabledNotes()}
                primaryNotesMidi={
                  this.state.noteNameMouseOver
                    ? [tonal.Note.midi(this.state.noteNameMouseOver)]
                    : undefined
                }
                notesColor={
                  this.state.noteNameMouseOver
                    ? getNoteCardColorByNoteName(
                        // @ts-ignore
                        this.state.noteNameMouseOver,
                      )
                    : undefined
                }
              />
            </Box>

            <div
              className={css(`
              flex: 1;
              display: flex;
              flex-wrap: wrap;
              justify-content: flex-start;
              
              margin-top: 25px;
              max-height: 250px;
              
              @media screen and (min-width: 601px) {
                margin-top: 32px;
                min-height: 250px;
              }
            `)}
            >
              <NoteCards
                zIndex={10000000}
                verticalAlign="top"
                notes={this.state.notes}
                disabledNoteNames={this.getDisabledNotes()}
                onMouseOver={this.handleNoteCardMouseOver}
                onMouseLeave={this.handleNoteCardMouseLeave}
                onCardsReorder={this.handleCardsReorder}
                onCardDraggedOut={this.deleteNoteCard}
                onEditNote={this.handleEditNote}
                onChangeToEnharmonicClick={
                  this.handleChangeNoteCardToEnharmonicClick
                }
                onDeleteClick={this.deleteNoteCard}
              />
            </div>
          </Flex>
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
  withMobileDialog<ToneRowModalProps>({ breakpoint: 'xs' })(ToneRowModal),
)
