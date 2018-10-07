import { BaseButton, BaseButtonProps } from './BaseButton'
import styled from 'styled-components'
import * as ss from './styleSystem'

export type HoverButtonProps = BaseButtonProps & {
  hoverColor?: string
  hoverBg?: string
  activeBg?: string
  transitionSpeed?: string
}

export const HoverButton = styled(BaseButton)<HoverButtonProps>`
  transition: all ${({ transitionSpeed }) => transitionSpeed}

  &:hover, 
  &:focus {
    ${ss.style({ cssProperty: 'color', prop: 'hoverColor', key: 'colors' })}
    ${ss.style({
      cssProperty: 'backgroundColor',
      prop: 'hoverBg',
      key: 'colors',
    })}
  }

  &:active {
    ${ss.style({
      cssProperty: 'backgroundColor',
      prop: 'activeBg',
      key: 'colors',
    })}
  }
`

HoverButton.defaultProps = {
  transitionSpeed: '200ms',
}
