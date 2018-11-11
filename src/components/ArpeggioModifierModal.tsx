import * as React from 'react'
import * as _ from 'lodash'
import { transpose } from 'tonal-distance'
import * as tonal from 'tonal'
import * as tonalChord from 'tonal-chord'

import { default as MuButton } from '@material-ui/core/Button'

import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import withMobileDialog from '@material-ui/core/withMobileDialog'

import InputLabel from '@material-ui/core/InputLabel'
import FormControl from '@material-ui/core/FormControl'
import NativeSelect from '@material-ui/core/NativeSelect'
import ArrowsIcon from '@material-ui/icons/Cached'

import PatternEditor from './PatternEditor'

import {
  ArpeggioPattern,
  ArpeggioPatternPreset,
  ChordType,
  StaffTick,
  Chord,
} from '../types'
import { ChangeEvent } from 'react'
import { Input, FormControlLabel, RadioGroup, Radio } from '@material-ui/core'
import { css } from 'react-emotion'
import Tooltip from './ui/Tooltip'
import {
  generateChordPatternFromPreset,
  chordOptions,
  chordsByChordType,
} from '../musicUtils'
import { Flex } from './ui/Flex'
import { Box } from './ui'
import NotesStaff from './NotesStaff'

export type SubmitValuesType = {
  chordType: ChordType
  patternPreset: ArpeggioPatternPreset
  pattern: ArpeggioPattern
  chordInversion: number
  isMelodic: boolean
}

type ArpeggioModifierModalProps = {
  isOpen: boolean
  onClose: () => any
  onSubmit: (args: SubmitValuesType) => any
  initialValues?: SubmitValuesType
}

type ArpeggioModifierModalState = {
  values: SubmitValuesType
}

type ChordTypeOption = {
  title: string
  value: ChordType
}

const chordTypeOptions: ChordTypeOption[] = _.sortBy(
  chordOptions.map(({ type, title }) => ({
    title,
    value: type,
    notesCount: chordsByChordType[type].notesCount,
  })),
  'notesCount',
)

type PatternPresetOption = {
  title: string
  value: ArpeggioPatternPreset
}

const patternPresetOptions: PatternPresetOption[] = [
  { title: 'Custom', value: 'custom' },
  { title: 'Ascending', value: 'ascending' },
  { title: 'Descending', value: 'descending' },
]

const numberToPositionalAdjectiveMap = [undefined, '1st', '2nd', '3rd']

const getChordInversionOptions = _.memoize((notesCount: number) => [
  { title: 'No inversion', value: '0' },
  ..._.range(1, notesCount).map(inversionNumber => ({
    title: `${
      inversionNumber < 4
        ? numberToPositionalAdjectiveMap[inversionNumber]
        : `${inversionNumber}th`
    } inversion`,
    value: `${inversionNumber}`,
  })),
])

// @ts-ignore
class ArpeggioModifierModal extends React.Component<
  ArpeggioModifierModalProps & { fullScreen: boolean },
  ArpeggioModifierModalState
> {
  static defaultProps: Partial<ArpeggioModifierModalProps> = {
    initialValues: {
      chordType: 'M',
      isMelodic: true,
      chordInversion: 0,
      patternPreset: 'ascending',
      pattern: generateChordPatternFromPreset({
        chord: chordsByChordType['M'],
        patternPreset: 'ascending',
      }),
    },
  }

  constructor(props) {
    super(props)

    this.state = {
      values: props.initialValues,
    }
  }

  handleSubmit = () => {
    this.props.onSubmit(this.state.values)
  }

  handleBrokenStackedChange = (event: ChangeEvent<HTMLSelectElement>) => {
    this.setState({
      values: {
        ...this.state.values,
        isMelodic: event.target.value === 'broken',
      },
    })
  }

  handleChordTypeSelected = (e: ChangeEvent<HTMLSelectElement>) => {
    const chordType = e.target.value as ChordType
    const chord = chordsByChordType[chordType] as Chord
    const { notesCount } = chord

    this.setState({
      values: {
        ...this.state.values,
        chordType,
        chordInversion: Math.min(
          notesCount - 1,
          this.state.values.chordInversion,
        ),
        pattern:
          this.state.values.patternPreset !== 'custom'
            ? generateChordPatternFromPreset({
                chord,
                patternPreset: this.state.values.patternPreset,
              })
            : {
                ...this.state.values.pattern,
                items: this.state.values.pattern.items.map(item => ({
                  ...item,
                  // Adapt the pattern to the new chord (e.g. when new chord has less notes, etc)
                  note:
                    item.note > notesCount
                      ? 1 + ((item.note - 1) % notesCount)
                      : item.note,
                })),
              },
      },
    })
  }

  handlePatternPresetSelected = (e: ChangeEvent<HTMLSelectElement>) => {
    const patternPreset = e.target.value as ArpeggioPatternPreset

    this.setState({
      values: {
        ...this.state.values,
        patternPreset,
        pattern:
          patternPreset !== 'custom'
            ? generateChordPatternFromPreset({
                chord: chordsByChordType[this.state.values.chordType],
                patternPreset: patternPreset,
              })
            : this.state.values.pattern,
      },
    })
  }

  handlePatternChange = (pattern: ArpeggioPattern) => {
    this.setState({
      values: {
        ...this.state.values,
        pattern: pattern,
        patternPreset: 'custom',
      },
    })
  }

  handleChordInversionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const chordInversion: number = parseInt(e.target.value, 10)
    this.setState({
      values: {
        ...this.state.values,
        chordInversion,
      },
    })
  }

  generateStaffTicks = () => {
    const { chordType, chordInversion } = this.state.values
    const chord = chordsByChordType[chordType]
    const intervals = tonalChord.intervals(chord.type)
    const baseNote = 'C4'

    let staffTicks: StaffTick[]
    if (this.state.values.isMelodic) {
      staffTicks = this.state.values.pattern.items.map((item, index) => {
        const note = item.muted
          ? undefined
          : transpose(baseNote, intervals[item.note - 1])
        return {
          id: `${index}`,
          notes: note
            ? [
                {
                  color: item.note === 1 ? 'red' : 'black',
                  id: `${index}`,
                  isMainNote: false,
                  midi: tonal.Note.midi(note),
                  noteName: note,
                },
              ]
            : [],
        } as StaffTick
      })
    } else {
      staffTicks = [
        {
          id: `tick-id`,
          notes: _.sortBy(
            intervals
              .map((interval, index) => {
                let resultNote = transpose(baseNote, interval)
                if (chordInversion > 0 && index >= chordInversion) {
                  resultNote = transpose(resultNote, '-8P')
                }
                return resultNote
              })
              .map((noteName, index) => {
                const isRootNote = index === 0
                return {
                  noteName,
                  isMainNote: isRootNote,
                  color: isRootNote ? 'red' : 'black',
                  id: `${index}`,
                  midi: tonal.Note.midi(noteName),
                }
              }),
            'midi',
          ),
        } as StaffTick,
      ]
    }

    return staffTicks
  }

  handleRandomizePattern = () => {
    const chord = chordsByChordType[this.state.values.chordType]
    const { pattern } = this.state.values
    const newPattern = {
      ...pattern,
      items: pattern.items.map(() => ({
        note: _.random(1, chord.notesCount),
      })),
    }
    this.handlePatternChange(newPattern)
  }

  render() {
    if (!this.props.isOpen) {
      return null
    }

    const chord = chordsByChordType[this.state.values.chordType]
    const { isMelodic } = this.state.values

    return (
      <Dialog
        fullWidth={true}
        fullScreen={this.props.fullScreen}
        open={this.props.isOpen}
        onClose={this.handleSubmit}
        aria-labelledby="arpeggio-modifier-dialog"
      >
        <DialogTitle id="arpeggio-modifier-dialog">Chords</DialogTitle>

        <DialogContent
          id="arpeggio-modifier-dialog-content"
          className={css({
            maxWidth: '600px',
            margin: '0 auto',
            width: '100%',
            marginTop: '2rem',
          })}
        >
          <Flex flexDirection="row">
            <FormControl className={css({ flex: 1 })}>
              <InputLabel htmlFor="chord-type">Chord type</InputLabel>
              <NativeSelect
                value={this.state.values.chordType}
                onChange={this.handleChordTypeSelected}
                name="chordType"
                input={<Input id="chord-type" />}
              >
                {chordTypeOptions.map(({ title, value }) => (
                  <option key={value} value={value}>
                    {title}
                  </option>
                ))}
              </NativeSelect>
            </FormControl>
          </Flex>

          <Flex>
            <FormControl component="fieldset">
              <RadioGroup
                row
                aria-label="Broken or stacked?"
                name="broken-stacked"
                value={this.state.values.isMelodic ? 'broken' : 'stacked'}
                onChange={this.handleBrokenStackedChange}
              >
                <FormControlLabel
                  value="broken"
                  control={<Radio />}
                  label="Broken chord"
                />
                <FormControlLabel
                  value="stacked"
                  control={<Radio />}
                  label="Stacked chord"
                />
              </RadioGroup>
            </FormControl>
          </Flex>

          <Flex mt={1} flexDirection="column">
            <Flex flexWrap="wrap" flexDirection="row" mt={2}>
              {isMelodic && (
                <FormControl className={css({ flex: 1, marginRight: '1rem' })}>
                  <InputLabel htmlFor="arp-pattern-preset">Pattern</InputLabel>
                  <NativeSelect
                    value={this.state.values.patternPreset}
                    onChange={this.handlePatternPresetSelected}
                    name="patternPreset"
                    input={<Input id="arp-pattern-preset" />}
                  >
                    {patternPresetOptions.map(({ title, value }) => (
                      <option key={value} value={value}>
                        {title}
                      </option>
                    ))}
                  </NativeSelect>
                </FormControl>
              )}

              {!isMelodic && (
                <FormControl className={css({ flex: 1, marginRight: '1rem' })}>
                  <InputLabel htmlFor="arp-chord-inversion">
                    Inversion
                  </InputLabel>
                  <NativeSelect
                    value={this.state.values.chordInversion}
                    onChange={this.handleChordInversionChange}
                    name="chordInversion"
                    input={<Input id="arp-chord-inversion" />}
                  >
                    {getChordInversionOptions(chord.notesCount).map(
                      ({ title, value }) => (
                        <option key={value} value={value}>
                          {title}
                        </option>
                      ),
                    )}
                  </NativeSelect>
                </FormControl>
              )}

              {isMelodic && (
                <Tooltip title="Randomize pattern" disableFocusListener={true}>
                  <MuButton
                    color="primary"
                    className={css({ minWidth: '40px' })}
                    size="small"
                    variant="outlined"
                    aria-label="Randomize pattern"
                    disabled={this.state.values.pattern.items.length < 1}
                    onClick={this.handleRandomizePattern}
                  >
                    <ArrowsIcon
                      fontSize="small"
                      className={css({ marginRight: '0.5rem' })}
                    />{' '}
                    Randomize
                  </MuButton>
                </Tooltip>
              )}
            </Flex>

            {isMelodic && (
              <Box width={1} mt={3}>
                <PatternEditor
                  useLetters
                  value={this.state.values.pattern}
                  onChange={this.handlePatternChange}
                  min={1}
                  max={chord.notesCount}
                  getSortableContainer={() =>
                    document.getElementById('arpeggio-modifier-dialog-content')
                  }
                />
              </Box>
            )}
          </Flex>

          <Box>
            <NotesStaff
              id="chord-preview"
              ticks={this.generateStaffTicks()}
              isPlaying={false}
              showBreaks
              activeTickIndex={undefined}
              height={160}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <MuButton onClick={this.props.onClose} color="secondary">
            Cancel
          </MuButton>
          <MuButton onClick={this.handleSubmit} color="primary" autoFocus>
            OK
          </MuButton>
        </DialogActions>
      </Dialog>
    )
  }
}

export default withMobileDialog<ArpeggioModifierModalProps>()(
  ArpeggioModifierModal,
)
