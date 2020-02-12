import * as React from 'react'
import { hot } from 'react-hot-loader'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import App from './App'

class Root extends React.Component {
  render() {
    return (
      <div>
        <Router>
          <Switch>
            <Route exact path="/" component={App} />
            <Route path="/s/:sessionKey?" component={App} />
            <Route path="/shared/:sharedSessionKey" component={App} />
          </Switch>
        </Router>
      </div>
    )
  }
}

export default hot(module)(Root)
