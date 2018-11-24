import * as React from 'react'
import { MenuProps } from '@material-ui/core/Menu'
import { ButtonProps } from '@material-ui/core/Button'

type Props = {
  renderMenu: (props: MenuProps) => React.ReactNode
  renderButton: (props: ButtonProps) => React.ReactNode
}

type Position = { left: number; top: number }

type State = {
  isMenuOpen: boolean
  menuPosition?: Position
}

export default class ButtonWithMenu extends React.Component<Props, State> {
  buttonRef = React.createRef<HTMLElement>()

  state: State = {
    isMenuOpen: false,
    menuPosition: undefined,
  }

  static defaultProps = {
    buttonProps: {},
  }

  private openMenu = event => {
    this.setState({
      isMenuOpen: true,
      menuPosition: { left: event.clientX, top: event.clientY },
    })
  }

  private closeMenu = () => {
    this.setState({ isMenuOpen: false })
  }
  render() {
    return (
      <>
        {this.props.renderMenu({
          open: this.state.isMenuOpen,
          onClick: this.closeMenu,
          onClose: this.closeMenu,
          anchorReference: 'anchorPosition',
          anchorPosition: this.state.menuPosition,
        })}
        {this.props.renderButton({
          buttonRef: this.buttonRef,
          onClick: this.openMenu,
        })}
      </>
    )
  }
}
