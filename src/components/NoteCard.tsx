import styled from 'react-emotion'
import { lighten } from 'polished'
import * as recompose from 'recompose'

import { Box } from './ui'

type NoteCardProps = {
  playing: boolean
}

export default recompose.setDisplayName('NoteCard')(styled(Box)<NoteCardProps>`
  display: inline-flex;
  background-color: ${({ playing }) =>
    playing ? lighten(0.2, 'salmon') : 'salmon'};
  transform: ${({ playing }) => (playing ? 'scale(1.2)' : 'none')};
  padding: 10px;
  font-size: 50px;
  min-height: 100px;
  align-items: center;
  justify-content: center;

  transition: all 300ms;
`)
