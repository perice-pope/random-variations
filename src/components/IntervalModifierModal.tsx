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

import { IntervalType, StaffTick, IntervalsModifier } from '../types'
import { ChangeEvent } from 'react'
import { Input, FormControlLabel, RadioGroup, Radio } from '@material-ui/core'
import { css } from 'react-emotion'
import {
  SemitonesToIntervalLongNameMap,
  SemitonesToIntervalShortNameMap,
} from '../musicUtils'
import { Flex } from './ui/Flex'
import { Box } from './ui'
import NotesStaff from './NotesStaff'
import { Omit } from '../utils'

export type SubmitValuesType = Omit<IntervalsModifier, 'enabled'>

type IntervalModifierModalProps = {
  isOpen: boolean
  onClose: () => any
  onSubmit: (args: SubmitValuesType) => any
  initialValues?: SubmitValuesType
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

  generateStaffTicks = () => {
    const { interval, type, direction } = this.state.values

    const baseNote = 'C4'
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

    return staffTicks
  }

  render() {
    if (!this.props.isOpen) {
      return null
    }

    const { direction, type, interval } = this.state.values

    return (
      <Dialog
        fullWidth={true}
        fullScreen={this.props.fullScreen}
        open={this.props.isOpen}
        onClose={this.handleSubmit}
        aria-labelledby="interval-modifier-dialog"
      >
        <DialogTitle id="interval-modifier-dialog">Intervals</DialogTitle>

        <DialogContent
          id="interval-modifier-dialog-content"
          className={css({
            maxWidth: '600px',
            margin: '0 auto',
            width: '100%',
            marginTop: '2rem',
          })}
        >
          <Flex flexDirection="row">
            <FormControl className={css({ flex: 1 })}>
              <InputLabel htmlFor="interval-type">Interval type</InputLabel>
              <NativeSelect
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
          </Flex>

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
                  label="Broken interval"
                />
                <FormControlLabel
                  value="stacked"
                  control={<Radio />}
                  label="Stacked interval"
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

          <Box>
            <NotesStaff
              id="chord-preview"
              ticks={this.generateStaffTicks()}
              isPlaying={false}
              showBreaks
              activeTickIndex={undefined}
              maxLines={1}
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

export default withMobileDialog<IntervalModifierModalProps>()(
  IntervalModifierModal,
)
