import styled from 'react-emotion'

import * as ss from './styleSystem'

const Text = styled('span')`
  ${ss.color}
  ${ss.fontWeight}
  ${ss.fontSize}
  ${ss.space}
  ${ss.position}
  ${ss.left}
  ${ss.top}
  ${ss.letterSpacing}
  ${ss.height}
  ${ss.zIndex}
  ${ss.borderRadius}
  ${ss.textAlign}
  ${ss.opacity}
  display: block;
`

Text.defaultProps = {
  m: 0,
  p: 0,
}

export { Text }
