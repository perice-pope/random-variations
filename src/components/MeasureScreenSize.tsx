import * as React from 'react'
import * as _ from 'lodash'

type ScreenResizeUpdate = {
  height: number
  width: number
}

type MeasureScreenSizeProps = {
  fireOnMount?: boolean
  debounceMs?: number
  onUpdate?: (args: ScreenResizeUpdate) => any
}

type MeasureScreenSizeState = {
  height: number
  width: number
}

/**
 * Component for reacting to screen resize events
 */
export default class MeasureScreenSize extends React.Component<
  MeasureScreenSizeProps,
  MeasureScreenSizeState
> {
  static defaultProps = {
    fireOnMount: true,
    debounceMs: 500,
  }

  private onWindowResize: () => any

  constructor(props: MeasureScreenSizeProps) {
    super(props)

    this.state = {
      height: -1,
      width: -1,
    }

    this.onWindowResize = _.debounce(
      () => this._onWindowResize(this.notifyListener),
      props.debounceMs,
      {
        leading: false,
        trailing: true,
      },
    )
  }

  private _onWindowResize = (cb?: () => any) => {
    this.setState({ height: window.innerHeight, width: window.innerWidth }, cb)
  }

  componentDidMount() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onWindowResize)
    }

    if (this.props.fireOnMount) {
      this._onWindowResize(this.notifyListener)
    }
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onWindowResize)
    }
  }

  private notifyListener = () => {
    if (this.props.onUpdate) {
      this.props.onUpdate({
        height: this.state.height,
        width: this.state.width,
      })
    }
  }

  render() {
    return this.props.children
  }
}
