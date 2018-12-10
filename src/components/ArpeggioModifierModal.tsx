import * as React from 'react'
import * as _ from 'lodash'
import { transpose } from 'tonal-distance'
import * as tonal from 'tonal'

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
import PlayIcon from '@material-ui/icons/PlayArrow'
import StopIcon from '@material-ui/icons/Stop'
import memoize from 'memoize-one'

import PatternEditor from './PatternEditor'

import {
  ArpeggioPattern,
  ArpeggioPatternPreset,
  ChordType,
  StaffTick,
  Chord,
} from '../types'
import { ChangeEvent } from 'react'
import {
  Input,
  FormControlLabel,
  RadioGroup,
  Radio,
  IconButton,
  FormHelperText,
} from '@material-ui/core'
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
import settingsStore from '../services/settingsStore'
import InputSelect from './ui/InputSelect'
import {
  withAudioEngine,
  WithAudioEngineInjectedProps,
} from './withAudioEngine'
import AudioEngine, { AnimationCallback } from '../services/audioEngine'

const audioEngine = new AudioEngine()

type ChordTypeOption = {
  label: string
  value: ChordType
  notesCount: number
}

const chordTypeOptions: ChordTypeOption[] = _.sortBy(
  chordOptions.map(({ type, title }) => ({
    label: `C${type} — ${_.capitalize(title)}`,
    value: type,
    notesCount: chordsByChordType[type].notesCount,
  })),
  'notesCount',
)

const chordTypeOptionsByGroup = _.groupBy(
  chordTypeOptions,
  to => chordsByChordType[to.value].category,
)

const chordTypeOptionsGrouped = Object.keys(chordTypeOptionsByGroup).map(
  category => ({
    label: `${_.capitalize(category)} Chords`,
    options: chordTypeOptionsByGroup[category],
  }),
)

const chordTypeToChordTypeOptionMap = _.keyBy(chordTypeOptions, 'value')

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
  baseNote?: string
}

type ArpeggioModifierModalState = {
  values: SubmitValuesType
  isPlaying: boolean
  activeTickIndex?: number
}

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

const DEFAULT_CHORD_NAME = 'maj'

// @ts-ignore
class ArpeggioModifierModal extends React.Component<
  ArpeggioModifierModalProps & {
    fullScreen: boolean
  } & WithAudioEngineInjectedProps,
  ArpeggioModifierModalState
> {
  static defaultProps: Partial<ArpeggioModifierModalProps> = {
    initialValues: {
      chordType: DEFAULT_CHORD_NAME,
      isMelodic: true,
      chordInversion: 0,
      patternPreset: 'ascending',
      pattern: generateChordPatternFromPreset({
        chord: chordsByChordType[DEFAULT_CHORD_NAME],
        patternPreset: 'ascending',
      }),
    },
  }

  constructor(props) {
    super(props)

    this.state = {
      values: props.initialValues,
      isPlaying: false,
    }
  }

  handleSubmit = () => {
    audioEngine.stopLoop()
    this.props.onSubmit(this.state.values)
  }

  handleBrokenStackedChange = (event: ChangeEvent<HTMLSelectElement>) => {
    this.setState(
      {
        values: {
          ...this.state.values,
          isMelodic: event.target.value === 'broken',
        },
      },
      this.setPlaybackLoop,
    )
  }

  handleChordTypeSelected = (option: ChordTypeOption) => {
    const chordType = option.value
    const chord = chordsByChordType[chordType] as Chord
    const { notesCount } = chord

    this.setState(
      {
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
      },
      this.setPlaybackLoop,
    )
  }

  handlePatternPresetSelected = (e: ChangeEvent<HTMLSelectElement>) => {
    const patternPreset = e.target.value as ArpeggioPatternPreset

    this.setState(
      {
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
      },
      this.setPlaybackLoop,
    )
  }

  handlePatternChange = (pattern: ArpeggioPattern) => {
    this.setState(
      {
        values: {
          ...this.state.values,
          pattern: pattern,
          patternPreset: 'custom',
        },
      },
      () => {
        if (this.state.isPlaying) {
          this.setState({ isPlaying: false, activeTickIndex: 0 }, () => {
            audioEngine.stopLoop(() => {
              this.setPlaybackLoop()
              setTimeout(() => {
                this.setState({ isPlaying: true, activeTickIndex: 0 })
                audioEngine.playLoop()
              }, 100)
            })
          })
        } else {
          this.setPlaybackLoop()
        }
      },
    )
  }

  handleChordInversionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const chordInversion: number = parseInt(e.target.value, 10)
    this.setState({
      values: {
        ...this.state.values,
        chordInversion,
      },
    }, this.setPlaybackLoop)
  }

  generateStaffTicks = memoize(values => {
    const { chordType, chordInversion } = this.state.values
    const chord =
      chordsByChordType[chordType] || chordsByChordType[DEFAULT_CHORD_NAME]
    const { intervals } = chord
    const baseNote = this.props.baseNote || 'C4'

    let staffTicks: StaffTick[]

    // TODO: reuse similar logic from musicUtils module
    if (this.state.values.isMelodic) {
      staffTicks = this.state.values.pattern.items.map((item, index) => {
        const note = item.muted
          ? undefined
          : transpose(baseNote, intervals[item.note - 1] || '1P')

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
  })

  animationCallback: AnimationCallback = ({ tick }) => {
    if (tick.notes.length > 0) {
      this.setState({ activeTickIndex: tick.meta.staffTickIndex })
    }
  }

  setPlaybackLoop = () => {
    const ticks: StaffTick[] = [
      ...this.generateStaffTicks(this.state.values),
      {
        id: 'rest',
        notes: [],
      },
    ]
    audioEngine.setAudioFont(this.props.audioFontId)
    audioEngine.setLoop(ticks)
    audioEngine.setAnimationCallback(this.animationCallback)
  }

  togglePlayback = () => {
    if (this.state.isPlaying) {
      audioEngine.stopLoop()
      this.setState({ isPlaying: false })
    } else {
      this.setPlaybackLoop()
      audioEngine.playLoop()
      this.setState({ isPlaying: true, activeTickIndex: 0 })
    }
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

    const chord =
      chordsByChordType[this.state.values.chordType] ||
      chordsByChordType[DEFAULT_CHORD_NAME]
    const { isMelodic } = this.state.values

    return (
      <Dialog
        fullWidth={true}
        maxWidth="md"
        fullScreen={this.props.fullScreen}
        scroll="paper"
        open={this.props.isOpen}
        onClose={this.handleSubmit}
        aria-labelledby="arpeggio-modifier-dialog"
      >
        <DialogTitle id="arpeggio-modifier-dialog">Chords</DialogTitle>

        <DialogContent id="arpeggio-modifier-dialog-content">
          <Box maxWidth={700} width={1} mx="auto">
            <InputSelect
              textFieldProps={{
                label: 'Chord type',
                InputLabelProps: {
                  shrink: true,
                },
              }}
              value={
                this.state.values.chordType
                  ? chordTypeToChordTypeOptionMap[this.state.values.chordType]
                  : undefined
              }
              onChange={this.handleChordTypeSelected}
              name="chordType"
              options={chordTypeOptionsGrouped}
            />
            {chord.notes && (
              <FormHelperText>
                {`Notes in key of C:  `}
                <span
                  className={css({
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                  })}
                >{`${chord.notes.split(' ').join(', ')}`}</span>
              </FormHelperText>
            )}

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
                  <FormControl
                    className={css({ flex: 1, marginRight: '1rem' })}
                  >
                    <InputLabel htmlFor="arp-pattern-preset">
                      Pattern
                    </InputLabel>
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
                  <FormControl
                    className={css({ flex: 1, marginRight: '1rem' })}
                  >
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
                  <Tooltip
                    title="Randomize pattern"
                    disableFocusListener={true}
                  >
                    <MuButton
                      color="primary"
                      variant="extendedFab"
                      className={css({ minWidth: '40px' })}
                      size="small"
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
                      document.getElementById(
                        'arpeggio-modifier-dialog-content',
                      )
                    }
                  />
                </Box>
              )}
            </Flex>

            <Flex flexDirection="row" alignItems="center">
              <IconButton
                color="secondary"
                onClick={this.togglePlayback}
                className={css(`margin-right: 0.5rem;`)}
              >
                {this.state.isPlaying ? (
                  <StopIcon fontSize="large" />
                ) : (
                  <PlayIcon fontSize="large" />
                )}
              </IconButton>
              <NotesStaff
                id="chord-preview"
                clef={settingsStore.clefType}
                activeTickIndex={
                  this.state.isPlaying ? this.state.activeTickIndex : undefined
                }
                ticks={this.generateStaffTicks(this.state.values)}
                tickLabels={[
                  `${tonal.Note.pc(this.props.baseNote || 'C4')}${
                    this.state.values.chordType
                  }`,
                ]}
                isPlaying={this.state.isPlaying}
                showBreaks
                containerProps={{ flex: '1' }}
                maxLines={1}
              />
            </Flex>
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

export default withAudioEngine(
  withMobileDialog<ArpeggioModifierModalProps>()(ArpeggioModifierModal),
)
