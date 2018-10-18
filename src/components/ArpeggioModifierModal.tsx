import * as React from 'react'
import * as _ from 'lodash'
import { css } from 'react-emotion'

import { default as MuButton } from '@material-ui/core/Button'

import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListSubheader from '@material-ui/core/ListSubheader'
import ListItemText from '@material-ui/core/ListItemText'
import ListItemIcon from '@material-ui/core/ListItemIcon'

import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import withMobileDialog from '@material-ui/core/withMobileDialog'

import ArrowBottomRight from 'mdi-material-ui/ArrowBottomRight'
import ArrowTopRight from 'mdi-material-ui/ArrowTopRight'

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
  { title: 'M (Major triad)', value: 'M' },
  { title: 'm (Minor triad)', value: 'm' },
  { title: 'M7 (Major 7th)', value: 'maj7' },
  { title: 'm7 (Minor 7th)', value: 'm7' },
  { title: 'M69#11', value: 'M69#11' },
]

type DirectionOption = {
  title: string
  value: ArpeggioDirection
  icon: React.ReactElement<any>
}

const DirectionOptions: DirectionOption[] = [
  { title: 'Up', value: 'up', icon: <ArrowTopRight /> },
  { title: 'Down', value: 'down', icon: <ArrowBottomRight /> },
  {
    title: 'Up and down',
    value: 'up down',
    icon: (
      <>
        <ArrowTopRight />
        <ArrowBottomRight />
      </>
    ),
  },
  {
    title: 'Down and up',
    value: 'down up',
    icon: (
      <>
        <ArrowBottomRight />
        <ArrowTopRight />
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
    defaultType: 'm',
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
        <DialogTitle id="arpeggio-modifier-dialog">Chords</DialogTitle>

        <DialogContent>
          <List
            dense={true}
            className={css({
              maxHeight: '300px',
              overflow: 'auto',
            })}
          >
            <ListSubheader>Chord type</ListSubheader>
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
