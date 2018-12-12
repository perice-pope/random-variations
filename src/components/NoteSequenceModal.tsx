import * as React from 'react'
import * as _ from 'lodash'
import * as tonal from 'tonal'

import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
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
} from '@material-ui/core'
import NoteCards, { NoteCardNote } from './NoteCards'
import { NoteNamesWithSharps, SemitonesToIntervalNameMap } from '../musicUtils'
import Slider from '@material-ui/lab/Slider'

type NoteSequenceModalProps = {
  isOpen: boolean
  onClose: () => any
  onSubmit: (args: { noteNames: string[] }) => any
}

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

const generateNoteSequence = (
  noteName: string,
  stepInterval: number,
  direction: 'up' | 'down',
) => {
  const notes: string[] = []
  const notesUsedSharps = {}
  const octave = tonal.Note.oct(noteName)
  let currentNote = noteName
  let currentNoteSharp = currentNote.includes('b')
    ? (tonal.Note.enharmonic(currentNote) as string)
    : currentNote

  while (!notesUsedSharps[currentNoteSharp] && notes.length <= 12) {
    notesUsedSharps[currentNoteSharp] = true
    notes.push(currentNote)

    const nextNote = tonal.Note.fromMidi(
      (tonal.Note.midi(currentNote) as number) +
        stepInterval * (direction === 'up' ? 1 : -1),
    ) as string
    const nextNotePitch = tonal.Note.pc(nextNote)

    currentNote = `${nextNotePitch}${octave}`
    currentNoteSharp = currentNote.includes('b')
      ? (tonal.Note.enharmonic(currentNote) as string)
      : currentNote
  }

  return notes.map(
    (name, index) =>
      ({
        noteName: name,
        id: uuid(),
      } as NoteCardNote),
  )
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

      notes: generateNoteSequence(startNoteName, stepInterval, direction),
    }
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
      notes: generateNoteSequence(
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

  private getIntervalOptions = () =>
    NoteNamesWithSharps.map(
      noteName => tonal.Distance.semitones(noteName, 'C') as number,
    )
      .filter(x => x != null)
      .map(semitones => {
        const interval = tonal.Interval.fromSemitones(semitones)
        const intervalName = SemitonesToIntervalNameMap[interval]
        return {
          title: intervalName || interval,
          value: semitones,
        }
      })

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
        <DialogTitle id="pick-note-dialog">Add note sequence</DialogTitle>

        <DialogContent className={css(`overflow-x: hidden;`)}>
          <Box width={1} maxWidth={600} mx="auto" flex={1} mt={2}>
            <Flex flexDirection="column" alignItems="center">
              <Typography className={css(`font-size: 20px;`)}>
                Start sequence at:
              </Typography>
              <Flex flexWrap="wrap" flex={1} mt={2} maxWidth={300} width={1}>
                <NoteCards
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
            </Flex>

            <Flex
              mt={4}
              mb={2}
              width={1}
              flexDirection="row"
              justifyContent="center"
              flexWrap="wrap"
            >
              <FormControl
                className={css(
                  `width: 100%; max-width: 150px; margin-right: 20px;`,
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

              <FormControl className={css(`width: 100%; max-width: 150px`)}>
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

            <Flex
              mt={3}
              mb={2}
              width={1}
              flexDirection="column"
              alignItems="center"
            >
              <Typography id="slider-label" className={css(`font-size: 20px;`)}>
                {`1 step = ${
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
                min={-12}
                max={12}
                step={1}
                aria-labelledby="slider-label"
                onChange={this.handleSliderValueChanged}
              />
            </Flex>

            <Box mt={4} width={1}>
              <Typography
                className={css(`font-size: 24px; text-align: center;`)}
              >
                Resulting note sequence:
              </Typography>
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
  withMobileDialog<NoteSequenceModalProps>()(NoteSequenceModal),
)
