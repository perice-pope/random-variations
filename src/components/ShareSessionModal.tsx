import * as React from 'react'

import Button, { default as MuButton } from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import withMobileDialog, {
  InjectedProps,
} from '@material-ui/core/withMobileDialog'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import { Input, Typography } from '@material-ui/core'
import { Session } from '../types'
import { notificationsStore } from './ToastNotifications'
import { css } from 'emotion'

type ShareSessionModalProps = {
  session: Session
  isOpen: boolean
  onClose: () => any
}

class ShareSessionModal extends React.Component<
  ShareSessionModalProps & InjectedProps
> {
  render() {
    const link = this.props.session
      ? `${window.location.origin}/shared/${this.props.session.sharedKey}`
      : ''

    return (
      <Dialog
        fullWidth={true}
        open={this.props.isOpen}
        fullScreen={this.props.fullScreen}
        maxWidth="sm"
        onClose={this.props.onClose}
        aria-labelledby="share-dialog"
      >
        <DialogTitle id="share-dialog">
          <Typography variant="h4">Share your session</Typography>
        </DialogTitle>
        <DialogContent>
          <p>Here's a sharable link to your session:</p>
          <div className={css({ marginBottom: '1rem' })}>
            <Input fullWidth value={link} />
          </div>
          <CopyToClipboard
            text={link}
            onCopy={() =>
              notificationsStore.showNotification({
                level: 'success',
                autohide: 6000,
                message: 'Link copied!',
              })
            }
          >
            <Button variant="contained" color="primary">
              Copy to clipboard
            </Button>
          </CopyToClipboard>
        </DialogContent>
        <DialogActions>
          <MuButton onClick={this.props.onClose} color="secondary">
            Go back
          </MuButton>
        </DialogActions>
      </Dialog>
    )
  }
}

export default withMobileDialog<ShareSessionModalProps>({ breakpoint: 'xs' })(
  ShareSessionModal,
)
