import * as React from 'react'
import * as _ from 'lodash'
import { transpose } from 'tonal-distance'
import * as tonal from 'tonal'
import memoize from 'memoize-one'

import Button, { default as MuButton } from '@material-ui/core/Button'

import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import withMobileDialog from '@material-ui/core/withMobileDialog'
import ArrowsIcon from '@material-ui/icons/Cached'

import FormControl from '@material-ui/core/FormControl'
import NativeSelect from '@material-ui/core/NativeSelect'

import { IntervalType, StaffTick, IntervalsModifier } from '../types'
import { ChangeEvent } from 'react'
import {
  Input,
  FormControlLabel,
  RadioGroup,
  Radio,
  Typography,
  Divider,
} from '@material-ui/core'
import { css } from 'react-emotion'
import {
  SemitonesToIntervalLongNameMap,
  SemitonesToIntervalShortNameMap,
  getConcertPitchMidi,
} from '../musicUtils'
import { Flex } from './ui/Flex'
import { Box } from './ui'
import NotesStaff from './NotesStaff'
import { Omit } from '../utils'
import settingsStore from '../services/settingsStore'
import Tooltip from './ui/Tooltip'
import sessionStore from '../services/sessionStore'

export type SubmitValuesType = Omit<IntervalsModifier, 'enabled'>

type IntervalModifierModalProps = {
  isOpen: boolean
  onClose: () => any
  onSubmit: (args: SubmitValuesType) => any
  initialValues?: SubmitValuesType
  baseNote?: string
}

type IntervalModifierModalState = {
  values: SubmitValuesType
}

type IntervalTypeOption = {
  title: string
  value: IntervalType
}

const intervalOptions: IntervalTypeOption[] = Object.keys(
  SemitonesToIntervalLongNameMap,
).map((interval: IntervalType) => ({
  value: interval,
  title: `${SemitonesToIntervalLongNameMap[interval]} (${
    SemitonesToIntervalShortNameMap[interval]
  })`,
}))

// @ts-ignore
class IntervalModifierModal extends React.Component<
  IntervalModifierModalProps & { fullScreen: boolean },
  IntervalModifierModalState
> {
  static defaultProps: Partial<IntervalModifierModalProps> = {
    baseNote: 'C4',
    initialValues: {
      type: 'broken',
      direction: 'ascending',
      interval: '5P',
    },
  }

  constructor(props) {
    super(props)

    this.state = {
      values: _.merge(
        IntervalModifierModal.defaultProps.initialValues,
        props.initialValues,
      ),
    }
  }

  handleSubmit = () => {
    this.props.onSubmit(this.state.values)
  }

  handleBrokenStackedChange = (event: ChangeEvent<HTMLInputElement>) => {
    // @ts-ignore
    this.setState({
      values: {
        ...this.state.values,
        type: event.target.value,
      },
    })
  }

  handleDirectionChange = (event: ChangeEvent<HTMLInputElement>) => {
    // @ts-ignore
    this.setState({
      values: {
        ...this.state.values,
        direction: event.target.value,
      },
    })
  }

  handleIntervalTypeSelected = (e: ChangeEvent<HTMLSelectElement>) => {
    const interval = e.target.value as IntervalType

    this.setState({
      values: {
        ...this.state.values,
        interval,
      },
    })
  }

  handleSelectRandomIntervalType = () => {
    const interval = _.sample(intervalOptions)!.value as IntervalType
    this.setState({
      values: {
        ...this.state.values,
        interval,
      },
    })
  }

  generateStaffTicks = memoize((values, baseNote) => {
    const { interval, type, direction } = values

    const intervalNote = transpose(
      baseNote,
      `${direction === 'ascending' ? '' : '-'}${interval}`,
    )

    if (!intervalNote) {
      return []
    }

    let staffTicks: StaffTick[]
    if (type === 'stacked') {
      staffTicks = [
        {
          id: `1`,
          notes: [
            {
              color: 'red',
              id: '1',
              isMainNote: true,
              midi: tonal.Note.midi(baseNote),
              noteName: baseNote,
            },
            {
              color: 'black',
              id: '2',
              isMainNote: false,
              midi: tonal.Note.midi(intervalNote),
              noteName: intervalNote,
            },
          ],
        } as StaffTick,
      ]
    } else {
      staffTicks = [
        {
          id: `1`,
          notes: [
            {
              color: 'red',
              id: '1',
              isMainNote: true,
              midi: tonal.Note.midi(baseNote),
              noteName: baseNote,
            },
          ],
        } as StaffTick,
        {
          id: `2`,
          notes: [
            {
              color: 'black',
              id: '2',
              isMainNote: false,
              midi: tonal.Note.midi(intervalNote),
              noteName: intervalNote,
            },
          ],
        } as StaffTick,
      ]
    }

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

  render() {
    if (!this.props.isOpen) {
      return null
    }

    const { direction, type, interval } = this.state.values

    return (
      <Dialog
        fullWidth={true}
        fullScreen={this.props.fullScreen}
        maxWidth="sm"
        scroll="paper"
        open={this.props.isOpen}
        onClose={this.handleSubmit}
        aria-labelledby="interval-modifier-dialog"
      >
        <DialogContent id="interval-modifier-dialog-content">
          <Box>
            <Typography variant="h5">Interval type</Typography>
            <Box mt={2} mb={2}>
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
                  <FormControl className={css({ flex: 1 })} fullWidth>
                    <NativeSelect
                      fullWidth
                      value={interval}
                      onChange={this.handleIntervalTypeSelected}
                      name="interval"
                      input={<Input id="interval-type" />}
                    >
                      {intervalOptions.map(({ title, value }) => (
                        <option key={value} value={value}>
                          {title}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormControl>
                </div>

                <Tooltip title="Choose random interval">
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={this.handleSelectRandomIntervalType}
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

              <Flex>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    aria-label="Broken or stacked?"
                    name="broken-stacked"
                    value={type}
                    onChange={this.handleBrokenStackedChange}
                  >
                    <FormControlLabel
                      value="broken"
                      control={<Radio />}
                      label="Broken"
                    />
                    <FormControlLabel
                      value="stacked"
                      control={<Radio />}
                      label="Stacked"
                    />
                  </RadioGroup>
                </FormControl>
              </Flex>

              <Flex>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    aria-label="Direction"
                    name="direction"
                    value={direction}
                    onChange={this.handleDirectionChange}
                  >
                    <FormControlLabel
                      value="ascending"
                      control={<Radio />}
                      label="Ascending"
                    />
                    <FormControlLabel
                      value="descending"
                      control={<Radio />}
                      label="Descending"
                    />
                  </RadioGroup>
                </FormControl>
              </Flex>
            </Box>

            <Divider light />

            <Box mt={2}>
              <Box>
                <NotesStaff
                  id="interval-preview"
                  clef={settingsStore.clefType}
                  ticks={this.generateStaffTicks(
                    this.state.values,
                    this.props.baseNote,
                  )}
                  isPlaying={false}
                  showBreaks
                  activeTickIndex={undefined}
                  maxLines={1}
                />
              </Box>
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

export default withMobileDialog<IntervalModifierModalProps>({
  breakpoint: 'xs',
})(IntervalModifierModal)
