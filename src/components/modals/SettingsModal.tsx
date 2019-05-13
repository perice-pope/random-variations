import * as React from 'react'
import * as _ from 'lodash'
import { css } from 'react-emotion'

import { default as MuButton } from '@material-ui/core/Button'

import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import withMobileDialog from '@material-ui/core/withMobileDialog'

import { instrumentAudioFontConfigs, AudioFontId } from '../../audioFontsConfig'
import { ClefType, InstrumentTransposingType } from '../../types'
import {
  FormControl,
  InputLabel,
  NativeSelect,
  Input,
  Switch,
  FormControlLabel,
  Typography,
  FormHelperText,
} from '@material-ui/core'
import { Box } from '../ui'
import {
  instrumentTransposingOptions,
  instrumentTransposingOptionsByType,
  SemitonesToIntervalNameMap,
} from '../../musicUtils'

export type SettingsFormValues = {
  audioFontId: AudioFontId
  clefType: ClefType
  instrumentTransposing: InstrumentTransposingType
  showNoteNamesAboveStaff: boolean
  showNoteOctaves: boolean
}

type SubmitArgsType = {
  values: SettingsFormValues
}

type SettingsModalProps = {
  isOpen: boolean
  onClose: () => any
  onSubmit?: (args: SubmitArgsType) => any
  onAudioFontChanged?: (audioFontId: AudioFontId) => any
  defaultValues?: SettingsFormValues
}

type SettingsModalState = {
  values: SettingsFormValues
}

type AudioFontOption = {
  title: string
  value: AudioFontId
}

const AudioFontOptions: AudioFontOption[] = instrumentAudioFontConfigs.map(
  afc => ({
    title: afc.title,
    value: afc.id,
  }),
)

type ClefTypeOption = {
  title: string
  value: ClefType
}

const ClefTypeOptions: ClefTypeOption[] = ([
  'treble',
  'bass',
  'alto',
  'tenor',
  'soprano',
  'mezzo-soprano',
  'baritone-c',
  'baritone-f',
  'subbass',
  'french',
] as ClefType[]).map(clef => ({
  title: _.capitalize(clef),
  value: clef,
}))

// @ts-ignore
class SettingsModal extends React.Component<
  SettingsModalProps & { fullScreen: boolean },
  SettingsModalState
> {
  constructor(props) {
    super(props)

    this.state = {
      values: props.defaultValues || {},
    }
  }

  handleSubmit = () => {
    if (this.props.onSubmit) {
      this.props.onSubmit({ values: this.state.values })
    }
  }

  handleAudioFontSelected = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const audioFontId = event.target.value as AudioFontId
    this.setState({ values: { ...this.state.values, audioFontId } })
    if (this.props.onAudioFontChanged) {
      this.props.onAudioFontChanged(audioFontId)
    }
  }

  handleClefSelected = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const clefType = event.target.value as ClefType
    this.setState({ values: { ...this.state.values, clefType } })
  }

  handleInstrumentTransposingSelected = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const instrumentTransposing = event.target
      .value as InstrumentTransposingType
    this.setState({ values: { ...this.state.values, instrumentTransposing } })
  }

  handleChangeShownNoteNamesAboveStaff = event => {
    const value = event.target.checked
    this.setState({
      values: { ...this.state.values, showNoteNamesAboveStaff: value },
    })
  }

  handleChangeShownNoteOctaves = event => {
    const value = event.target.checked
    this.setState({
      values: { ...this.state.values, showNoteOctaves: value },
    })
  }

  render() {
    if (!this.props.isOpen) {
      return null
    }

    return (
      <Dialog
        fullWidth={true}
        fullScreen={this.props.fullScreen}
        maxWidth="sm"
        scroll="paper"
        open={this.props.isOpen}
        onClose={this.handleSubmit}
        aria-labelledby="settings-dialog"
      >
        <DialogContent>
          <Typography variant="h5">Settings</Typography>

          <Box mt={2} mb={3}>
            <FormControl fullWidth className={css({ marginBottom: '1rem' })}>
              <InputLabel htmlFor="instrument-sound">
                Instrument sound
              </InputLabel>
              <NativeSelect
                value={this.state.values.audioFontId}
                onChange={this.handleAudioFontSelected}
                name="audioFontId"
                input={<Input id="instrument-sound" />}
              >
                {AudioFontOptions.map(({ title, value }) => (
                  <option key={value} value={value}>
                    {title}
                  </option>
                ))}
              </NativeSelect>
            </FormControl>
          </Box>

          <Box mt={4}>
            <Box mt={2}>
              <FormControl fullWidth className={css({ marginBottom: '1rem' })}>
                <InputLabel htmlFor="instrument-transposing">
                  Instrument transposing
                </InputLabel>
                <NativeSelect
                  value={this.state.values.instrumentTransposing}
                  onChange={this.handleInstrumentTransposingSelected}
                  name="instrumentTransposing"
                  input={<Input id="instrument-transposing" />}
                >
                  {instrumentTransposingOptions.map(({ title, type }) => (
                    <option key={type} value={type}>
                      {title}
                    </option>
                  ))}
                </NativeSelect>
                {this.state.values.instrumentTransposing !== 'C' && (
                  <FormHelperText>
                    Staff notes will be transposed by a{' '}
                    {_.lowerCase(
                      SemitonesToIntervalNameMap[
                        instrumentTransposingOptionsByType[
                          this.state.values.instrumentTransposing
                        ].interval
                      ],
                    )}{' '}
                    from the concert pitch.
                  </FormHelperText>
                )}
              </FormControl>
            </Box>

            <Box mt={2}>
              <FormControl fullWidth className={css({ marginBottom: '1rem' })}>
                <InputLabel htmlFor="clef-type">Clef type</InputLabel>
                <NativeSelect
                  value={this.state.values.clefType}
                  onChange={this.handleClefSelected}
                  name="clefType"
                  input={<Input id="clef-type" />}
                >
                  {ClefTypeOptions.map(({ title, value }) => (
                    <option key={value} value={value}>
                      {title}
                    </option>
                  ))}
                </NativeSelect>
              </FormControl>
            </Box>

            <Box mt={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={this.state.values.showNoteNamesAboveStaff}
                    onChange={this.handleChangeShownNoteNamesAboveStaff}
                    value={this.state.values.showNoteNamesAboveStaff}
                    color="primary"
                  />
                }
                label="Show note / chord names above staff"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={this.state.values.showNoteOctaves}
                    onChange={this.handleChangeShownNoteOctaves}
                    value={this.state.values.showNoteOctaves}
                    color="primary"
                  />
                }
                label="Show octave numbers next to note names (e.g. C3)"
              />
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

export default withMobileDialog<SettingsModalProps>({ breakpoint: 'xs' })(
  SettingsModal,
)
