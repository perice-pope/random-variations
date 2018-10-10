import styled from 'react-emotion'
import * as recompose from 'recompose'

import { Box } from './ui'

type NoteCardProps = {
  playing: boolean
}

export default recompose.setDisplayName('NoteCard')(styled(Box)<NoteCardProps>`
  transition: all 300ms;

  display: inline-flex;
  border-radius: 15px;
  border: 2px solid #eee;
  background-color: ${({ playing }) => (playing ? '#4de779' : 'white')};
  transform: ${({ playing }) => (playing ? 'scale(1.2)' : 'none')};
  align-items: center;
  justify-content: center;

  padding: 15px 10px;
  font-size: 50px;

  @media screen and (max-height: 900px), screen and (max-width: 900px) {
    font-size: 40px;
    padding: 10px 10px;
  }

  @media screen and (max-height: 800px), screen and (max-width: 700px) {
    font-size: 30px;
    border-radius: 10px;
    padding: 5px 10px;
  }

  @media screen and (max-height: 700px), screen and (max-width: 500px) {
    font-size: 20px;
    border-radius: 5px;
    padding: 5px 5px;
  }

  @media screen and (max-height: 600px), screen and (max-width: 400px) {
    font-size: 18px;
    border-radius: 5px;
    padding: 5px 5px;
  }
`)
