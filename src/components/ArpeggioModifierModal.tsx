import * as React from 'react'
import * as _ from 'lodash'
import { transpose } from 'tonal-distance'
import * as tonal from 'tonal'

import Button, { default as MuButton } from '@material-ui/core/Button'

import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import withMobileDialog from '@material-ui/core/withMobileDialog'

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
  ChordModifier,
} from '../types'
import { ChangeEvent } from 'react'
import {
  Input,
  FormControlLabel,
  RadioGroup,
  Radio,
  IconButton,
  FormHelperText,
  Typography,
  Divider,
  Switch,
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
import { Omit } from '../utils'

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

export type SubmitValuesType = Omit<ChordModifier, 'enabled'> & {
  customPatternAllowRepeatedNotes: boolean
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
    baseNote: 'C4',
    initialValues: {
      chordType: DEFAULT_CHORD_NAME,
      isMelodic: true,
      chordInversion: 0,
      patternPreset: 'ascending',
      pattern: generateChordPatternFromPreset({
        chord: chordsByChordType[DEFAULT_CHORD_NAME],
        patternPreset: 'ascending',
      }),
      customPatternAllowRepeatedNotes: false,
    },
  }

  constructor(props) {
    super(props)

    this.state = {
      values: props.initialValues,
      isPlaying: false,
    }
  }

  handleClose = () => {
    audioEngine.stopLoop()
    this.setState({ isPlaying: false })
    this.props.onClose()
  }

  handleSubmit = () => {
    audioEngine.stopLoop()
    this.setState({ isPlaying: false })
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
    this.setState(
      {
        values: {
          ...this.state.values,
          chordInversion,
        },
      },
      this.setPlaybackLoop,
    )
  }

  generateStaffTicks = memoize((values, baseNote) => {
    const { chordType, chordInversion } = values
    const chord =
      chordsByChordType[chordType] || chordsByChordType[DEFAULT_CHORD_NAME]
    const { intervals } = chord

    let staffTicks: StaffTick[]

    // TODO: reuse similar logic from musicUtils module
    if (values.isMelodic) {
      staffTicks = values.pattern.items.map((item, index) => {
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
      ...this.generateStaffTicks(this.state.values, this.props.baseNote),
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

  buildRandomPattern = () => {
    const chord = chordsByChordType[this.state.values.chordType]
    const { pattern, customPatternAllowRepeatedNotes } = this.state.values

    let newPatternLength = this.state.values.pattern.items.length
    if (!customPatternAllowRepeatedNotes) {
      newPatternLength = Math.min(newPatternLength, chord.notesCount)
    }

    const newPattern = {
      ...pattern,
      items: customPatternAllowRepeatedNotes
        ? pattern.items.map(() => ({
            note: _.random(1, chord.notesCount),
          }))
        : _.sampleSize(_.range(1, chord.notesCount + 1), newPatternLength).map(
            note => ({
              note,
              muted: false,
            }),
          ),
    }

    return newPattern
  }

  handleRandomizePattern = () => {
    let newPattern = this.buildRandomPattern()
    if (newPattern.items.length > 1) {
      // Ensure that the new pattern will be different from the old one
      let triesCount = 0
      while (
        _.isEqual(newPattern, this.state.values.pattern) &&
        triesCount < 20
      ) {
        newPattern = this.buildRandomPattern()
        triesCount += 1
      }
    }
    this.handlePatternChange(newPattern)
  }

  handleSelectRandomChordType = () => {
    this.handleChordTypeSelected(_.sample(chordTypeOptions) as ChordTypeOption)
  }

  handleChangeAllowRepeatedNotes = (e, checked) => {
    this.setState(
      {
        values: {
          ...this.state.values,
          customPatternAllowRepeatedNotes: Boolean(checked),
        },
      },
      () => {
        if (this.state.values.patternPreset === 'custom') {
          this.handleRandomizePattern()
        }
      },
    )
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
        <DialogContent id="arpeggio-modifier-dialog-content">
          <Box>
            <Typography variant="h6">Chord type</Typography>
            <Box mt={1}>
              <div
                className={css(`
                display: flex;
                flex-direction: row;
                align-items: flex-start;
                
                @media screen and (max-width: 500px) {
                  flex-direction: column;
                  align-items: stretch;
                }
              `)}
              >
                <div className={css(`flex: 1; margin-top: 7px;`)}>
                  <InputSelect
                    classes={{
                      singleValue: css(`
                        overflow: hidden;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                      `),
                      valueContainer: css(`flex-wrap: nowrap;`),
                    }}
                    textFieldProps={{
                      InputLabelProps: {
                        shrink: true,
                      },
                    }}
                    value={
                      this.state.values.chordType
                        ? chordTypeToChordTypeOptionMap[
                            this.state.values.chordType
                          ]
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
                </div>

                <Tooltip title="Choose random chord">
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={this.handleSelectRandomChordType}
                    className={css(`
                      margin-left: 0.5rem;
                      @media screen and (max-width: 500px) {
                        margin-left: 0;
                        margin-top: 0.5rem;
                      }
                    `)}
                  >
                    <ArrowsIcon
                      fontSize="small"
                      className={css(`margin-right: 0.5rem;`)}
                    />
                    Random
                  </Button>
                </Tooltip>
              </div>
            </Box>

            <Flex mt={2} mb={2}>
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

            <Divider light />

            <Flex mb={3} mt={3} flexDirection="column">
              <Typography variant="h6">
                {isMelodic ? 'Pattern' : 'Inversion'}
              </Typography>
              <Flex
                flexWrap="wrap"
                flexDirection="row"
                alignItems="center"
                mt={1}
              >
                {isMelodic && (
                  <FormControl
                    className={css({ flex: 1, marginRight: '1rem' })}
                  >
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
                  <Tooltip title="Randomize pattern">
                    <MuButton
                      color="primary"
                      variant="outlined"
                      className={css({ minWidth: '40px' })}
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

              {this.state.values.patternPreset === 'custom' && (
                <FormControlLabel
                  control={
                    <Switch
                      onChange={this.handleChangeAllowRepeatedNotes}
                      checked={
                        this.state.values.customPatternAllowRepeatedNotes
                      }
                      color="primary"
                    />
                  }
                  label="Allow pattern notes to repeat"
                />
              )}

              {isMelodic && (
                <Box width={1} mt={3}>
                  <PatternEditor
                    useLetters
                    value={this.state.values.pattern}
                    onChange={this.handlePatternChange}
                    min={1}
                    max={chord.notesCount}
                    maxPatternLength={
                      this.state.values.customPatternAllowRepeatedNotes
                        ? 16
                        : chord.notesCount
                    }
                    getSortableContainer={() =>
                      document.getElementById(
                        'arpeggio-modifier-dialog-content',
                      )
                    }
                  />
                </Box>
              )}
            </Flex>

            <Divider light />

            <Box mt={2}>
              <Flex flexDirection="row" alignItems="center">
                <IconButton
                  color="secondary"
                  onClick={this.togglePlayback}
                  className={css(`margin-left: -1rem; margin-right: 0.5rem;`)}
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
                    this.state.isPlaying
                      ? this.state.activeTickIndex
                      : undefined
                  }
                  ticks={this.generateStaffTicks(
                    this.state.values,
                    this.props.baseNote,
                  )}
                  tickLabels={[
                    `${tonal.Note.pc(this.props.baseNote || 'C4')}${
                      this.state.values.chordType
                    }`,
                  ]}
                  isPlaying={this.state.isPlaying}
                  showBreaks
                  containerProps={{ flex: '1' }}
                />
              </Flex>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <MuButton onClick={this.handleClose} color="secondary">
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
  withMobileDialog<ArpeggioModifierModalProps>({ breakpoint: 'sm' })(
    ArpeggioModifierModal,
  ),
)
