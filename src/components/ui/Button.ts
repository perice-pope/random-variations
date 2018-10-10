import { lighten, darken, getLuminance } from 'polished'
import * as recompose from 'recompose'

import { HoverButton, HoverButtonProps } from './HoverButton'
import theme from '../../styles/theme'

export const Button = recompose.compose(
  recompose.setDisplayName('Button'),
  recompose.defaultProps({
    bg: theme.colors.lightGray,
    p: [2, 2, 3],
    fontSize: [2, 3, 3],
  }),
  recompose.mapProps((props: HoverButtonProps) => {
    const newProps: HoverButtonProps = {}

    if (props.bg && !props.hoverBg) {
      newProps.hoverBg =
        getLuminance(props.bg as string) < 0.3
          ? lighten(0.1, props.bg as string)
          : darken(0.1, props.bg as string)
    }

    if (!props.color && props.bg) {
      newProps.color =
        getLuminance(props.bg as string) < 0.3 ? 'white' : 'black'
    }
    return {
      ...props,
      ...newProps,
    }
  }),
)(HoverButton) as typeof HoverButton
