import { BaseButton, BaseButtonProps } from './BaseButton'
import styled from 'react-emotion'
import * as ss from './styleSystem'

export type HoverButtonProps = BaseButtonProps & {
  hoverColor?: string
  hoverBg?: string
}

export const HoverButton = styled(BaseButton)`
  transition: background-color 200ms;

  &:hover,
  &:focus {
    ${ss.style({
      cssProperty: 'color',
      prop: 'hoverColor',
      key: 'colors',
    })};
    ${ss.style({
      cssProperty: 'backgroundColor',
      prop: 'hoverBg',
      key: 'colors',
    })};
  }
`
