import * as React from 'react'
import * as ReactDOM from 'react-dom'

import App from './components/App'
import './index.css'

import registerServiceWorker from './registerServiceWorker'

const rootEl = document.getElementById('root') as HTMLElement
ReactDOM.render(<App />, rootEl)
registerServiceWorker()

// @ts-ignore
if (module.hot) {
  // @ts-ignore
  module.hot.accept('./components/App', () => {
    const NextApp = require('./components/App').default
    ReactDOM.render(<NextApp />, rootEl)
  })
}
