import * as React from 'react'
import { css } from 'emotion'

import MuSlider, { SliderProps } from '@material-ui/lab/Slider'
import _ from 'lodash'

const Slider: React.SFC<SliderProps> = ({ ...props }) => (
  <MuSlider
    classes={{
      root: css(`
          padding: 1rem;
        `),
    }}
    {...props}
  />
)

export default Slider
