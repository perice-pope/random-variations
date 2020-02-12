import styled from 'react-emotion'
import * as ss from './styleSystem'
import * as recompose from 'recompose'

import { Box, BoxProps } from './Box'

type FlexProps = BoxProps &
  ss.FlexWrapProps &
  ss.FlexDirectionProps &
  ss.AlignItemsProps &
  ss.JustifyContentProps

const FlexUnenhanced = styled(Box)<FlexProps>`
  ${ss.flexWrap}
  ${ss.display}
  ${ss.flexDirection}
  ${ss.alignItems}
  ${ss.justifyContent}
`

export const Flex = recompose.compose(
  recompose.setDisplayName('Flex'),
  recompose.defaultProps<FlexProps>({
    display: 'flex',
  }),
)(FlexUnenhanced) as typeof FlexUnenhanced
