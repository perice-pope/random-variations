import * as React from 'react'
import { Flipper, Flipped } from 'react-flip-toolkit'
import styled, { css } from 'react-emotion'
import * as tonal from 'tonal'
import * as _ from 'lodash'
import { SortableContainer, SortableElement } from 'react-sortable-hoc'

import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'

import { Flex, Text } from './ui'
import NoteCard from './NoteCard'

import { NoteCardType } from '../types'

// @ts-ignore
const FlipperStyled = styled(Flipper)`
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: center;
  align-items: center;
`

type NoteCardWrapperProps = {
  [x: string]: any //TODO
}

type Position = {
  left: number
  top: number
}

type NoteCardWrapperState = {
  menuPosition: Position
  menuOpen: boolean
}

const SortableNoteCard = SortableElement(
  class NoteCardWrapper extends React.Component<
    NoteCardWrapperProps,
    NoteCardWrapperState
  > {
    state = {
      menuOpen: false,
      menuPosition: { left: 0, top: 0 },
    }

    private openMenu = (menuPosition: Position) => {
      this.setState({ menuOpen: true, menuPosition })
    }

    private closeMenu = () => {
      this.setState({ menuOpen: false })
    }

    private handleCardClick = event => {
      this.openMenu({ left: event.clientX, top: event.clientY })
    }

    private handleChangeToEnharmonicClick = () => {
      this.closeMenu()
      if (this.props.onChangeToEnharmonicClick) {
        this.props.onChangeToEnharmonicClick()
      }
    }

    private handleEditClick = () => {
      this.closeMenu()
      if (this.props.onEditClick) {
        this.props.onEditClick()
      }
    }

    private handleDeleteClick = () => {
      this.closeMenu()
      if (this.props.onDeleteClick) {
        this.props.onDeleteClick()
      }
    }

    render() {
      const {
        noteCard,
        id,
        active,
        bgColor,
        shouldFlip,
        onClick,
        ...props
      } = this.props
      const menuId = `note-card-menu-${id}`

      const enharmonicNoteName = tonal.Note.enharmonic(noteCard.noteName)
      const shouldShowChangeToEnharmonic =
        enharmonicNoteName !== noteCard.noteName

      return (
        <Flipped flipId={id} shouldFlip={shouldFlip}>
          <div
            className={css(`
          width: 25%;
          position: relative;
          z-index: ${active ? 2 : 1};
        `)}
          >
            <Flex p={[1, 2, 2]}>
              <Menu
                id={menuId}
                anchorReference="anchorPosition"
                anchorPosition={this.state.menuPosition}
                open={this.state.menuOpen}
                onClose={this.closeMenu}
              >
                <MenuItem autoFocus onClick={this.handleEditClick}>
                  Edit
                </MenuItem>
                {shouldShowChangeToEnharmonic && (
                  <MenuItem
                    autoFocus
                    onClick={this.handleChangeToEnharmonicClick}
                  >
                    {'Change to '}
                    <Text ml={1} fontWeight="bold">
                      {enharmonicNoteName && tonal.Note.pc(enharmonicNoteName)}
                    </Text>
                  </MenuItem>
                )}
                <MenuItem onClick={this.handleDeleteClick}>Remove</MenuItem>
              </Menu>
              <NoteCard
                flex={1}
                active={active}
                bg={bgColor}
                onClick={this.handleCardClick}
                aria-owns={this.state.menuOpen ? menuId : undefined}
                aria-haspopup="true"
                {...props}
              />
            </Flex>
          </div>
        </Flipped>
      )
    }
  },
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
    onChangeToEnharmonicClick,
    onEditClick,
    onDeleteClick,
    onMouseOver,
    onMouseLeave,
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
          width: 100%;
          border-radius: 15px;
          padding: 15px 10px;
          transition: background-color 0.3s;
          background-color: ${backgroundColor}
      `)}
      >
        <FlipperStyled flipKey={items}>
          {items.map((noteCard, index) => (
            <SortableNoteCard
              noteCard={noteCard}
              // @ts-ignore
              shouldFlip={shouldFlip}
              id={noteCard.id}
              key={noteCard.id}
              index={index}
              // @ts-ignore
              bgColor={noteCard.color}
              tabIndex={-1}
              width={1}
              active={activeNoteCard === noteCard}
              onEditClick={() => onEditClick(noteCard)}
              onChangeToEnharmonicClick={() =>
                onChangeToEnharmonicClick(noteCard)
              }
              onDeleteClick={() => onDeleteClick(noteCard)}
              onMouseOver={() => {
                if (onMouseOver) {
                  onMouseOver(noteCard)
                }
              }}
              onMouseLeave={() => {
                if (onMouseLeave) {
                  onMouseLeave(noteCard)
                }
              }}
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
  buttonProps?: any
  onMouseOver?: (noteCard: NoteCardType) => any
  onMouseLeave?: (noteCard: NoteCardType) => any
  onCardsReorder: (arg: { oldIndex: number; newIndex: number }) => any
  onChangeToEnharmonicClick: (noteCard: NoteCardType) => any
  onEditClick: (noteCard: NoteCardType) => any
  onDeleteClick: (noteCard: NoteCardType) => any
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
    } else if (this.props.onCardsReorder && oldIndex !== newIndex) {
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
    const {
      children,
      onEditClick,
      onDeleteClick,
      onChangeToEnharmonicClick,
      noteCards,
      activeNoteCard,
      onMouseOver,
      onMouseLeave,
    } = this.props

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
        onMouseOver={onMouseOver}
        onMouseLeave={onMouseLeave}
        onSortEnd={this.handleSortEnd}
        onSortMove={this.handleSortMove}
        onSortStart={this.handleSortStart}
        onEditClick={onEditClick}
        onDeleteClick={onDeleteClick}
        onChangeToEnharmonicClick={onChangeToEnharmonicClick}
        axis="xy"
        children={children}
      />
    )
  }
}

export default NoteCards
