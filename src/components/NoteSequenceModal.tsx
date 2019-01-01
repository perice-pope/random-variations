import * as React from 'react'
import * as _ from 'lodash'
import * as tonal from 'tonal'

import memoize from 'memoize-one'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import { observer } from 'mobx-react'
import uuid from 'uuid/v4'
import withMobileDialog, {
  InjectedProps,
} from '@material-ui/core/withMobileDialog'

import { Flex, Box } from './ui'

import { css } from 'emotion'
import {
  withAudioEngine,
  WithAudioEngineInjectedProps,
} from './withAudioEngine'
import {
  InputLabel,
  FormControl,
  NativeSelect,
  Input,
  Typography,
  Divider,
} from '@material-ui/core'
import NoteCards, { NoteCardNote } from './NoteCards'
import { SemitonesToIntervalNameMap } from '../musicUtils'
import Slider from '@material-ui/lab/Slider'

type NoteSequenceModalProps = {
  isOpen: boolean
  onClose: () => any
  onSubmit: (args: { noteNames: string[] }) => any
}

const flipDirection = (direction: 'up' | 'down') =>
  direction === 'up' ? 'down' : 'up'

interface FormValues {
  startNoteName: string
  stepInterval: number
  direction: 'up' | 'down'
}

type NoteSequenceModalState = {
  range?: any
  values: FormValues

  noteEditingModalIsOpen: boolean
  noteEditingModalNoteIndex?: number

  noteNameMouseOver?: string

  notes: NoteCardNote[]
}

// @ts-ignore
@observer
class NoteSequenceModal extends React.Component<
  NoteSequenceModalProps & InjectedProps & WithAudioEngineInjectedProps,
  NoteSequenceModalState
> {
  constructor(props) {
    super(props)

    const startNoteName = 'C4'
    const stepInterval = tonal.Distance.semitones('C', 'G') as number
    const direction = 'up'

    this.state = {
      values: {
        direction,
        startNoteName,
        stepInterval,
      },

      noteEditingModalIsOpen: false,

      notes: this.generateNoteSequence(startNoteName, stepInterval, direction),
    }
  }

  generateNoteSequence = (
    noteName: string,
    stepInterval: number,
    direction: 'up' | 'down',
  ) => {
    const notes: string[] = []
    const notesUsedSharps = {}
    const octave = tonal.Note.oct(noteName) as number
    let currentNote = noteName
    let currentNoteSharp = currentNote.includes('b')
      ? (tonal.Note.enharmonic(currentNote) as string)
      : currentNote

    let index = 0
    while (!notesUsedSharps[currentNoteSharp] && notes.length < 12) {
      notesUsedSharps[currentNoteSharp] = true
      notes.push(currentNote)

      let nextNote: string
      let nextNoteOctave: number

      // For perfect 4th / perfect 5th, we want to alternate between up/down step direction
      if (stepInterval === 5) {
        const currentDirection =
          index % 2 ? flipDirection(direction) : direction
        const currentStepInterval = index % 2 ? 5 : 7

        nextNote = tonal.Note.fromMidi(
          (tonal.Note.midi(currentNote) as number) +
            (currentDirection === 'up' ? 1 : -1) * currentStepInterval,
          true,
        )
        nextNoteOctave = tonal.Note.oct(nextNote) as number
      } else {
        nextNote = tonal.Note.fromMidi(
          (tonal.Note.midi(currentNote) as number) +
            stepInterval * (direction === 'up' ? 1 : -1),
          true,
        ) as string
        nextNoteOctave = tonal.Note.oct(nextNote) as number

        if (nextNoteOctave > octave) {
          nextNote = tonal.Note.fromMidi(
            (tonal.Note.midi(nextNote) as number) - 12,
            true,
          )
          nextNoteOctave = tonal.Note.oct(nextNote) as number
        }
        if (nextNoteOctave < octave) {
          nextNote = tonal.Note.fromMidi(
            (tonal.Note.midi(nextNote) as number) + 12,
            true,
          )
          nextNoteOctave = tonal.Note.oct(nextNote) as number
        }
      }

      nextNote =
        nextNote.includes('#') && direction === 'down'
          ? (tonal.Note.enharmonic(nextNote) as string)
          : nextNote

      const nextNoteSharp = nextNote.includes('b')
        ? (tonal.Note.enharmonic(nextNote) as string)
        : nextNote

      currentNote = nextNote
      currentNoteSharp = nextNoteSharp

      index += 1
    }

    return notes.map(
      (name, index) =>
        ({
          noteName: name,
          id: uuid(),
        } as NoteCardNote),
    )
  }

  setNoteNameMouseOver = noteName =>
    this.setState({ noteNameMouseOver: noteName })

  submit = () => {
    this.props.onSubmit({
      noteNames: this.state.notes.map(n => n.noteName),
    })
    this.props.onClose()
  }

  handleDirectionChange = e =>
    this.setState(
      {
        values: { ...this.state.values, direction: e.target.value },
      },
      this.regenerateNoteSequence,
    )

  handleIntervalChange = e =>
    this.setState(
      {
        values: {
          ...this.state.values,
          stepInterval: parseInt(e.target.value, 10),
        },
      },
      this.regenerateNoteSequence,
    )

  regenerateNoteSequence = () => {
    this.setState({
      notes: this.generateNoteSequence(
        this.state.values.startNoteName,
        this.state.values.stepInterval,
        this.state.values.direction,
      ),
    })
  }

  private handleChangeNoteCardToEnharmonicClick = (index: number) =>
    this.setState(
      {
        values: {
          ...this.state.values,
          startNoteName: tonal.Note.enharmonic(
            this.state.values.startNoteName,
          ) as string,
        },
      },
      this.regenerateNoteSequence,
    )

  private getDirectionOptions = () => [
    { title: 'Up', value: 'up' },
    { title: 'Down', value: 'down' },
  ]

  private getIntervalOptions = memoize(() =>
    ['2m', '2M', '3m', '3M', '4P', '5d'].map(interval => {
      const semitones = tonal.Interval.semitones(interval) as number
      const intervalName =
        interval === '4P'
          ? 'Perfect 4th / Perfect 5th'
          : SemitonesToIntervalNameMap[interval]
      return {
        title: intervalName || interval,
        value: semitones,
      }
    }),
  )

  private handleStartNoteChange = (index, { noteName }) =>
    this.setState(
      { values: { ...this.state.values, startNoteName: noteName } },
      this.regenerateNoteSequence,
    )

  private handleSliderValueChanged = (event, value) => {
    this.setState(
      {
        values: {
          ...this.state.values,
          stepInterval: Math.abs(value),
          direction: value > 0 ? 'up' : 'down',
        },
      },
      this.regenerateNoteSequence,
    )
  }

  render() {
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
        <DialogContent className={css(`overflow-x: hidden;`)}>
          <Typography variant="h5">Add note sequence</Typography>
          <Typography variant="subtitle2">
            A number of notes with equal intervals in between
          </Typography>

          <Box mt={3}>
            <Typography
              variant="h6"
              className={css(`display: inline-block; margin-right: 10px;`)}
            >
              Starting note:
            </Typography>
            <div
              className={css(
                `display: inline-flex; margin-bottom: 15px; min-width: 100px;`,
              )}
            >
              <Flex flexWrap="wrap" flex={1} mt={2} maxWidth={300} width={1}>
                <NoteCards
                  showOctaves
                  disableRemoving
                  zIndex={10000000}
                  perLineCount={1}
                  notes={[
                    { id: '1', noteName: this.state.values.startNoteName },
                  ]}
                  onChangeToEnharmonicClick={
                    this.handleChangeNoteCardToEnharmonicClick
                  }
                  onEditNote={this.handleStartNoteChange}
                />
              </Flex>
            </div>

            <Typography variant="h6">Interval between notes</Typography>
            <Flex mb={2} mt={2} width={1} flexDirection="row" flexWrap="wrap">
              <FormControl
                className={css(
                  `width: 100%; max-width: 210px; margin-right: 20px; margin-bottom: 10px;`,
                )}
              >
                <InputLabel htmlFor="select-interval">Step interval</InputLabel>
                <NativeSelect
                  value={this.state.values.stepInterval}
                  onChange={this.handleIntervalChange}
                  input={<Input id="select-interval" />}
                >
                  {this.getIntervalOptions().map(({ title, value }) => (
                    <option key={value} value={value}>
                      {title}
                    </option>
                  ))}
                </NativeSelect>
              </FormControl>

              <FormControl
                className={css(
                  `width: 100%; max-width: 150px;  margin-bottom: 10px;`,
                )}
              >
                <InputLabel htmlFor="select-direction">
                  Step direction
                </InputLabel>
                <NativeSelect
                  value={this.state.values.direction}
                  onChange={this.handleDirectionChange}
                  input={<Input id="select-direction" />}
                >
                  {this.getDirectionOptions().map(({ title, value }) => (
                    <option key={value} value={value}>
                      {title}
                    </option>
                  ))}
                </NativeSelect>
              </FormControl>
            </Flex>

            <Flex mt={3} mb={3} width={1} flexDirection="column">
              <Typography id="slider-label" className={css(`font-size: 20px;`)}>
                {`${
                  SemitonesToIntervalNameMap[
                    tonal.Interval.fromSemitones(this.state.values.stepInterval)
                  ]
                } ${this.state.values.direction}`}
              </Typography>
              <Slider
                classes={{
                  container: css(`padding: 1rem;`),
                }}
                value={
                  this.state.values.stepInterval *
                  (this.state.values.direction === 'up' ? 1 : -1)
                }
                min={-7}
                max={7}
                step={1}
                aria-labelledby="slider-label"
                onChange={this.handleSliderValueChanged}
              />
            </Flex>

            <Divider light />

            <Box mt={4} width={1}>
              <Typography variant="h5">Resulting note sequence</Typography>
              <div className={css(`min-height: 250px;`)}>
                <Flex flexWrap="wrap" flex={1} mt={2}>
                  <NoteCards
                    hideContextMenu
                    zIndex={10000000}
                    notes={this.state.notes}
                    onChangeToEnharmonicClick={
                      this.handleChangeNoteCardToEnharmonicClick
                    }
                  />
                </Flex>
              </div>
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
  withMobileDialog<NoteSequenceModalProps>({ breakpoint: 'xs' })(
    NoteSequenceModal,
  ),
)
