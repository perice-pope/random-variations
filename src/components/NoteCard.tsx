import styled from 'styled-components'

import { Box } from './ui'

const NoteCard = styled(Box)`
  display: inline-flex;
  background-color: salmon;
  padding: 10px;
  font-size: 30px;
  min-height: 100px;
  align-items: center;
  justify-content: center;
`

NoteCard.defaultProps = {
  width: 1 / 4,
  m: 1,
}

export default NoteCard
