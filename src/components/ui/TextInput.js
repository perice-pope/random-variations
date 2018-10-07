import styled from 'react-emotion'

import * as ss from './styleSystem'

const TextInput = styled('input')`
  ${ss.color}
  ${ss.fontWeight}
  ${ss.fontSize}
  ${ss.space}
  ${ss.position}
  ${ss.zIndex}
  ${ss.width}
  ${ss.height}
  ${ss.boxShadow}
  display: block;
  border: none;
`

TextInput.defaultProps = {
  m: 0,
  p: 0,
}

export { TextInput }
