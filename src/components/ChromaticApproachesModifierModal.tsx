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

import { ChromaticApproachesType } from '../types'

type SubmitArgsType = {
  type: ChromaticApproachesType
}

type ChromaticApproachesModifierModalProps = {
  isOpen: boolean
  onClose: () => any
  onSubmit: (args: SubmitArgsType) => any
  defaultType?: ChromaticApproachesType
}

type ChromaticApproachesModifierModalState = {
  type: ChromaticApproachesType
}

type ChromaticApproachesOption = {
  title: string
  value: ChromaticApproachesType
}

const ChromaticApproachesOptions: ChromaticApproachesOption[] = [
  { title: 'From above', value: 'above' },
  { title: 'From below', value: 'below' },
  { title: 'Random: from above or below', value: 'random' },
  { title: 'Up, down, then to base note', value: 'up down' },
  { title: 'Down, up, then to base note', value: 'down up' },
]

// @ts-ignore
class ChromaticApproachesModifierModal extends React.Component<
  ChromaticApproachesModifierModalProps & { fullScreen: boolean },
  ChromaticApproachesModifierModalState
> {
  constructor(props) {
    super(props)

    this.state = {
      type: props.defaultType,
    }
  }

  handleSubmit = () => {
    this.props.onSubmit({
      type: this.state.type,
    })
  }

  handleTypeSelected = (type: ChromaticApproachesType) => {
    this.setState({ type })
  }

  render() {
    return (
      <Dialog
        fullWidth={true}
        fullScreen={this.props.fullScreen}
        open={this.props.isOpen}
        onClose={this.handleSubmit}
        aria-labelledby="chromatic-approach-modifier-dialog"
      >
        <DialogTitle id="chromatic-approach-modifier-dialog">
          Enclosure
        </DialogTitle>

        <DialogContent>
          <List
            dense={true}
            className={css({
              maxHeight: '300px',
              overflow: 'auto',
            })}
          >
            <ListSubheader>Approach type</ListSubheader>
            {ChromaticApproachesOptions.map(({ title, value }) => (
              <ListItem
                selected={value === this.state.type}
                button
                // @ts-ignore
                onClick={() => this.handleTypeSelected(value)}
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

export default withMobileDialog<ChromaticApproachesModifierModalProps>()(
  ChromaticApproachesModifierModal,
)
