import * as React from 'react'
import { css } from 'emotion'

import MuTooltip, { TooltipProps } from '@material-ui/core/Tooltip'

const Tooltip: React.SFC<TooltipProps> = props => (
  <MuTooltip
    {...props}
    classes={{
      tooltip: css({
        fontSize: '1rem',
        background: '#3f51b5',
        userSelect: 'none',
      }),
    }}
    {...props}
  />
)

export default Tooltip
