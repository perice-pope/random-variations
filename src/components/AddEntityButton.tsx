import * as React from 'react'

import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import AddIcon from '@material-ui/icons/Add'
import Button, { ButtonProps } from '@material-ui/core/Button'
import Tooltip from '@material-ui/core/Tooltip'
import { css } from 'emotion'

type AddEntityButtonProps = {
  onAddSingleNoteClick: () => any
  onAddArpeggioClick: () => any
  onAddScaleClick: () => any
  onAddChromaticApproachesClick: () => any
  buttonProps?: ButtonProps
  disableSingleNote?: boolean
  disableChords?: boolean
  disableScales?: boolean
  disableChromaticApproaches?: boolean
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

  private handleScaleClick = () => {
    this.closeMenu()
    if (this.props.onAddScaleClick) {
      this.props.onAddScaleClick()
    }
  }

  private handleChromaticApproachesClick = () => {
    this.closeMenu()
    if (this.props.onAddChromaticApproachesClick) {
      this.props.onAddChromaticApproachesClick()
    }
  }

  render() {
    const {
      disableChords,
      disableScales,
      disableSingleNote,
      disableChromaticApproaches,
    } = this.props

    const allOptionsAreDisabled =
      disableSingleNote &&
      disableChords &&
      disableChromaticApproaches &&
      disableScales
    const buttonProps = this.props.buttonProps || {}

    return (
      <>
        <Menu
          id="add-entity-menu"
          anchorEl={this.buttonRef.current}
          open={this.state.isMenuOpen}
          onClose={this.closeMenu}
        >
          {!disableSingleNote && (
            <MenuItem onClick={this.handleSingleNoteClick}>Note</MenuItem>
          )}
          {!disableChords && (
            <MenuItem onClick={this.handleArpeggioClick}>Chord</MenuItem>
          )}
          {!disableScales && (
            <MenuItem onClick={this.handleScaleClick}>Scale</MenuItem>
          )}
          {!disableChromaticApproaches && (
            <MenuItem onClick={this.handleChromaticApproachesClick}>
              Enclosure
            </MenuItem>
          )}
        </Menu>

        <Tooltip
          title="Add a note, sequence or a modifier"
          disableFocusListener={true}
        >
          <Button
            buttonRef={this.buttonRef}
            classes={{
              fab: css({
                width: '50px !important',
                height: '50px !important',
              }),
            }}
            variant="fab"
            color="secondary"
            aria-label="Add"
            aria-owns={this.state.isMenuOpen ? 'add-entity-menu' : undefined}
            onClick={this.openMenu}
            {...buttonProps}
            disabled={buttonProps.disabled || allOptionsAreDisabled}
          >
            <AddIcon />
          </Button>
        </Tooltip>
      </>
    )
  }
}
