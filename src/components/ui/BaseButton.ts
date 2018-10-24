import styled from 'react-emotion'
import * as ss from './styleSystem'
import * as recompose from 'recompose'
import isPropValid from '@emotion/is-prop-valid'
import {
  default as MuiButtonBase,
  ButtonBaseProps as MuiButtonBaseProps,
} from '@material-ui/core/ButtonBase'

import { BoxProps } from './Box'
import { getLuminance, lighten, darken } from 'polished'

export type BaseButtonProps = MuiButtonBaseProps &
  BoxProps &
  ss.JustifyContentProps & {
    outline?: string
    variant?: string
    hoverColor?: string
    hoverBg?: string
    fontColor?: string
    transform?: string
  }

const StyledBaseButton = styled(MuiButtonBase, {
  shouldForwardProp: prop =>
    isPropValid || prop === 'variant' || prop === 'component',
})<BaseButtonProps>`
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

const enhance = recompose.compose(
  recompose.setDisplayName('BaseButton'),
  recompose.mapProps((props: BaseButtonProps) => {
    const newProps: BaseButtonProps = {}

    if (props.bg && !props.hoverBg) {
      newProps.hoverBg =
        getLuminance(props.bg as string) < 0.3
          ? lighten(0.1, props.bg as string)
          : darken(0.05, props.bg as string)
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
)

export const BaseButton = enhance(StyledBaseButton) as typeof StyledBaseButton
