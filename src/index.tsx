import * as React from 'react'
import * as ReactDOM from 'react-dom'

import Root from './components/Root'
import './index.css'

import registerServiceWorker from './registerServiceWorker'

const rootEl = document.getElementById('root') as HTMLElement
ReactDOM.render(<Root />, rootEl)
registerServiceWorker()

// @ts-ignore
if (module.hot) {
  console.log('ENABLING HMR')
  // @ts-ignore
  module.hot.accept('./components/Root', () => {
    console.log('DOING HMR...')
    const NextRoot = require('./components/Root').default
    ReactDOM.render(<NextRoot />, rootEl)
  })
}
