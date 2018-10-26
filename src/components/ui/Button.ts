import * as recompose from 'recompose'
import styled from 'react-emotion'
import * as ss from './styleSystem'
import isPropValid from '@emotion/is-prop-valid'
import {
  default as MuiButton,
  ButtonProps as MuiButtonProps,
} from '@material-ui/core/Button'
import { BoxProps } from './Box'
import { getLuminance, lighten, darken } from 'polished'

export type ButtonProps = MuiButtonProps &
  BoxProps &
  ss.JustifyContentProps & {
    outline?: string
    variant?: string
    hoverColor?: string
    hoverBg?: string
    fontColor?: string
  }

const ButtonStyled = styled(MuiButton, {
  shouldForwardProp: prop => isPropValid(prop) || prop === 'variant',
})<ButtonProps>`
  ${ss.color}
  ${ss.width}
  ${ss.height}
  ${ss.space}
  ${ss.borders}
  ${ss.borderRadius}
  ${ss.fontWeight}
  ${ss.fontSize}
  ${ss.alignSelf}
  ${ss.width}
  ${ss.height}
  ${ss.flex}
  ${ss.position}
  ${ss.left}
  ${ss.top}
  ${ss.bottom}
  ${ss.right}
  ${ss.display}
  ${ss.alignItems}
  ${ss.justifyContent}

  cursor: pointer;
  user-select: none;

  ${ss.style({
    cssProperty: 'color',
    prop: 'fontColor',
    key: 'colors',
  })};

  transition: background-color 200ms;

  &:hover,
  &:focus {
    ${ss.style({
      cssProperty: 'color',
      prop: 'hoverColor',
      key: 'colors',
    })};
    ${ss.style({
      cssProperty: 'background-color',
      prop: 'hoverBg',
      key: 'colors',
    })};
  }
`

export const Button = recompose.compose(
  recompose.setDisplayName('Button'),
  recompose.defaultProps({
    variant: 'contained',
  }),
  recompose.mapProps((props: ButtonProps) => {
    const newProps: ButtonProps = {}

    if (props.bg && !props.hoverBg) {
      newProps.hoverBg =
        getLuminance(props.bg as string) < 0.3
          ? lighten(0.1, props.bg as string)
          : darken(0.1, props.bg as string)
    }

    if (!props.fontColor && props.bg) {
      newProps.fontColor =
        getLuminance(props.bg as string) < 0.4 ? 'white' : 'black'
    }
    return {
      ...props,
      ...newProps,
    }
  }),
)(ButtonStyled) as typeof ButtonStyled
