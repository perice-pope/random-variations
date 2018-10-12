import * as React from 'react'
import { Flipper, Flipped } from 'react-flip-toolkit'
import styled from 'react-emotion'
import * as _ from 'lodash'

import { Box } from './ui'
import NoteCard from './NoteCard'

import { NoteCardType } from '../types'

const FlipperStyled = styled(Flipper)`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
`

type NoteCardsProps = {
  noteCards: NoteCardType[]
  activeNoteCard?: NoteCardType
  onNoteCardClick: (noteCard: NoteCardType) => any
}

class NoteCards extends React.Component<NoteCardsProps> {
  public render() {
    const { onNoteCardClick, noteCards, activeNoteCard } = this.props

    return (
      <FlipperStyled flipKey={noteCards}>
        {noteCards.map(noteCard => (
          <Flipped key={noteCard.id} flipId={noteCard.id}>
            <Box
              p={2}
              width={1 / 4}
              position="relative"
              zIndex={noteCard === activeNoteCard ? 2 : 1}
            >
              <NoteCard
                bgColor={noteCard.color}
                tabIndex={0}
                onClick={() => onNoteCardClick(noteCard)}
                width={1}
                active={activeNoteCard === noteCard}
              >
                {noteCard.text}
              </NoteCard>
            </Box>
          </Flipped>
        ))}
      </FlipperStyled>
    )
  }
}

export default NoteCards
