import * as React from 'react'

import { observable } from 'mobx'
import uuid from 'uuid/v4'
import Snackbar, { SnackbarProps } from '@material-ui/core/Snackbar'
import { observer } from 'mobx-react'
import { IconButton } from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'
import { css } from 'emotion'

interface Notification {
  id: string
  autohide?: number
  message?: string
  snackbarProps?: SnackbarProps
  isOpen: boolean
  onClose: () => any
  onExited: () => any
  level: 'success' | 'info' | 'warning' | 'error'
}

class NotifcationsStore {
  @observable
  public notifications: Notification[] = []

  private removeNotificationById = id => {
    this.notifications = this.notifications.filter(n => n.id !== id)
  }

  public closeNotificationById = id => {
    this.notifications = this.notifications.map(
      n => (n.id !== id ? n : { ...n, isOpen: false }),
    )
  }

  public showNotification(notification: Partial<Notification> = {}) {
    const id = notification.id ? notification.id : uuid()

    this.notifications.push({
      id,
      isOpen: true,
      level: notification.level ? notification.level : 'info',
      message: notification.message ? notification.message : '',
      ...(notification || {}),
      onClose: () => this.closeNotificationById(id),
      onExited: () => this.removeNotificationById(id),
    })
  }
}

const levelToClassNameMap = {
  info: css(`background-color: #7C4DFF`),
  success: css(`background-color: #4BCB7C`),
  error: css(`background-color: #EF5350`),
  warning: css(`background-color: #EF6C00`),
}

export const notificationsStore = new NotifcationsStore()

@observer
export default class ToastNotifications extends React.Component {
  render() {
    const notifications = notificationsStore.notifications

    return (
      <>
        {notifications.map(notification => (
          <Snackbar
            key={notification.id}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            autoHideDuration={notification.autohide}
            open={notification.isOpen}
            onClose={notification.onClose}
            onExited={notification.onExited}
            ContentProps={{
              className: levelToClassNameMap[notification.level],
              'aria-describedby': `message-${notification.id}`,
            }}
            message={
              <span id={`message-${notification.id}`}>
                {notification.message}
              </span>
            }
            action={[
              <IconButton
                key="close"
                aria-label="Close"
                color="inherit"
                onClick={notification.onClose}
              >
                <CloseIcon />
              </IconButton>,
            ]}
            {...notification.snackbarProps}
          />
        ))}
      </>
    )
  }
}
