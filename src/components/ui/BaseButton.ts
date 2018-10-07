import styled from 'react-emotion'
import * as ss from './styleSystem'
import * as recompose from 'recompose'
import isPropValid from '@emotion/is-prop-valid'

import { BoxProps } from './Box'

export type BaseButtonProps = BoxProps &
  ss.FontWeightProps &
  ss.FontSizeProps &
  ss.JustifyContentProps & {
    outline?: string
    variant?: string
  }

const StyledButton = styled('button', {
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
  outline: ${({ outline }) => outline};
  cursor: pointer;
`

const enhance = recompose.compose(
  recompose.setDisplayName('BaseButton'),
  recompose.defaultProps<BaseButtonProps>({
    border: 'none',
    p: '1rem 2rem',
    fontSize: 3,
    fontWeight: 'bold',
    borderRadius: '0.25rem',
  }),
)

export const BaseButton = enhance(StyledButton) as typeof StyledButton
