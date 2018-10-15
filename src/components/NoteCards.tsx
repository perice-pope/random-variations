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
  ({
    items,
    isDragging,
    isDraggingOutOfContainer,
    innerRef,
    children,
    activeNoteCard,
    shouldFlip,
    onClick,
  }) => {
    let backgroundColor = 'transparent'
    if (isDraggingOutOfContainer) {
      backgroundColor = '#ffe4e4'
    } else if (isDragging) {
      backgroundColor = '#eff8ff'
    }
    return (
      <div
        ref={innerRef}
        className={css(`
          height: 100%;
          width: 100%;
          border-radius: 15px;
          transition: background-color 0.3s;
          background-color: ${backgroundColor}
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

type NoteCardsProps = {
  noteCards: NoteCardType[]
  activeNoteCard?: NoteCardType
  onCardsReorder: (arg: { oldIndex: number; newIndex: number }) => any
  onNoteCardClick: (noteCard: NoteCardType) => any
  onCardDraggedOut: (noteCard: NoteCardType) => any
}

type NoteCardsState = {
  noteCardDraggedIndex?: number
  isDragging: boolean
  isDraggingOutOfContainer?: boolean
}

class NoteCards extends React.Component<NoteCardsProps, NoteCardsState> {
  containerRef: React.RefObject<React.ReactNode>

  constructor(props: NoteCardsProps) {
    super(props)
    this.containerRef = React.createRef()
    this.state = {
      noteCardDraggedIndex: undefined,
      isDragging: false,
      isDraggingOutOfContainer: false,
    }
  }

  private shouldFlip = () => {
    return this.state.isDragging === false
  }

  handleSortStart = ({ index }) => {
    this.setState({ noteCardDraggedIndex: index, isDragging: true })
  }

  handleSortEnd = ({ oldIndex, newIndex }) => {
    if (
      this.state.isDraggingOutOfContainer &&
      typeof this.state.noteCardDraggedIndex !== 'undefined'
    ) {
      const noteCardDragged = this.props.noteCards[
        this.state.noteCardDraggedIndex
      ]
      this.props.onCardDraggedOut(noteCardDragged)
    } else if (this.props.onCardsReorder) {
      this.props.onCardsReorder({ oldIndex, newIndex })
    }
    setTimeout(
      () =>
        this.setState({
          isDragging: false,
          isDraggingOutOfContainer: undefined,
        }),
      DRAG_AND_DROP_TRANSITION_DURATION_MS,
    )
  }

  handleSortMove = e => {
    const container = this.containerRef.current as Element
    if (!container) {
      return
    }
    const movingOver = e.target
    this.setState({ isDraggingOutOfContainer: !container.contains(movingOver) })
  }

  public render() {
    const { children, onNoteCardClick, noteCards, activeNoteCard } = this.props

    return (
      <SortableNotesContainer
        // @ts-ignore
        isDragging={this.state.isDragging}
        isDraggingOutOfContainer={this.state.isDraggingOutOfContainer}
        innerRef={this.containerRef}
        shouldFlip={this.shouldFlip}
        transitionDuration={DRAG_AND_DROP_TRANSITION_DURATION_MS}
        activeNoteCard={activeNoteCard}
        items={noteCards}
        onSortEnd={this.handleSortEnd}
        onSortMove={this.handleSortMove}
        onSortStart={this.handleSortStart}
        onClick={onNoteCardClick}
        axis="xy"
        children={children}
      />
    )
  }
}

export default NoteCards
