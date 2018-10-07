import styled from 'react-emotion'
import * as recompose from 'recompose'

import { Box } from './ui'

export default recompose.setDisplayName('NoteCard')(styled(Box)`
  display: inline-flex;
  background-color: salmon;
  padding: 10px;
  font-size: 30px;
  min-height: 100px;
  align-items: center;
  justify-content: center;
`)
