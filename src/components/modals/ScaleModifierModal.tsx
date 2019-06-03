import * as React from 'react'
import * as _ from 'lodash'
import * as tonal from 'tonal'

import Button, { default as MuButton } from '@material-ui/core/Button'

import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import withMobileDialog from '@material-ui/core/withMobileDialog'

import FormHelperText from '@material-ui/core/FormHelperText'
import FormControl from '@material-ui/core/FormControl'
import NativeSelect from '@material-ui/core/NativeSelect'
import ArrowsIcon from '@material-ui/icons/Cached'
import PlayIcon from '@material-ui/icons/PlayArrow'
import StopIcon from '@material-ui/icons/Stop'
import memoize from 'memoize-one'

import PatternEditor from '../PatternEditor'

import {
  ScalePattern,
  ScalePatternPreset,
  ScaleType,
  StaffTick,
  Scale,
  ScaleModifier,
} from '../../types'
import { ChangeEvent } from 'react'
import {
  Input,
  IconButton,
  Typography,
  Divider,
  FormControlLabel,
  Switch,
} from '@material-ui/core'
import { css } from 'react-emotion'
import Tooltip from '../ui/Tooltip'
import {
  scaleOptions,
  scaleByScaleType,
  generateScalePatternFromPreset,
  getConcertPitchMidi,
} from '../../musicUtils'
import { Flex } from '../ui/Flex'
import { Box } from '../ui'
import NotesStaff from '../NotesStaff'
import { Omit } from '../../utils'
import settingsStore from '../../services/settingsStore'
import InputSelect from '../ui/InputSelect'
import {
  WithAudioEngineInjectedProps,
  withAudioEngine,
} from '../withAudioEngine'

import AudioEngine, {
  TickCallback,
  SoundEvent,
  ChannelAudioContent,
} from '../../services/audioEngine'
import sessionStore from '../../services/sessionStore'
import { channelId } from '../../utils/channels'

const audioEngine = new AudioEngine()

export type SubmitValuesType = Omit<ScaleModifier, 'enabled'> & {
  customPatternAllowRepeatedNotes: boolean
}

type ScaleModifierModalProps = {
  isOpen: boolean
  onClose: () => any
  onSubmit: (args: SubmitValuesType) => any
  initialValues?: SubmitValuesType
  baseNote?: string
}

type ScaleModifierModalState = {
  values: SubmitValuesType
  inputValues: {
    scaleType?: string
  }
  isPlaying: boolean
  activeTickIndex?: number
}

type ScaleTypeOption = {
  label: string
  value: ScaleType
  mode: string
}

const scaleTypeOptions: ScaleTypeOption[] = scaleOptions.map(
  ({ type, mode, title }) => ({
    label:
      _.capitalize(title) === _.capitalize(mode)
        ? _.capitalize(title)
        : [_.capitalize(title), _.capitalize(mode)]
            .filter(_.identity)
            .join(' — '),
    value: type,
    mode: mode
      ? `${_.capitalize(mode).replace(/mode \d+$/, '')}  Modes`
      : 'Others',
  }),
)

const scaleTypeOptionsByMode = _.groupBy(scaleTypeOptions, 'mode')

const scaleTypeOptionsGrouped = Object.keys(scaleTypeOptionsByMode).map(
  mode => ({
    label: `${_.capitalize(mode)}`,
    options: scaleTypeOptionsByMode[mode],
  }),
)

const scaleTypeToScaleTypeOptionMap = _.keyBy(scaleTypeOptions, 'value')

type PatternPresetOption = {
  title: string
  value: ScalePatternPreset
}

const adaptPatternForScale = ({
  pattern,
  scale,
}: {
  pattern: ScalePattern
  scale: Scale
}) => {
  return {
    ...pattern,
    items: pattern.items.map(item => ({
      ...item,
      // Adapt the pattern to the new Scale (e.g. when new Scale has less notes, etc)
      note:
        item.note > scale.notesCount
          ? 1 + ((item.note - 1) % scale.notesCount)
          : item.note,
    })),
  } as ScalePattern
}

const patternPresetOptions: PatternPresetOption[] = [
  { title: 'Custom', value: 'custom' },
  ...[
    'up',
    'down',
    'up down',
    'down up',
    'up, skip 1',
    'down, skip 1',
    'up down, skip 1',
    'down up, skip 1',
  ].map(
    type => ({ value: type, title: _.capitalize(type) } as PatternPresetOption),
  ),
]

type Props = ScaleModifierModalProps & {
  fullScreen: boolean
} & WithAudioEngineInjectedProps

const DEFAULT_SCALE_NAME = 'ionian'

// @ts-ignore
class ScaleModifierModal extends React.Component<
  Props,
  ScaleModifierModalState
> {
  static defaultProps: Partial<ScaleModifierModalProps> = {
    baseNote: 'C4',
    initialValues: {
      scaleType: DEFAULT_SCALE_NAME,
      patternPreset: 'up',
      pattern: generateScalePatternFromPreset({
        scale: scaleByScaleType[DEFAULT_SCALE_NAME],
        patternPreset: 'up',
      }),
      customPatternAllowRepeatedNotes: false,
    },
  }

  constructor(props: Props) {
    super(props)

    const scale =
      scaleByScaleType[props.initialValues!.scaleType] ||
      (scaleByScaleType[DEFAULT_SCALE_NAME] as Scale)

    this.state = {
      inputValues: {
        scaleType: props.initialValues!.scaleType,
      },
      values: {
        ...props.initialValues!,
        pattern: adaptPatternForScale({
          pattern: props.initialValues!.pattern,
          scale,
        }),
      },
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

  handleIsMelodicSwitchChange = event => {
    this.setState(
      {
        values: { ...this.state.values, isMelodic: event.target.checked },
      },
      this.setPlaybackLoop,
    )
  }

  handleScaleTypeBlur = () => {
    if (!this.state.inputValues.scaleType) {
      this.setState({
        inputValues: {
          ...this.state.inputValues,
          scaleType: this.state.values.scaleType,
        },
      })
    }
  }

  handleScaleTypeSelected = (scaleOption: ScaleTypeOption) => {
    if (!scaleOption) {
      this.setState({
        inputValues: { ...this.state.inputValues, scaleOption: undefined },
      })
      return
    }

    const scaleType = scaleOption.value
    const scale =
      scaleByScaleType[scaleType] ||
      (scaleByScaleType[DEFAULT_SCALE_NAME] as Scale)

    let { pattern, patternPreset } = this.state.values
    const shouldResetPatternType = scaleType !== this.state.values.scaleType
    if (shouldResetPatternType) {
      patternPreset = 'up'
      pattern = generateScalePatternFromPreset({
        scale,
        patternPreset,
      })
    } else {
      pattern =
        this.state.values.patternPreset === 'custom'
          ? adaptPatternForScale({
              scale,
              pattern: this.state.values.pattern,
            })
          : generateScalePatternFromPreset({
              scale,
              patternPreset: this.state.values.patternPreset,
            })
    }

    this.setState(
      {
        inputValues: { ...this.state.inputValues, scaleType },
        values: {
          ...this.state.values,
          scaleType,
          patternPreset,
          pattern,
        },
      },
      this.setPlaybackLoop,
    )
  }

  handlePatternPresetSelected = (e: ChangeEvent<HTMLSelectElement>) => {
    const patternPreset = e.target.value as ScalePatternPreset

    this.setState(
      {
        values: {
          ...this.state.values,
          patternPreset,
          pattern:
            patternPreset !== 'custom'
              ? generateScalePatternFromPreset({
                  scale: scaleByScaleType[this.state.values.scaleType],
                  patternPreset: patternPreset,
                })
              : this.state.values.pattern,
        },
      },
      this.setPlaybackLoop,
    )
  }

  handlePatternChange = (pattern: ScalePattern) => {
    this.setState(
      {
        values: {
          ...this.state.values,
          pattern: pattern,
          patternPreset: 'custom',
        },
      },
      this.setPlaybackLoop,
    )
  }

  generateStaffTicks = memoize((values, baseNote) => {
    const { scaleType } = values
    const scale = scaleByScaleType[scaleType]
    const { intervals = [] } = scale

    let staffTicks: StaffTick[]

    staffTicks = values.pattern.items.map((item, index) => {
      const interval =
        item && !item.muted ? intervals[item.note - 1] || '1P ' : '1P'
      const note = item.muted
        ? undefined
        : (tonal.Distance.transpose(baseNote, interval) as string)

      return {
        id: `${index}`,
        notes: note
          ? [
              {
                color:
                  tonal.Note.pc(note) === tonal.Note.pc(baseNote)
                    ? 'red'
                    : 'black',
                id: `${index}`,
                isMainNote: false,
                midi: tonal.Note.midi(note),
                noteName: note,
              },
            ]
          : [],
      } as StaffTick
    })

    return staffTicks.map(st => ({
      ...st,
      notes: st.notes.map(n => ({
        ...n,
        midi: getConcertPitchMidi(
          sessionStore.activeSession!.instrumentTransposing,
          n.midi,
        ),
      })),
    }))
  })

  buildRandomPattern = () => {
    const scale = scaleByScaleType[this.state.values.scaleType]
    const { pattern, customPatternAllowRepeatedNotes } = this.state.values

    let newPatternLength = this.state.values.pattern.items.length
    if (!customPatternAllowRepeatedNotes) {
      newPatternLength = Math.min(newPatternLength, scale.notesCount)
    }

    const newPattern = {
      ...pattern,
      items: customPatternAllowRepeatedNotes
        ? pattern.items.map(() => ({
            note: _.random(1, scale.notesCount),
          }))
        : _.sampleSize(_.range(1, scale.notesCount + 1), newPatternLength).map(
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

  tickCallback: TickCallback = ({
    event,
  }: {
    event: SoundEvent<{ staffTickIndex: number }>
  }) => {
    if (event.data) {
      this.setState({ activeTickIndex: event.data.staffTickIndex })
    }
  }

  setPlaybackLoop = () => {
    const staffTicks: StaffTick[] = [
      ...this.generateStaffTicks(this.state.values, this.props.baseNote),
      {
        id: 'rest',
        notes: [],
      },
    ]
    const audioFontId = settingsStore.audioFontId
    const notesChannelAudioContent: ChannelAudioContent<{
      staffTickIndex: number
    }> = {
      loop: {
        startAt: 0,
        endAt: staffTicks.length,
      },
      startAt: 0,
      events: staffTicks.map(
        (tick, staffTickIndex) =>
          ({
            sounds: tick.notes.map(note => ({ midi: note.midi, audioFontId })),
            data: { staffTickIndex },
          } as SoundEvent<{ staffTickIndex: number }>),
      ),
      playbackRate: 1,
    }
    audioEngine.setAudioContent({ [channelId.NOTES]: notesChannelAudioContent })
    audioEngine.setTickCallback(this.tickCallback)
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

  handleSelectRandomScaleType = () => {
    this.handleScaleTypeSelected(_.sample(scaleTypeOptions) as ScaleTypeOption)
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

    const scale = scaleByScaleType[this.state.values.scaleType]

    return (
      <Dialog
        fullWidth={true}
        fullScreen={this.props.fullScreen}
        maxWidth="md"
        scroll="paper"
        open={this.props.isOpen}
        onClose={this.handleSubmit}
        aria-labelledby="scale-modifier-dialog"
      >
        <DialogContent id="scale-modifier-dialog-content">
          <Box mt={2}>
            <Typography variant="h6">Scale type</Typography>

            <Box mb={3}>
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
                      this.state.inputValues.scaleType
                        ? scaleTypeToScaleTypeOptionMap[
                            this.state.inputValues.scaleType
                          ]
                        : undefined
                    }
                    placeholder="Type to find a scale..."
                    isSearchable
                    removeOnBackspace
                    onChange={this.handleScaleTypeSelected}
                    onBlur={this.handleScaleTypeBlur}
                    name="chordType"
                    options={scaleTypeOptionsGrouped}
                  />
                  {scale.notes && (
                    <FormHelperText>
                      {`Notes in key of C:  `}
                      <span
                        className={css({
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                        })}
                      >{`${scale.notes.split(' ').join(', ')}`}</span>
                    </FormHelperText>
                  )}
                </div>

                <Tooltip title="Choose random scale">
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={this.handleSelectRandomScaleType}
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

            <Divider light />

            <Flex mt={2} mb={3} flexDirection="column">
              <Typography variant="h6">Pattern</Typography>
              <Flex flexWrap="wrap" flexDirection="row" alignItems="center">
                <FormControl className={css({ flex: 1, marginRight: '1rem' })}>
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
                    className={css({ minWidth: '40px' })}
                    color="primary"
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

              {this.state.values.patternPreset === 'custom' && (
                <FormControlLabel
                  classes={{
                    label: css(`user-select: none;`),
                  }}
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

              <div
                className={css(`
                  margin-top: 16px;
                  @media screen and (max-width: 600px) {
                    margin-left: -15px;
                    margin-right: -15px;
                  }
                `)}
              >
                <PatternEditor
                  value={this.state.values.pattern}
                  onChange={this.handlePatternChange}
                  min={1}
                  max={scale.notesCount}
                  maxPatternLength={
                    this.state.values.customPatternAllowRepeatedNotes
                      ? 16
                      : scale.notesCount
                  }
                  getSortableContainer={() =>
                    document.getElementById('scale-modifier-dialog-content')
                  }
                />
              </div>
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
                  topOffset={30}
                  staveHeight={120}
                  ticks={this.generateStaffTicks(
                    this.state.values,
                    this.props.baseNote,
                  )}
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
  withMobileDialog<ScaleModifierModalProps>({ breakpoint: 'sm' })(
    ScaleModifierModal,
  ),
)
