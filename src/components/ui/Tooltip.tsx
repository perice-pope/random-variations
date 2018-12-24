import * as React from 'react'
import { css } from 'emotion'

import MuTooltip, { TooltipProps } from '@material-ui/core/Tooltip'
import withWidth, { WithWidth } from '@material-ui/core/withWidth'
import _ from 'lodash'

const Tooltip: React.SFC<
  TooltipProps & WithWidth & { variant?: 'primary' | 'gray' }
> = ({ variant, width, ...props }) =>
  width === 'lg' || width === 'xl' || width === 'md' ? (
    <MuTooltip
      disableTouchListener
      disableFocusListener
      classes={{
        tooltip: css({
          fontSize: '1rem',
          background: variant === 'gray' ? '#888' : '#3f51b5',
          userSelect: 'none',
        }),
      }}
      {...props}
    />
  ) : (
    React.cloneElement(props.children, _.omit(props, 'children'))
  )

export default withWidth()(Tooltip)
