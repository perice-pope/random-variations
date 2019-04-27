import * as React from 'react'

import {
  EmailShareButton,
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  EmailIcon,
} from 'react-share'
import Button, { default as MuButton } from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import withMobileDialog, {
  InjectedProps,
} from '@material-ui/core/withMobileDialog'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import { Input, Typography, Divider } from '@material-ui/core'
import { Session } from '../../types'
import { notificationsStore } from '../ToastNotifications'
import { css } from 'emotion'
import { Box } from '../ui'

type ShareSessionModalProps = {
  session: Session
  isOpen: boolean
  onClose: () => any
}

class ShareSessionModal extends React.Component<
  ShareSessionModalProps & InjectedProps
> {
  render() {
    if (!this.props.isOpen || !this.props.session) {
      return null
    }

    const link = this.props.session
      ? `${window.location.origin}/shared/${this.props.session.sharedKey}`
      : ''

    const { name: sessionName } = this.props.session

    const title = `View my Random Variations practice session: ${sessionName}`
    const body = `Hi, here's a Random Variations practice session. Click the link below to open it.`

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
          <Box mb={3}>
            <MuButton
              component={props => (
                <FacebookShareButton
                  url={link}
                  quote={title}
                  hashtag="#randomvariations"
                  {...props}
                />
              )}
            >
              <FacebookIcon round size={30} />
            </MuButton>

            <MuButton
              component={props => (
                <WhatsappShareButton
                  url={link}
                  quote={title}
                  hashtag="#randomvariations"
                  {...props}
                />
              )}
            >
              <WhatsappIcon round size={30} />
            </MuButton>

            <MuButton
              component={props => (
                <TwitterShareButton
                  url={link}
                  quote={title}
                  hashtags={['randomvariations']}
                  {...props}
                />
              )}
            >
              <TwitterIcon round size={30} />
            </MuButton>

            <MuButton
              variant="flat"
              component={props => (
                <EmailShareButton
                  url={link}
                  subject={title}
                  body={body}
                  {...props}
                />
              )}
            >
              <EmailIcon round size={30} />
              <span className={css(`margin-left: 0.5rem;`)}>By email</span>
            </MuButton>
          </Box>

          <Divider light />

          <div>
            <p>Also here's a sharable link to your session:</p>
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
          </div>
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
