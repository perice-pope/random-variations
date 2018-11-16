import * as React from 'react'
import * as _ from 'lodash'
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
import { Input, FormHelperText } from '@material-ui/core'
import { css } from 'react-emotion'
import Tooltip from './ui/Tooltip'
import {
  scaleOptions,
  scaleByScaleType,
  generateScalePatternFromPreset,
  getSemitonesTransposer,
} from '../musicUtils'
import { Flex } from './ui/Flex'
import { Box } from './ui'
import NotesStaff from './NotesStaff'
import { Omit } from '../utils'

export type SubmitValuesType = Omit<ScaleModifier, 'enabled'>

type ScaleModifierModalProps = {
  isOpen: boolean
  onClose: () => any
  onSubmit: (args: SubmitValuesType) => any
  initialValues?: SubmitValuesType
}

type ScaleModifierModalState = {
  values: SubmitValuesType
}

type ScaleTypeOption = {
  title: string
  value: ScaleType
}

const scaleTypeOptions: ScaleTypeOption[] = _.sortBy(
  scaleOptions,
  'notesCount',
).map(({ type, mode, title }) => ({
  title: [_.capitalize(mode), _.capitalize(title)]
    .filter(_.identity)
    .join(' - '),
  value: type,
}))

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

type Props = ScaleModifierModalProps & { fullScreen: boolean }

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

  handleScaleTypeSelected = (e: ChangeEvent<HTMLSelectElement>) => {
    const scaleType = e.target.value as ScaleType
    const scale =
      scaleByScaleType[scaleType] ||
      (scaleByScaleType[DEFAULT_SCALE_NAME] as Scale)

    this.setState({
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
    })
  }

  handlePatternPresetSelected = (e: ChangeEvent<HTMLSelectElement>) => {
    const patternPreset = e.target.value as ScalePatternPreset

    this.setState({
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
    })
  }

  handlePatternChange = (pattern: ScalePattern) => {
    this.setState({
      values: {
        ...this.state.values,
        pattern: pattern,
        patternPreset: 'custom',
      },
    })
  }

  generateStaffTicks = () => {
    const { scaleType } = this.state.values
    const scale = scaleByScaleType[scaleType]
    const { semitones = [] } = scale
    const baseNote = 'C4'

    let staffTicks: StaffTick[]

    staffTicks = this.state.values.pattern.items.map((item, index) => {
      const semitonesCount =
        item && !item.muted ? semitones[item.note - 1] || 0 : 0
      const note = getSemitonesTransposer(semitonesCount)(baseNote)

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
  }

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

  render() {
    if (!this.props.isOpen) {
      return null
    }

    const scale = scaleByScaleType[this.state.values.scaleType]

    return (
      <Dialog
        fullWidth={true}
        fullScreen={this.props.fullScreen}
        open={this.props.isOpen}
        onClose={this.handleSubmit}
        aria-labelledby="scale-modifier-dialog"
      >
        <DialogTitle id="scale-modifier-dialog">Scales</DialogTitle>

        <DialogContent
          id="scale-modifier-dialog-content"
          className={css({
            maxWidth: '600px',
            margin: '0 auto',
            width: '100%',
            marginTop: '2rem',
          })}
        >
          <Flex flexDirection="row">
            <FormControl className={css({ flex: 1 })}>
              <InputLabel htmlFor="scale-type">Scale type</InputLabel>
              <NativeSelect
                value={this.state.values.scaleType}
                onChange={this.handleScaleTypeSelected}
                name="ScaleType"
                input={<Input id="scale-type" />}
              >
                {scaleTypeOptions.map(({ title, value }) => (
                  <option key={value} value={value}>
                    {title}
                  </option>
                ))}
              </NativeSelect>
              {scale.notes && (
                <FormHelperText>
                  {`Notes in key of C:  `}
                  <span
                    className={css({ fontSize: '0.8rem', fontWeight: 'bold' })}
                  >{`${scale.notes.split(' ').join(', ')}`}</span>
                </FormHelperText>
              )}
            </FormControl>
          </Flex>

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
                max={scale.notesCount}
                getSortableContainer={() =>
                  document.getElementById('scale-modifier-dialog-content')
                }
              />
            </Box>
          </Flex>

          <Box>
            <NotesStaff
              id="scale-preview"
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

export default withMobileDialog<ScaleModifierModalProps>()(ScaleModifierModal)
