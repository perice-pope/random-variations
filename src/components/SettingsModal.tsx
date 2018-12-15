import * as React from 'react'
import * as _ from 'lodash'
import { css } from 'react-emotion'

import { default as MuButton } from '@material-ui/core/Button'

import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import withMobileDialog from '@material-ui/core/withMobileDialog'

import AudioFontConfig, { AudioFontId } from '../audioFontsConfig'
import { ClefType } from '../types'
import {
  FormControl,
  InputLabel,
  NativeSelect,
  Input,
  Switch,
  FormControlLabel,
  Divider,
  Typography,
} from '@material-ui/core'
import { Box } from './ui'

export type SettingsFormValues = {
  audioFontId: AudioFontId
  clefType: ClefType
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

const AudioFontOptions: AudioFontOption[] = AudioFontConfig.filter(
  ({ id }) => id !== 'metronome',
).map(afc => ({
  title: afc.title,
  value: afc.id,
}))

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
        <DialogTitle id="settings-dialog">
          <Typography variant="h4">Settings</Typography>
        </DialogTitle>

        <DialogContent>
          <Box mb={3}>
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

          <Divider light />

          <Box mb={3} mt={3}>
            <Typography variant="h5">Instrument sound</Typography>

            <Box mt={2}>
              <FormControl className={css({ marginBottom: '1rem' })}>
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
          </Box>

          <Divider light />

          <Box mt={3}>
            <Typography variant="h5">Notes staff</Typography>

            <Box mt={2}>
              <FormControl className={css({ marginBottom: '1rem' })}>
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

            <FormControlLabel
              control={
                <Switch
                  checked={this.state.values.showNoteNamesAboveStaff}
                  onChange={this.handleChangeShownNoteNamesAboveStaff}
                  value={this.state.values.showNoteNamesAboveStaff}
                  color="primary"
                />
              }
              label="Show note names above staff"
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

export default withMobileDialog<SettingsModalProps>({ breakpoint: 'xs' })(
  SettingsModal,
)
