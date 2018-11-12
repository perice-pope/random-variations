import * as React from 'react'
import { css } from 'emotion'

import MuTooltip, { TooltipProps } from '@material-ui/core/Tooltip'

const Tooltip: React.SFC<TooltipProps & { variant?: 'primary' | 'gray' }> = ({
  variant,
  ...props
}) => (
  <MuTooltip
    {...props}
    classes={{
      tooltip: css({
        fontSize: '1rem',
        background: variant === 'gray' ? '#888' : '#3f51b5',
        userSelect: 'none',
      }),
    }}
    {...props}
  />
)

export default Tooltip
