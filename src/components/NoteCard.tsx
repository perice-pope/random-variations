import styled from 'react-emotion'
import * as recompose from 'recompose'
import { lighten } from 'polished'

import { BaseButton } from './ui'

type NoteCardProps = {
  bgColor: string
  active: boolean
}

const enhance = recompose.compose(
  recompose.setDisplayName('NoteCard'),
  recompose.defaultProps({
    bgColor: 'white',
  }),
)

const NoteCard = styled(BaseButton)<NoteCardProps>`
  transition: all 300ms;

  display: inline-flex;
  border-radius: 15px;
  border: 2px solid #eee;
  background-color: ${({ bgColor, active }) =>
    active ? lighten(0.13, bgColor) : bgColor};
  transform: ${({ active }) => (active ? 'scale(1.2)' : 'none')};
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
`

export default enhance(NoteCard) as typeof NoteCard
