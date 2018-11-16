import * as React from 'react'
import * as ReactDOM from 'react-dom'

import Root from './components/Root'
import './index.css'

import { unregister } from './registerServiceWorker'

const rootEl = document.getElementById('root') as HTMLElement

const render = Component => {
  ReactDOM.render(<Component />, rootEl)
}

render(Root)
unregister()
