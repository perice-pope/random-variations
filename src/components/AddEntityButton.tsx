import * as React from 'react'

import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import AddIcon from '@material-ui/icons/Add'
import Button, { ButtonProps } from '@material-ui/core/Button'
import { css } from 'emotion'
import Tooltip from './ui/Tooltip'
import { Hidden } from '@material-ui/core'
import ButtonWithMenu from './ButtonWithMenu'

type AddEntityButtonProps = {
  onAddSingleNoteClick: () => any
  onAddToneRowClick: () => any
  onAddIntervalsClick: () => any
  onAddArpeggioClick: () => any
  onAddScaleClick: () => any
  onAddChromaticApproachesClick: () => any
  buttonProps?: ButtonProps
  enableOnlyNote?: boolean
  disableSingleNote?: boolean
  showHelpTooltip?: boolean
  disableChords?: boolean
  disableToneRow?: boolean
  disableScales?: boolean
  disableIntervals?: boolean
  disableChromaticApproaches?: boolean
}

export default class AddEntityButton extends React.Component<
  AddEntityButtonProps
> {
  static defaultProps = {
    buttonProps: {},
  }

  render() {
    const {
      enableOnlyNote,
      disableIntervals,
      disableChords,
      disableScales,
      disableSingleNote,
      disableToneRow,
      disableChromaticApproaches,
      showHelpTooltip,
    } = this.props

    const allOptionsAreDisabled =
      disableSingleNote &&
      disableChords &&
      disableChromaticApproaches &&
      disableScales &&
      disableIntervals &&
      disableToneRow
    const buttonProps = this.props.buttonProps || {}

    return (
      <ButtonWithMenu
        renderButton={props => (
          <Tooltip
            key={showHelpTooltip === true ? 'on' : 'off'}
            open={showHelpTooltip || undefined}
            title={
              showHelpTooltip
                ? 'Start here!'
                : 'Add items to your practice session'
            }
            PopperProps={{ className: css({ zIndex: 100 }) }}
            classes={{
              tooltip: css({
                fontSize: '1rem',
                background: '#3f51b5',
                userSelect: 'none',
              }),
            }}
            placement="bottom"
            disableFocusListener
            disableHoverListener={showHelpTooltip || false}
            disableTouchListener={showHelpTooltip || false}
          >
            <Button
              variant="extendedFab"
              color="secondary"
              aria-label="Add"
              {...buttonProps}
              disabled={buttonProps.disabled || allOptionsAreDisabled}
              {...props}
            >
              <AddIcon />
              <Hidden smDown>Add items</Hidden>
            </Button>
          </Tooltip>
        )}
        renderMenu={props => (
          <Menu id="add-entity-menu" {...props}>
            {!disableSingleNote && (
              <MenuItem onClick={this.props.onAddSingleNoteClick}>
                Note
              </MenuItem>
            )}
            {!disableToneRow && (
              <MenuItem onClick={this.props.onAddToneRowClick}>
                Tone row
              </MenuItem>
            )}
            {!disableIntervals && (
              <MenuItem
                disabled={enableOnlyNote}
                onClick={this.props.onAddIntervalsClick}
              >
                Intervals
              </MenuItem>
            )}
            {!disableChords && (
              <MenuItem
                disabled={enableOnlyNote}
                onClick={this.props.onAddArpeggioClick}
              >
                Chord
              </MenuItem>
            )}
            {!disableScales && (
              <MenuItem
                disabled={enableOnlyNote}
                onClick={this.props.onAddScaleClick}
              >
                Scale
              </MenuItem>
            )}
            {!disableChromaticApproaches && (
              <MenuItem
                disabled={enableOnlyNote}
                onClick={this.props.onAddChromaticApproachesClick}
              >
                Enclosure
              </MenuItem>
            )}
          </Menu>
        )}
      />
    )
  }
}
