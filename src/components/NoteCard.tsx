import * as React from 'react'
import styled from 'react-emotion'
import * as recompose from 'recompose'
import { lighten } from 'polished'

import ButtonBase from '@material-ui/core/ButtonBase'
import { Paper, PaperProps } from './ui'

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

const BoxWithTouchRipple: React.SFC<PaperProps & { children?: any }> = ({
  children,
  ...props
}) => (
  // @ts-ignore
  <ButtonBase {...props} component={Paper}>
    {children}
  </ButtonBase>
)

const NoteCard = styled(BoxWithTouchRipple, {
  shouldForwardProp: prop => prop !== 'active' && prop !== 'bgColor',
})<NoteCardProps>`
  transition: all 300ms;

  display: inline-flex;
  cursor: pointer;

  &:hover {
    transform: scale(1.1);
  }

  background-color: ${({ bgColor, active }) =>
    active ? lighten(0.13, bgColor) : bgColor};
  transform: ${({ active }) => (active ? 'scale(1.2)' : 'none')};
  align-items: center;
  justify-content: center;

  max-height: 160px;
  padding: 3px 3px;
  border-radius: 15px;
  font-size: 18px;
  font-weight: bold;
  user-select: none;

  @media screen and (min-height: 600px) and (min-width: 300px) {
    font-size: 20px;
    border-radius: 15px;
    padding: 5px 5px;
  }

  @media screen and (min-height: 700px) and (min-width: 400px) {
    font-size: 30px;
    border-radius: 15px;
    padding: 5px 5px;
  }

  @media screen and (min-height: 800px) and (min-width: 700px) {
    font-size: 40px;
    border-radius: 15px;
    padding: 5px 10px;
  }

  @media screen and (min-height: 900px) and (min-width: 900px) {
    font-size: 50px;
    padding: 15px 20px;
  }
`

export default enhance(NoteCard) as typeof NoteCard
