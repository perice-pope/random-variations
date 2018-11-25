import * as React from 'react'
import styled from 'react-emotion'
import * as recompose from 'recompose'

// import ButtonBase from '@material-ui/core/ButtonBase'
import { BaseButton, Paper, PaperProps, BaseButtonProps } from './ui'
import { lighten, saturate } from 'polished'

type NoteCardProps = {
  active: boolean
} & BaseButtonProps

const enhance = recompose.compose(
  recompose.setDisplayName('NoteCard'),
  recompose.defaultProps({
    bg: 'white',
  }),
)

type NoteCardButtonProps = {
  active: boolean
} & BaseButtonProps

const NoteCardButton = styled(BaseButton)<NoteCardButtonProps>`
  transition: all 200ms;

  &:hover {
    transform: scale(1.1);
  }

  transform: ${({ active }) => (active ? 'scale(1.2)' : 'none')};

  background-color: ${({ active, bg }) =>
    active ? saturate(0.2, lighten(0.07, bg as string)) : bg};
`

const BoxWithTouchRipple: React.SFC<PaperProps & { children?: any }> = ({
  children,
  ...props
}) => (
  // @ts-ignore
  <NoteCardButton {...props} component={Paper}>
    {children}
  </NoteCardButton>
)

const NoteCard = styled(BoxWithTouchRipple)<NoteCardProps>`
  display: inline-flex;
  cursor: pointer;

  align-items: center;
  justify-content: center;

  max-height: 120px;
  padding: 3px 3px;
  border-radius: 5px;
  font-size: 18px;
  font-weight: bold;
  user-select: none;

  @media screen and (min-height: 600px) and (min-width: 300px) {
    font-size: 20px;
    border-radius: 8px;
    padding: 5px 5px;
  }

  @media screen and (min-height: 700px) and (min-width: 400px) {
    font-size: 26px;
    border-radius: 10px;
    padding: 5px 5px;
  }

  @media screen and (min-height: 800px) and (min-width: 700px) {
    font-size: 32px;
    border-radius: 13px;
    padding: 8px 10px;
  }

  @media screen and (min-height: 900px) and (min-width: 900px) {
    font-size: 38px;
    padding: 10px 20px;
  }
`

// @ts-ignore
export default enhance(NoteCard) as typeof NoteCard
