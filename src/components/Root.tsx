import * as React from 'react'
import { hot } from 'react-hot-loader'
import App from './App'

class Root extends React.Component {
  render() {
    return (
      <div>
        <App />
      </div>
    )
  }
}

export default hot(module)(Root)
