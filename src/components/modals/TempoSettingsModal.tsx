import * as React from 'react'
import * as _ from 'lodash'
import * as tonal from 'tonal'

import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import TimerIcon from '@material-ui/icons/Timer'
import MetronomeIcon from 'mdi-material-ui/Metronome'
import PlayIcon from '@material-ui/icons/PlayArrow'
import ArrowBackIcon from '@material-ui/icons/ArrowBack'
import ArrowForwardIcon from '@material-ui/icons/ArrowForward'
import StopIcon from '@material-ui/icons/Stop'
import withMobileDialog, {
  InjectedProps,
} from '@material-ui/core/withMobileDialog'
import { observer } from 'mobx-react'
import { observable } from 'mobx'

import { Flex, Box } from '../ui'

import { createDefaultSession, parseIntEnsureInBounds } from '../../utils'
import { RhythmInfo, StaffTick } from '../../types'
import { css, cx } from 'emotion'
import ArrowsIcon from '@material-ui/icons/Cached'
import {
  withAudioEngine,
  WithAudioEngineInjectedProps,
} from '../withAudioEngine'
import {
  Typography,
  Divider,
  InputAdornment,
  Tooltip,
  withWidth,
  IconButton,
  Hidden,
} from '@material-ui/core'
import { rhythmOptions } from '../../musicUtils'
import Slider from '@material-ui/lab/Slider'
import RhythmPreview from '../RhythmPreview'
import { WithWidth } from '@material-ui/core/withWidth'
import AudioEngine, {
  ChannelAudioContent,
  SoundEvent,
} from '../../services/audioEngine'
import { channelId } from '../../utils/channels'

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

const audioEngine = new AudioEngine()

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
    audioEngine.stopLoop()
    this.props.onSubmit(this.values)
  }

  handleClose = () => {
    audioEngine.stopLoop()
    if (this.props.onClose) {
      this.props.onClose()
    }
  }

  private handleBpmChange = e => {
    this.inputValues.bpm = e.target.value
    if (e.target.value) {
      const value = parseIntEnsureInBounds(e.target.value, 0, 500)
      this.values.bpm = value
      this.restartPlayback()
    }
  }

  private handleBpmSliderChange = (e, value) => {
    this.values.bpm = value
    this.inputValues.bpm = value.toString()
    this.restartPlayback()
  }

  private handleCountInSliderChange = (e, value) => {
    this.values.countInCounts = value
    this.inputValues.countInCounts = value.toString()
    this.restartPlayback()
  }

  private handleRestsSliderChange = (e, value) => {
    this.values.rests = value
    this.inputValues.rests = value.toString()
    this.restartPlayback()
  }

  private handleOffsetSliderChange = (e, value) => {
    this.values.offset = value
    this.inputValues.offset = value.toString()
    this.restartPlayback()
  }

  private setRhythmWithIndex = rhythmIndex => {
    this.values.rhythm = rhythmOptions[rhythmIndex] || rhythmOptions[0]
    this.inputValues.rhythmBeats = this.values.rhythm.beats.toString()
    this.inputValues.rhythmDivisions = this.values.rhythm.divisions.toString()
    this.restartPlayback()
  }

  private handleRhythmSliderChange = (e, rhythmIndex) => {
    this.setRhythmWithIndex(rhythmIndex)
  }

  private handleSelectPreviousRhythm = () => {
    const rhythmIndex = rhythmOptions.findIndex(
      ro =>
        ro.beats === this.values.rhythm.beats &&
        ro.divisions === this.values.rhythm.divisions,
    )
    if (rhythmIndex < 1) {
      return
    }
    this.setRhythmWithIndex(rhythmIndex - 1)
  }

  private handleSelectNextRhythm = () => {
    const rhythmIndex = rhythmOptions.findIndex(
      ro =>
        ro.beats === this.values.rhythm.beats &&
        ro.divisions === this.values.rhythm.divisions,
    )
    if (rhythmIndex >= rhythmOptions.length - 1) {
      return
    }
    this.setRhythmWithIndex(rhythmIndex + 1)
  }

  private handleSelectRandomRhythm = () => {
    this.values.rhythm = _.sample(rhythmOptions) as RhythmInfo
    this.inputValues.rhythmBeats = this.values.rhythm.beats.toString()
    this.inputValues.rhythmDivisions = this.values.rhythm.divisions.toString()
    this.restartPlayback()
  }

  private handleSelectDefaultRhythm = () => {
    this.values.rhythm = { beats: 1, divisions: 1 }
    this.inputValues.rhythmBeats = this.values.rhythm.beats.toString()
    this.inputValues.rhythmDivisions = this.values.rhythm.divisions.toString()
    this.restartPlayback()
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
      this.restartPlayback()
    }
  }

  private handleOffsetChange = e => {
    this.inputValues.offset = e.target.value
    if (e.target.value) {
      const value = parseIntEnsureInBounds(e.target.value, 0, 16)
      this.values.offset = value
      this.restartPlayback()
    }
  }

  private handleRhythmBeatsChange = e => {
    this.inputValues.rhythmBeats = e.target.value
    if (e.target.value) {
      const value = parseIntEnsureInBounds(e.target.value, 1, 16)
      this.values.rhythm.beats = value
      this.restartPlayback()
    }
  }

  private handleRhythmDivisionsChange = e => {
    this.inputValues.rhythmDivisions = e.target.value
    if (e.target.value) {
      const value = parseIntEnsureInBounds(e.target.value, 1, 16)
      this.values.rhythm.divisions = value
      this.restartPlayback()
    }
  }

  private restartPlayback = () => {
    if (this.isPlaying) {
      audioEngine.stopLoop()
      setTimeout(() => {
        this.setPlaybackLoop()
        setTimeout(() => {
          audioEngine.playLoop()
        }, 10)
      }, 10)
    } else {
      this.setPlaybackLoop()
    }
  }

  private togglePlayback = () => {
    if (this.isPlaying) {
      audioEngine.stopLoop()
      this.isPlaying = false
    } else {
      this.setPlaybackLoop()
      audioEngine.playLoop()
      this.isPlaying = true
    }
  }

  private setPlaybackLoop = () => {
    const staffTicks: StaffTick[] = new Array(
      this.values.rhythm.beats * this.values.rhythm.divisions,
    )
      .fill(null)
      .map(
        (value, index) =>
          ({
            id: `${index}`,
            notes: [{ id: '1', midi: tonal.Note.midi('C4'), noteName: 'C4' }],
          } as StaffTick),
      )

    // audioEngine.setMetronomeEnabled(true)
    // audioEngine.setMetronomeAccentBeatCount(this.values.rhythm.beats)
    // audioEngine.setAudioFont('woodblock')
    // audioEngine.setLoop(ticks)
    // audioEngine.setCountIn(4)
    const audioFontId = 'metronome'
    const metronomeChannelAudioContent: ChannelAudioContent<{
      staffTickIndex: number
    }> = {
      loop: {
        startAt: 0,
        endAt: staffTicks.length - 1,
      },
      startAt: 0,
      events: staffTicks.map(
        (tick, staffTickIndex) =>
          ({
            sounds: tick.notes.map(note => ({
              midi: note.midi,
              audioFontId: 'metronome',
            })),
            data: { staffTickIndex },
          } as SoundEvent<{ staffTickIndex: number }>),
      ),
      playbackRate: 1,
    }
    audioEngine.setAudioContent({
      [channelId.METRONOME]: metronomeChannelAudioContent,
    })
    audioEngine.setBpm(this.values.bpm)
    // audioEngine.setNotesRhythm(this.values.rhythm)
  }

  render() {
    if (!this.props.open) {
      return null
    }

    const { bpm, rhythm, countInEnabled, metronomeEnabled } = this.values

    let rhythmSliderValue = rhythmOptions.findIndex(
      ro => ro.beats === rhythm.beats && ro.divisions === rhythm.divisions,
    )
    if (rhythmSliderValue < 0) {
      rhythmSliderValue = rhythmOptions.findIndex(
        ro => ro.beats / ro.divisions <= rhythm.beats / rhythm.divisions,
      )
    }
    if (rhythmSliderValue < 0) {
      rhythmSliderValue = 0
    }

    const ToggleCountInButton = (
      <Button
        color={countInEnabled ? 'secondary' : 'default'}
        className={css(`margin: 0.5rem; margin-right: 0; white-space: nowrap;`)}
        onClick={this.handleCountInToggle}
        variant="outlined"
      >
        <TimerIcon fontSize="small" className={css(`margin-right: 0.5rem;`)} />
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
        variant="outlined"
        size="small"
      >
        <MetronomeIcon
          fontSize="small"
          className={css(`margin-right: 0.5rem;`)}
        />
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
        className={css({ maxWidth: '110px' })}
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

    const CountInSliderInput = (
      <Box mb={2} width={1}>
        <Slider
          classes={{
            container: css(`padding: 1rem;`),
          }}
          disabled={!this.values.countInEnabled}
          value={this.values.countInCounts}
          min={0}
          max={16}
          step={1}
          onChange={this.handleCountInSliderChange}
        />
      </Box>
    )

    const RestsSliderInput = (
      <Box mb={2} width={1}>
        <Slider
          classes={{
            container: css(`padding: 1rem;`),
          }}
          value={this.values.rests}
          min={0}
          max={16}
          step={1}
          onChange={this.handleRestsSliderChange}
        />
      </Box>
    )

    const OffsetSliderInput = (
      <Box mb={2} width={1}>
        <Slider
          classes={{
            container: css(`padding: 1rem;`),
          }}
          value={this.values.offset}
          min={0}
          max={16}
          step={1}
          onChange={this.handleOffsetSliderChange}
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

    const RhythmPrevButton = (
      <Tooltip title="Previous rhythm">
        <IconButton
          color="default"
          disabled={rhythmSliderValue === 0}
          onClick={this.handleSelectPreviousRhythm}
          className={css(`
            border: 1px solid;
            padding: 5px;
          `)}
        >
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>
    )

    const RhythmNextButton = (
      <Tooltip title="Next rhythm">
        <IconButton
          color="default"
          disabled={rhythmSliderValue === rhythmOptions.length - 1}
          onClick={this.handleSelectNextRhythm}
          className={css(`
            margin-left: 0.5rem;
            border: 1px solid;
            padding: 5px;
          `)}
        >
          <ArrowForwardIcon />
        </IconButton>
      </Tooltip>
    )

    const RhythmRandomizeButton = (
      <Tooltip title="Choose random beat division">
        <Button
          variant="outlined"
          color="primary"
          onClick={this.handleSelectRandomRhythm}
          className={css(`
            margin-left: 0.5rem;
          `)}
        >
          <ArrowsIcon fontSize="small" />
          <Hidden smDown>
            <span className={css(`margin-right: 0.5rem;`)}>Random</span>
          </Hidden>
        </Button>
      </Tooltip>
    )

    const RhythmResetButton = (
      <Button
        variant="outlined"
        color="default"
        disabled={rhythm.beats === 1 && rhythm.divisions === 1}
        onClick={this.handleSelectDefaultRhythm}
        className={css(`
          margin-left: 0.5rem;
        `)}
      >
        1/1
      </Button>
    )

    const TogglePlaybackButton = (
      <IconButton
        color="secondary"
        onClick={this.togglePlayback}
        className={css(`
          margin-left: 0.5rem; 
          border: 1px solid;
          padding: 5px;
        `)}
      >
        {this.isPlaying ? (
          <StopIcon fontSize="large" />
        ) : (
          <PlayIcon fontSize="large" />
        )}
      </IconButton>
    )

    const RhythmBeatsTextField = (
      // @ts-ignore
      <TextField
        className={css({
          maxWidth: '50px',
          marginRight: '15px',
        })}
        label="Meter"
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
          maxWidth: '50px',
        })}
        label="Division"
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
        onClose={this.handleClose}
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
              <Typography variant="body2">
                Number of metronome clicks to play before playing the notes
              </Typography>
              <Flex alignItems="center">
                {CountInTextInput}
                <span className={css(`flex: 1;`)} />
                {ToggleCountInButton}
              </Flex>
              {CountInSliderInput}
            </Box>

            <Divider light />

            <Box mt={3} mb={3}>
              <Typography variant="h5">Rests & offset</Typography>
              <Typography variant="body2">
                Number of rest beats between note groups
              </Typography>
              {RestsTextInput}
              {RestsSliderInput}

              <Box mt={3}>
                <Typography variant="body2">
                  Number of rest beats before playing the first note (after
                  count-in clicks).
                </Typography>
                {OffsetTextInput}
                {OffsetSliderInput}
              </Box>
            </Box>

            <Divider light />

            <Box mt={3} mb={3}>
              <Typography variant="h5">Rhythm</Typography>
              <Typography variant="body2">
                Control note duration of each event
              </Typography>

              <Flex alignItems="center" mt={3}>
                {RhythmBeatsTextField}
                {RhythmDivisionsTextField}

                <div
                  className={css(
                    `margin-left: 5px; margin-top: 10px; margin-right: -20px;`,
                  )}
                >
                  {`= ${(rhythm.beats / rhythm.divisions).toFixed(2)} beats`}
                  <br />
                  <span
                    className={cx(
                      'text-soft',
                      css(`font-size: 0.8rem; margin-left: 15px;`),
                    )}
                  >
                    {`${Math.round(
                      bpm / (rhythm.beats / rhythm.divisions),
                    )} BPM`}
                  </span>
                </div>
              </Flex>

              {RhythmSliderInput}
              <div
                className={css(`margin-left: -0.5rem; white-space: nowrap;`)}
              >
                {RhythmPrevButton}
                {RhythmResetButton}
                {RhythmNextButton}

                {RhythmRandomizeButton}
                {TogglePlaybackButton}
              </div>

              <div
                className={css(
                  `height: 260px; margin-top: 1rem; margin-bottom: 1rem; margin-left: -1rem; margin-right: -1rem;`,
                )}
              >
                <RhythmPreview
                  id={`rhythm-preview`}
                  key={`${rhythm.beats}:${rhythm.divisions}`}
                  beats={rhythm.beats}
                  scale={this.props.width === 'xs' ? 0.55 : 0.7}
                  divisions={rhythm.divisions}
                />
              </div>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={this.handleClose} color="secondary">
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
