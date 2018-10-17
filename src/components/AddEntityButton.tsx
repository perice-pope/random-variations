import * as React from 'react'

import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import AddIcon from '@material-ui/icons/Add'
import Button, { ButtonProps } from '@material-ui/core/Button'
import Tooltip from '@material-ui/core/Tooltip'

type AddEntityButtonProps = {
  onAddSingleNoteClick: () => any
  onAddArpeggioClick: () => any
  buttonProps?: ButtonProps
}

type AddEntityButtonState = {
  isMenuOpen: boolean
}

export default class AddEntityButton extends React.Component<
  AddEntityButtonProps,
  AddEntityButtonState
> {
  buttonRef = React.createRef<HTMLElement>()

  state = {
    isMenuOpen: false,
  }

  static defaultProps = {
    buttonProps: {},
  }

  private openMenu = () => {
    this.setState({ isMenuOpen: true })
  }

  private closeMenu = () => {
    this.setState({ isMenuOpen: false })
  }

  private handleSingleNoteClick = () => {
    this.closeMenu()
    if (this.props.onAddSingleNoteClick) {
      this.props.onAddSingleNoteClick()
    }
  }

  private handleArpeggioClick = () => {
    this.closeMenu()
    if (this.props.onAddSingleNoteClick) {
      this.props.onAddArpeggioClick()
    }
  }

  render() {
    return (
      <>
        <Menu
          id="add-entity-menu"
          anchorEl={this.buttonRef.current}
          open={this.state.isMenuOpen}
          onClose={this.closeMenu}
        >
          <MenuItem onClick={this.handleSingleNoteClick}>Single note</MenuItem>
          <MenuItem onClick={this.handleArpeggioClick}>Arpeggio</MenuItem>
        </Menu>

        <Tooltip
          title="Add a note, sequence or a modifier"
          disableFocusListener={true}
        >
          <Button
            buttonRef={this.buttonRef}
            variant="fab"
            color="primary"
            aria-label="Add"
            aria-owns={this.state.isMenuOpen ? 'add-entity-menu' : undefined}
            onClick={this.openMenu}
            {...this.props.buttonProps}
          >
            <AddIcon />
          </Button>
        </Tooltip>
      </>
    )
  }
}
