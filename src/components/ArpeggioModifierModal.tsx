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
} from 'src/types'
import { ChangeEvent } from 'react'
import { Input, Tooltip, Switch, FormControlLabel } from '@material-ui/core'
import { css } from 'react-emotion'
import {
  generateChordPatternFromPreset,
  chordOptions,
  chordsByChordType,
} from 'src/musicUtils'
import { Flex } from './ui/Flex'
import { Box } from './ui'
import NotesStaff from './NotesStaff'

export type SubmitValuesType = {
  chordType: ChordType
  patternPreset: ArpeggioPatternPreset
  pattern: ArpeggioPattern
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

// @ts-ignore
class ArpeggioModifierModal extends React.Component<
  ArpeggioModifierModalProps & { fullScreen: boolean },
  ArpeggioModifierModalState
> {
  static defaultProps: Partial<ArpeggioModifierModalProps> = {
    initialValues: {
      chordType: 'M',
      isMelodic: true,
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

  handleIsMelodicSwitchChange = event => {
    this.setState({
      values: { ...this.state.values, isMelodic: event.target.checked },
    })
  }

  handleChordTypeSelected = (e: ChangeEvent<HTMLSelectElement>) => {
    const chordType = e.target.value as ChordType
    this.setState({
      values: {
        ...this.state.values,
        chordType,
        pattern:
          this.state.values.patternPreset !== 'custom'
            ? generateChordPatternFromPreset({
                chord: chordsByChordType[chordType],
                patternPreset: this.state.values.patternPreset,
              })
            : // TODO: adapt the pattern to the new chord (e.g. when new chord has less notes, etc)
              this.state.values.pattern,
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

  generateStaffTicks = () => {
    const chord = chordsByChordType[this.state.values.chordType]
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
          notes: intervals
            .map(interval => transpose(baseNote, interval))
            .map((note, index) => ({
              color: note === baseNote ? 'red' : 'black',
              id: `${index}`,
              isMainNote: note === baseNote,
              midi: tonal.Note.midi(note),
              noteName: note,
            })),
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
            <FormControlLabel
              control={
                <Switch
                  checked={this.state.values.isMelodic}
                  color="primary"
                  onChange={this.handleIsMelodicSwitchChange}
                />
              }
              label={this.state.values.isMelodic ? 'Melodic' : 'Harmonic'}
            />
          </Flex>

          {isMelodic && (
            <Flex mt={[1, 2, 4]} flexDirection="column">
              <Flex flexWrap="wrap" flexDirection="row" mt={4}>
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
              </Flex>

              <Box width={1} mt={3}>
                <PatternEditor
                  value={this.state.values.pattern}
                  onChange={this.handlePatternChange}
                  min={1}
                  max={chord.notesCount}
                  getSortableContainer={() =>
                    document.getElementById('arpeggio-modifier-dialog-content')
                  }
                />
              </Box>
            </Flex>
          )}

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
