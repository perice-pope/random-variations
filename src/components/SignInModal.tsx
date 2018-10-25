import * as React from 'react'
import * as _ from 'lodash'
import * as firebase from 'firebase'
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth'

import { default as MuButton } from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import withMobileDialog, {
  InjectedProps,
} from '@material-ui/core/withMobileDialog'

import { withFirebase } from 'src/services/firebase'
import { Typography } from '@material-ui/core'

type SignInModalProps = {
  firebase: any
  isOpen: boolean
  onClose: () => any
}

const uiConfig = {
  signInFlow: 'popup',
  signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
  callbacks: {
    // Avoid redirects after sign-in.
    signInSuccessWithAuthResult: () => false,
  },
}

class SignInModal extends React.Component<SignInModalProps & InjectedProps> {
  render() {
    return (
      <Dialog
        open={this.props.isOpen}
        fullScreen={this.props.fullScreen}
        onClose={this.props.onClose}
        aria-labelledby="sign-in-dialog"
      >
        <DialogTitle id="sign-in-dialog">Sign in</DialogTitle>
        <DialogContent>
          <Typography>
            Please sign in or create a free account to be able to:
            <ul>
              <li>save your sessions</li>
              <li>share sessions with others</li>
              <li>export sessions as MIDI</li>
              <li>...and more!</li>
            </ul>
          </Typography>
          <StyledFirebaseAuth
            uiConfig={uiConfig}
            firebaseAuth={this.props.firebase.auth()}
          />
        </DialogContent>
        <DialogActions>
          <MuButton onClick={this.props.onClose} color="secondary">
            Cancel
          </MuButton>
        </DialogActions>
      </Dialog>
    )
  }
}

export default withFirebase(withMobileDialog<SignInModalProps>()(SignInModal))
