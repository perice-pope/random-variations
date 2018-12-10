import * as React from 'react'
import * as _ from 'lodash'
import * as tonal from 'tonal'

import { default as MuButton } from '@material-ui/core/Button'

import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import withMobileDialog from '@material-ui/core/withMobileDialog'

import FormHelperText from '@material-ui/core/FormHelperText'
import InputLabel from '@material-ui/core/InputLabel'
import FormControl from '@material-ui/core/FormControl'
import NativeSelect from '@material-ui/core/NativeSelect'
import ArrowsIcon from '@material-ui/icons/Cached'
import PlayIcon from '@material-ui/icons/PlayArrow'
import StopIcon from '@material-ui/icons/Stop'
import memoize from 'memoize-one'

import PatternEditor from './PatternEditor'

import {
  ScalePattern,
  ScalePatternPreset,
  ScaleType,
  StaffTick,
  Scale,
  ScaleModifier,
} from '../types'
import { ChangeEvent } from 'react'
import { Input, IconButton } from '@material-ui/core'
import { css } from 'react-emotion'
import Tooltip from './ui/Tooltip'
import {
  scaleOptions,
  scaleByScaleType,
  generateScalePatternFromPreset,
} from '../musicUtils'
import { Flex } from './ui/Flex'
import { Box } from './ui'
import NotesStaff from './NotesStaff'
import { Omit } from '../utils'
import settingsStore from '../services/settingsStore'
import InputSelect from './ui/InputSelect'
import {
  WithAudioEngineInjectedProps,
  withAudioEngine,
} from './withAudioEngine'

import AudioEngine, { AnimationCallback } from '../services/audioEngine'

const audioEngine = new AudioEngine()

export type SubmitValuesType = Omit<ScaleModifier, 'enabled'>

type ScaleModifierModalProps = {
  isOpen: boolean
  onClose: () => any
  onSubmit: (args: SubmitValuesType) => any
  initialValues?: SubmitValuesType
  baseNote?: string
}

type ScaleModifierModalState = {
  values: SubmitValuesType
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
    label: [_.capitalize(title), _.capitalize(mode)]
      .filter(_.identity)
      .join(' — '),
    value: type,
    mode: mode
      ? `${_.capitalize(mode).replace(/mode \d+$/, '')}  Modes`
      : 'Others',
  }),
)

const scaleTypeOptionsByMode = _.groupBy(scaleTypeOptions, 'mode')

const chordTypeOptionsGrouped = Object.keys(scaleTypeOptionsByMode).map(
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
    initialValues: {
      scaleType: DEFAULT_SCALE_NAME,
      patternPreset: 'up',
      pattern: generateScalePatternFromPreset({
        scale: scaleByScaleType[DEFAULT_SCALE_NAME],
        patternPreset: 'up',
      }),
    },
  }

  constructor(props: Props) {
    super(props)

    const scale =
      scaleByScaleType[props.initialValues!.scaleType] ||
      (scaleByScaleType[DEFAULT_SCALE_NAME] as Scale)
    this.state = {
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

  handleSubmit = () => {
    audioEngine.stopLoop()
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

  handleScaleTypeSelected = (scaleOption: ScaleTypeOption) => {
    const scaleType = scaleOption.value
    const scale =
      scaleByScaleType[scaleType] ||
      (scaleByScaleType[DEFAULT_SCALE_NAME] as Scale)

    this.setState(
      {
        values: {
          ...this.state.values,
          scaleType,
          pattern:
            this.state.values.patternPreset !== 'custom'
              ? generateScalePatternFromPreset({
                  scale,
                  patternPreset: this.state.values.patternPreset,
                })
              : adaptPatternForScale({
                  scale,
                  pattern: this.state.values.pattern,
                }),
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

  generateStaffTicks = memoize(values => {
    const { scaleType } = this.state.values
    const scale = scaleByScaleType[scaleType]
    const { intervals = [] } = scale
    const baseNote = this.props.baseNote || 'C4'

    let staffTicks: StaffTick[]

    staffTicks = this.state.values.pattern.items.map((item, index) => {
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

    return staffTicks
  })

  handleRandomizePattern = () => {
    const scale = scaleByScaleType[this.state.values.scaleType]
    const { pattern } = this.state.values
    const newPattern = {
      ...pattern,
      items: pattern.items.map(() => ({
        note: _.random(1, scale.notesCount),
      })),
    }
    this.handlePatternChange(newPattern)
  }

  // TODO: refactor common code here and in ArpeggioModifierModal
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

  render() {
    if (!this.props.isOpen) {
      return null
    }

    const scale = scaleByScaleType[this.state.values.scaleType]

    return (
      <Dialog
        fullWidth={true}
        fullScreen={this.props.fullScreen}
        scroll="paper"
        open={this.props.isOpen}
        onClose={this.handleSubmit}
        aria-labelledby="scale-modifier-dialog"
      >
        <DialogTitle id="scale-modifier-dialog">Scales</DialogTitle>

        <DialogContent id="scale-modifier-dialog-content">
          <Box maxWidth={600} width={1} mx="auto">
            <InputSelect
              textFieldProps={{
                label: 'Scale type',
                InputLabelProps: {
                  shrink: true,
                },
              }}
              value={
                this.state.values.scaleType
                  ? scaleTypeToScaleTypeOptionMap[this.state.values.scaleType]
                  : undefined
              }
              onChange={this.handleScaleTypeSelected}
              name="chordType"
              options={chordTypeOptionsGrouped}
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

            <Flex mt={[1, 3, 2]} flexDirection="column">
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
                    className={css({ minWidth: '40px' })}
                    size="small"
                    color="primary"
                    variant="extendedFab"
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
                  max={scale.notesCount}
                  getSortableContainer={() =>
                    document.getElementById('scale-modifier-dialog-content')
                  }
                />
              </Box>
            </Flex>

            <Box>
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
                    this.state.isPlaying
                      ? this.state.activeTickIndex
                      : undefined
                  }
                  ticks={this.generateStaffTicks(this.state.values)}
                  isPlaying={this.state.isPlaying}
                  showBreaks
                  containerProps={{ flex: '1' }}
                  maxLines={1}
                />
              </Flex>
            </Box>
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
  withMobileDialog<ScaleModifierModalProps>()(ScaleModifierModal),
)
