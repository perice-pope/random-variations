import * as React from 'react'
// @ts-ignore
import { Flipper, Flipped } from 'react-flip-toolkit'
import styled, { css } from 'react-emotion'
import * as _ from 'lodash'
import { SortableContainer, SortableElement } from 'react-sortable-hoc'

import { Flex } from './ui'
import NoteCard from './NoteCard'

import { NoteCardType } from '../types'

// @ts-ignore
const FlipperStyled = styled(Flipper)`
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
`

type NoteCardsProps = {
  noteCards: NoteCardType[]
  activeNoteCard?: NoteCardType
  onCardsReorder: (arg: { oldIndex: number; newIndex: number }) => any
  onNoteCardClick: (noteCard: NoteCardType) => any
}

const SortableNoteCard = SortableElement(
  ({ id, active, bgColor, shouldFlip, onClick, ...props }) => (
    <Flipped flipId={id} shouldFlip={shouldFlip}>
      <div
        className={css(`
          width: 25%;
          position: relative;
          z-index: ${active ? 2 : 1};
        `)}
      >
        <Flex p={[1, 2, 2]} height="100%">
          <NoteCard
            flex={1}
            active={active}
            bgColor={bgColor}
            onClick={onClick}
            {...props}
          />
        </Flex>
      </div>
    </Flipped>
  ),
)

const SortableNotesContainer = SortableContainer(
  ({ items, children, activeNoteCard, shouldFlip, onClick }) => {
    return (
      <div
        className={css(`
          height: 100%;
          width: 100%;
      `)}
      >
        <FlipperStyled flipKey={items}>
          {items.map((noteCard, index) => (
            <SortableNoteCard
              // @ts-ignore
              shouldFlip={shouldFlip}
              id={noteCard.id}
              key={noteCard.id}
              index={index}
              // @ts-ignore
              bgColor={noteCard.color}
              tabIndex={0}
              width={1}
              active={activeNoteCard === noteCard}
              onClick={() => onClick(noteCard)}
            >
              {noteCard.text}
            </SortableNoteCard>
          ))}
          {children}
        </FlipperStyled>
      </div>
    )
  },
)

const DRAG_AND_DROP_TRANSITION_DURATION_MS = 300

class NoteCards extends React.Component<NoteCardsProps> {
  state = {
    isSorting: false,
  }

  private shouldFlip = () => {
    return this.state.isSorting === false
  }

  handleSortStart = () => {
    this.setState({ isSorting: true })
  }

  handleSortEnd = ({ oldIndex, newIndex }) => {
    if (this.props.onCardsReorder) {
      this.props.onCardsReorder({ oldIndex, newIndex })
    }
    setTimeout(
      () => this.setState({ isSorting: false }),
      DRAG_AND_DROP_TRANSITION_DURATION_MS,
    )
  }

  public render() {
    const { children, onNoteCardClick, noteCards, activeNoteCard } = this.props

    return (
      <SortableNotesContainer
        // @ts-ignore
        shouldFlip={this.shouldFlip}
        transitionDuration={DRAG_AND_DROP_TRANSITION_DURATION_MS}
        activeNoteCard={activeNoteCard}
        items={noteCards}
        onSortEnd={this.handleSortEnd}
        onSortStart={this.handleSortStart}
        onClick={onNoteCardClick}
        axis="xy"
        children={children}
      />
    )
  }
}

export default NoteCards
