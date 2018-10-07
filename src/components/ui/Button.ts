import { darken } from 'polished'
import * as recompose from 'recompose'

import { HoverButton } from './HoverButton'
import theme from '../../styles/theme'

export const Button = recompose.compose(
  recompose.setDisplayName('Button'),
  recompose.defaultProps({
    bg: theme.colors.lightGray,
    p: 3,
    fontSize: 4,
    hoverBg: darken(0.1, theme.colors.lightGray),
  }),
)(HoverButton) as typeof HoverButton
