import styled from 'react-emotion'
import * as ss from './styleSystem'
import * as recompose from 'recompose'
import isPropValid from '@emotion/is-prop-valid'
import {
  default as MuiButtonBase,
  ButtonBaseProps as MuiButtonBaseProps,
} from '@material-ui/core/ButtonBase'

import { BoxProps } from './Box'

export type BaseButtonProps = MuiButtonBaseProps &
  BoxProps &
  ss.JustifyContentProps & {
    outline?: string
    variant?: string
  }

const StyledBaseButton = styled(MuiButtonBase, {
  shouldForwardProp: isPropValid,
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
`

const enhance = recompose.compose(recompose.setDisplayName('BaseButton'))

export const BaseButton = enhance(StyledBaseButton) as typeof StyledBaseButton
