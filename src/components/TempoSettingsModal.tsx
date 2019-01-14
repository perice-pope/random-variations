import * as React from 'react'
import * as _ from 'lodash'

import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import TimerIcon from '@material-ui/icons/Timer'
import MetronomeIcon from 'mdi-material-ui/Metronome'
import withMobileDialog, {
  InjectedProps,
} from '@material-ui/core/withMobileDialog'
import { observer } from 'mobx-react'
import { observable } from 'mobx'

import { Flex, Box } from './ui'

import { createDefaultSession, parseIntEnsureInBounds } from '../utils'
import { RhythmInfo } from '../types'
import { css } from 'emotion'
import ArrowsIcon from '@material-ui/icons/Cached'
import {
  withAudioEngine,
  WithAudioEngineInjectedProps,
} from './withAudioEngine'
import { Typography, Divider, InputAdornment, Tooltip, withWidth } from '@material-ui/core'
import { rhythmOptions } from '../musicUtils'
import Slider from '@material-ui/lab/Slider'
import RhythmPreview from './RhythmPreview';
import { WithWidth } from '@material-ui/core/withWidth';

type Props = {
  open: boolean
  initialValues: TempoSettingsFormValues
  onClose: () => any
  onSubmit: (values: TempoSettingsFormValues) => any
} & InjectedProps &
  WithAudioEngineInjectedProps

export interface TempoSettingsFormValues {
  bpm: number
  metronomeEnabled: boolean
  countInEnabled: boolean
  countInCounts: number
  rests: number
  offset: number
  rhythm: RhythmInfo
}

@observer
class TempoSettingsModal extends React.Component<Props & WithWidth> {
  values: TempoSettingsFormValues = observable(
    TempoSettingsModal.getDefaultValues(),
  )

  @observable
  isPlaying = false

  inputValues = observable({
    bpm: '',
    countInCounts: '',
    rests: '',
    offset: '',
    rhythmBeats: '',
    rhythmDivisions: '',
  })

  static getDefaultValues() {
    const values = _.pick(createDefaultSession(), [
      'bpm',
      'metronomeEnabled',
      'countInEnabled',
      'countInCounts',
      'rests',
      'offset',
      'rhythm',
    ]) as TempoSettingsFormValues
    return values
  }

  componentDidUpdate(prevProps: Props) {
    if (!prevProps.open && this.props.open) {
      Object.keys(this.props.initialValues).map(key => {
        this.values[key] = this.props.initialValues[key]
      })

      this.inputValues.bpm = this.props.initialValues.bpm.toString()
      this.inputValues.countInCounts = this.props.initialValues.countInCounts.toString()
      this.inputValues.rests = this.props.initialValues.rests.toString()
      this.inputValues.offset = this.props.initialValues.offset.toString()
      this.inputValues.rhythmBeats = this.props.initialValues.rhythm.beats.toString()
      this.inputValues.rhythmDivisions = this.props.initialValues.rhythm.divisions.toString()
    }
  }

  submit = () => {
    this.props.onSubmit(this.values)
  }

  private handleBpmChange = e => {
    this.inputValues.bpm = e.target.value
    if (e.target.value) {
      const value = parseIntEnsureInBounds(e.target.value, 0, 500)
      this.values.bpm = value
    }
  }

  private handleBpmSliderChange = (e, value) => {
    this.values.bpm = value
    this.inputValues.bpm = value.toString()
  }

  private handleRhythmSliderChange = (e, rhythmIndex) => {
    this.values.rhythm = rhythmOptions[rhythmIndex] || rhythmOptions[0]
    this.inputValues.rhythmBeats = this.values.rhythm.beats.toString()
    this.inputValues.rhythmDivisions = this.values.rhythm.divisions.toString()
  }

  private handleSelectRandomRhythm = () => {
    this.values.rhythm = _.sample(rhythmOptions) as RhythmInfo
    this.inputValues.rhythmBeats = this.values.rhythm.beats.toString()
    this.inputValues.rhythmDivisions = this.values.rhythm.divisions.toString()
  }

  private handleSelectDefaultRhythm = () => {
    this.values.rhythm = {beats: 1, divisions: 1}
    this.inputValues.rhythmBeats = this.values.rhythm.beats.toString()
    this.inputValues.rhythmDivisions = this.values.rhythm.divisions.toString()
  }

  private handleCountInCountsChange = e => {
    this.inputValues.countInCounts = e.target.value
    if (e.target.value) {
      const value = parseIntEnsureInBounds(e.target.value, 0, 16)
      this.values.countInCounts = value
    }
  }

  private handleCountInToggle = () => {
    this.values.countInEnabled = !Boolean(this.values.countInEnabled)
  }

  private handleMetronomeToggle = () => {
    this.values.metronomeEnabled = !Boolean(this.values.metronomeEnabled)
  }

  private handleRestsChange = e => {
    this.inputValues.rests = e.target.value
    if (e.target.value) {
      const value = parseIntEnsureInBounds(e.target.value, 0, 16)
      this.values.rests = value
    }
  }

  private handleOffsetChange = e => {
    this.inputValues.offset = e.target.value
    if (e.target.value) {
      const value = parseIntEnsureInBounds(e.target.value, 0, 16)
      this.values.offset = value
    }
  }

  private handleRhythmBeatsChange = e => {
    this.inputValues.rhythmBeats = e.target.value
    if (e.target.value) {
      const value = parseIntEnsureInBounds(e.target.value, 1, 16)
      this.values.rhythm.beats = value
    }
  }

  private handleRhythmDivisionsChange = e => {
    this.inputValues.rhythmDivisions = e.target.value
    if (e.target.value) {
      const value = parseIntEnsureInBounds(e.target.value, 1, 16)
      this.values.rhythm.divisions = value
    }
  }

  render() {
    if (!this.props.open) {
      return null
    }

    const { bpm, rhythm, countInEnabled, metronomeEnabled } = this.values

    const rhythmSliderValue =
      rhythmOptions.findIndex(
        ro => ro.beats === rhythm.beats && ro.divisions === rhythm.divisions,
      ) || 0

    const ToggleCountInButton = (
      <Button
        color={countInEnabled ? 'secondary' : 'default'}
        className={css(`margin: 0.5rem; margin-right: 0; white-space: nowrap;`)}
        onClick={this.handleCountInToggle}
      >
        <TimerIcon className={css(`margin-right: 0.5rem;`)} />
        {countInEnabled ? 'Count in on' : 'Count in off'}
      </Button>
    )
    const ToggleMetronomeButton = (
      <Button
        color={metronomeEnabled ? 'secondary' : 'default'}
        className={css(
          `margin: 0.5rem; margin-left: 1rem; white-space: nowrap;`,
        )}
        onClick={this.handleMetronomeToggle}
      >
        <MetronomeIcon className={css(`margin-right: 0.5rem;`)} />
        {metronomeEnabled ? 'Metronome on' : 'Metronome off'}
      </Button>
    )

    const CountInTextInput = (
      // @ts-ignore
      <TextField
        className={css({
          maxWidth: '100px',
        })}
        InputProps={{
          endAdornment: <InputAdornment position="end">Beats</InputAdornment>,
          className: css({ fontSize: '1.3rem' }),
        }}
        id="countInCounts"
        disabled={!countInEnabled}
        type="number"
        // @ts-ignore
        step="1"
        min="0"
        max="16"
        value={`${this.inputValues.countInCounts}`}
        onChange={this.handleCountInCountsChange}
      />
    )
    const RestsTextInput = (
      // @ts-ignore
      <TextField
        className={css({
          maxWidth: '200px',
        })}
        InputProps={{
          endAdornment: (
            <InputAdornment
              position="end"
              classes={{ root: css(`width: 200px;`) }}
            >
              Rest beats
            </InputAdornment>
          ),
          className: css({ fontSize: '1.3rem' }),
        }}
        id="rests"
        type="number"
        // @ts-ignore
        step="1"
        min="0"
        max="8"
        value={`${this.inputValues.rests}`}
        onChange={this.handleRestsChange}
      />
    )
    const OffsetTextInput = (
      // @ts-ignore
      <TextField
        className={css({
          maxWidth: '200px',
        })}
        InputProps={{
          endAdornment: (
            <InputAdornment
              position="end"
              classes={{ root: css(`width: 200px;`) }}
            >
              Offset beats
            </InputAdornment>
          ),
          className: css({ fontSize: '1.3rem' }),
        }}
        id="rests"
        type="number"
        // @ts-ignore
        step="1"
        min="0"
        max="8"
        value={`${this.inputValues.offset}`}
        onChange={this.handleOffsetChange}
      />
    )
    const TempoTextInput = (
      // @ts-ignore
      <TextField
        className={css({ maxWidth: '100px' })}
        InputProps={{
          endAdornment: <InputAdornment position="end">BPM</InputAdornment>,
          className: css({ fontSize: '1.3rem' }),
        }}
        id="bpm"
        type="number"
        // @ts-ignore
        step="1"
        min="0"
        max="400"
        value={`${this.inputValues.bpm}`}
        onChange={this.handleBpmChange}
      />
    )
    const TempoSliderInput = (
      <Box mb={2} width={1}>
        <Slider
          classes={{
            container: css(`padding: 1rem;`),
          }}
          value={bpm}
          min={1}
          max={400}
          step={1}
          onChange={this.handleBpmSliderChange}
        />
      </Box>
    )

    const RhythmSliderInput = (
      <Box mb={2} width={1}>
        <Slider
          classes={{
            container: css(`padding: 1rem;`),
          }}
          value={rhythmSliderValue}
          min={0}
          max={rhythmOptions.length - 1}
          step={1}
          onChange={this.handleRhythmSliderChange}
        />
      </Box>
    )

    const RhythmRandomizeButton = (
      <Tooltip title="Choose random beat division">
        <Button
          variant="outlined"
          color="primary"
          onClick={this.handleSelectRandomRhythm}
          className={css(`
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
          Randomize
        </Button>
      </Tooltip>
    )

    const RhythmResetButton = (
        <Button
          variant="outlined"
          color="default"
          onClick={this.handleSelectDefaultRhythm}
          className={css(`
                      margin-left: 0.5rem;
                      @media screen and (max-width: 500px) {
                        margin-top: 0.5rem;
                      }
                    `)}
        >
          Reset
        </Button>
    )

    const RhythmBeatsTextField = (
      // @ts-ignore
      <TextField
        className={css({
          maxWidth: '80px',
          marginRight: '15px',
        })}
        InputProps={{
          className: css({ fontSize: '1.3rem' }),
          endAdornment: <InputAdornment position="end">Beats</InputAdornment>,
        }}
        id="beats"
        type="number"
        // @ts-ignore
        step="1"
        min="1"
        max="16"
        value={`${this.inputValues.rhythmBeats}`}
        onChange={this.handleRhythmBeatsChange}
      />
    )

    const RhythmDivisionsTextField = (
      // @ts-ignore
      <TextField
        className={css({
          maxWidth: '90px',
        })}
        InputProps={{
          className: css({ fontSize: '1.3rem' }),
          endAdornment: (
            <InputAdornment position="end">Divisions</InputAdornment>
          ),
        }}
        id="divisions"
        type="number"
        // @ts-ignore
        step="1"
        min="1"
        max="16"
        value={`${this.inputValues.rhythmDivisions}`}
        onChange={this.handleRhythmDivisionsChange}
      />
    )

    return (
      <Dialog
        fullScreen={this.props.fullScreen}
        maxWidth="sm"
        fullWidth
        scroll="paper"
        open={this.props.open}
        onClose={this.props.onClose}
        aria-labelledby="session-tempo-dialog"
      >
        <DialogContent
          id="tempo-params-content"
          className={css(`overflow-x: hidden;`)}
        >
          <Box>
            <Box>
              <Typography variant="h5">Session tempo</Typography>
              <Flex alignItems="center">
                {TempoTextInput}
                <span className={css(`flex: 1;`)} />
                {ToggleMetronomeButton}
              </Flex>
              {TempoSliderInput}
            </Box>

            <Divider light />

            <Box mt={3} mb={3}>
              <Typography variant="h5">Count-in</Typography>
              <Typography variant="subtitle1">
                Number of metronome clicks to play before playing the notes
              </Typography>
              <Flex alignItems="center">
                {CountInTextInput}
                <span className={css(`flex: 1;`)} />
                {ToggleCountInButton}
              </Flex>
            </Box>

            <Divider light />

            <Box mt={3} mb={3}>
              <Typography variant="h5">Rests & offset</Typography>
              <Typography variant="subtitle1">
                Number of rest beats between note groups
              </Typography>
              {RestsTextInput}

              <Box mt={3}>
                <Typography variant="subtitle1">
                  Number of rest beats before playing the first note (after
                  count-in clicks).
                </Typography>
                {OffsetTextInput}
              </Box>
            </Box>

            <Divider light />

            <Box mt={3} mb={3}>
              <Typography variant="h5">Rhythm</Typography>
              <Typography variant="subtitle1">
                Tweak how metronome ticks and notes rhythm relate to each other.
              </Typography>
              <Flex alignItems="center">
                {RhythmBeatsTextField}
                {RhythmDivisionsTextField}
              </Flex>

              {RhythmSliderInput}
              {RhythmRandomizeButton}
              {RhythmResetButton}

              <div
                className={css(
                  `height: 260px; width: 100%; margin-top: 1rem; margin-bottom: 1rem; margin-left: -1rem; margin-right: -1rem;`
                )}
              >
                <RhythmPreview
                  id={`rhythm-preview`}
                  key={`${rhythm.beats}:${rhythm.divisions}`}
                  beats={rhythm.beats}
                  scale={this.props.width === 'xs' ? 0.6 : 0.9}
                  divisions={rhythm.divisions}
                />
              </div>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={this.props.onClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={this.submit} color="primary" autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
}

export default withAudioEngine(
  withMobileDialog({ breakpoint: 'xs' })(withWidth()(TempoSettingsModal)),
)
