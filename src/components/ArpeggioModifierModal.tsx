import * as React from 'react'
import * as _ from 'lodash'
import { css } from 'react-emotion'

import { default as MuButton } from '@material-ui/core/Button'

import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import withMobileDialog from '@material-ui/core/withMobileDialog'

import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListSubheader from '@material-ui/core/ListSubheader'
import ListItemText from '@material-ui/core/ListItemText'

import DownIcon from '@material-ui/icons/ArrowDownward'
import UpIcon from '@material-ui/icons/ArrowUpward'

import { ArpeggioType, ArpeggioDirection } from 'src/types'

type SubmitArgsType = {
  type: ArpeggioType
  direction: ArpeggioDirection
}

type ArpeggioModifierModalProps = {
  isOpen: boolean
  onClose: () => any
  onSubmit: (args: SubmitArgsType) => any
  defaultType?: ArpeggioType
  defaultDirection?: ArpeggioDirection
}

type ArpeggioModifierModalState = {
  type: ArpeggioType
  direction: ArpeggioDirection
}

type ArpeggioOption = {
  title: string
  value: ArpeggioType
}

const ArpeggioOptions: ArpeggioOption[] = [
  { title: 'Major triad', value: 'major triad' },
  { title: 'Minor triad', value: 'minor triad' },
]

type DirectionOption = {
  title: string
  value: ArpeggioDirection
  icon: React.ReactElement<any>
}

const DirectionOptions: DirectionOption[] = [
  { title: 'Up', value: 'up', icon: <UpIcon /> },
  { title: 'Down', value: 'down', icon: <DownIcon /> },
  {
    title: 'Up and down',
    value: 'up down',
    icon: (
      <>
        <UpIcon />
        <DownIcon />
      </>
    ),
  },
  {
    title: 'Down and up',
    value: 'down up',
    icon: (
      <>
        <DownIcon />
        <UpIcon />
      </>
    ),
  },
]

// @ts-ignore
class ArpeggioModifierModal extends React.Component<
  ArpeggioModifierModalProps & { fullScreen: boolean },
  ArpeggioModifierModalState
> {
  static defaultProps: Partial<ArpeggioModifierModalProps> = {
    defaultType: 'major triad',
    defaultDirection: 'up',
  }

  constructor(props) {
    super(props)

    this.state = {
      type: props.defaultType,
      direction: props.defaultDirection,
    }
  }

  handleSubmit = () => {
    this.props.onSubmit({
      type: this.state.type,
      direction: this.state.direction,
    })
  }

  handleTypeSelected = (type: ArpeggioType) => {
    this.setState({ type })
  }

  handleDirectionSelected = (direction: ArpeggioDirection) => {
    this.setState({ direction })
  }

  render() {
    return (
      <Dialog
        fullWidth={true}
        fullScreen={this.props.fullScreen}
        open={this.props.isOpen}
        onClose={this.handleSubmit}
        aria-labelledby="arpeggio-modifier-dialog"
      >
        <DialogTitle id="arpeggio-modifier-dialog">Add arpeggios</DialogTitle>

        <DialogContent>
          <List
            dense={true}
            subheader={<ListSubheader>Chord type</ListSubheader>}
            className={css({
              maxHeight: '300px',
              overflow: 'auto',
            })}
          >
            {ArpeggioOptions.map(({ title, value }) => (
              <ListItem
                selected={value === this.state.type}
                button
                onClick={() => this.handleTypeSelected(value)}
                key={value}
              >
                <ListItemText primary={title} />
              </ListItem>
            ))}
          </List>

          <List
            dense={true}
            subheader={<ListSubheader>Direction</ListSubheader>}
            className={css({
              maxHeight: '300px',
              overflow: 'auto',
            })}
          >
            {DirectionOptions.map(({ title, value, icon }) => (
              <ListItem
                selected={value === this.state.direction}
                button
                onClick={() => this.handleDirectionSelected(value)}
                key={value}
              >
                <ListItemText primary={title} />
                <ListItemIcon>{icon}</ListItemIcon>
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

export default withMobileDialog<ArpeggioModifierModalProps>()(
  ArpeggioModifierModal,
)
