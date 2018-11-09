import * as React from 'react'
import * as _ from 'lodash'
import { css } from 'react-emotion'

import { default as MuButton } from '@material-ui/core/Button'

import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListSubheader from '@material-ui/core/ListSubheader'
import ListItemText from '@material-ui/core/ListItemText'

import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import withMobileDialog from '@material-ui/core/withMobileDialog'

import AudioFontConfig, { AudioFontId } from '../audioFontsConfig'

type FormValues = {
  audioFontId: AudioFontId
}

type SubmitArgsType = {
  values: FormValues
}

type SettingsModalProps = {
  isOpen: boolean
  onClose: () => any
  onSubmit?: (args: SubmitArgsType) => any
  onAudioFontChanged?: (audioFontId: AudioFontId) => any
  defaultValues?: FormValues
}

type SettingsModalState = {
  values: FormValues
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

  handleAudioFontSelected = (audioFontId: AudioFontId) => {
    this.setState({ values: { ...this.state.values, audioFontId } })
    if (this.props.onAudioFontChanged) {
      this.props.onAudioFontChanged(audioFontId)
    }
  }

  render() {
    return (
      <Dialog
        fullWidth={true}
        fullScreen={this.props.fullScreen}
        open={this.props.isOpen}
        onClose={this.handleSubmit}
        aria-labelledby="settings-dialog"
      >
        <DialogTitle id="settings-dialog">Settings</DialogTitle>

        <DialogContent>
          <List
            dense={true}
            className={css({
              maxHeight: '300px',
              overflow: 'auto',
            })}
          >
            <ListSubheader>Instrument sound</ListSubheader>
            {AudioFontOptions.map(({ title, value }) => (
              <ListItem
                selected={value === this.state.values.audioFontId}
                button
                // @ts-ignore
                onClick={() => this.handleAudioFontSelected(value)}
                key={value}
              >
                <ListItemText primary={title} />
              </ListItem>
            ))}
          </List>
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

export default withMobileDialog<SettingsModalProps>()(SettingsModal)
