import * as React from 'react'

type Props = {
  renderMenu: (
    args: {
      open: boolean
      onClose: () => any
      onClick: () => any
      anchorEl: HTMLElement | null
    },
  ) => React.ReactNode
  renderButton: (
    args: { onClick: () => any; buttonRef: React.RefObject<HTMLElement> },
  ) => React.ReactNode
}

type State = {
  isMenuOpen: boolean
}

export default class ButtonWithMenu extends React.Component<Props, State> {
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
  render() {
    return (
      <>
        {this.props.renderMenu({
          open: this.state.isMenuOpen,
          onClick: this.closeMenu,
          onClose: this.closeMenu,
          anchorEl: this.buttonRef.current,
        })}
        {this.props.renderButton({
          buttonRef: this.buttonRef,
          onClick: this.openMenu,
        })}
      </>
    )
  }
}
