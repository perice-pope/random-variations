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
import { getNoteCardColorByNoteName } from '../utils'
import PickNoteModal from './PickNoteModal'

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
        noteName,
        id,
        active,
        bgColor,
        shouldFlip,
        perLineCount,
        onClick,
        zIndex,
        ...props
      } = this.props
      const menuId = `note-card-menu-${id}`

      const enharmonicNoteName = tonal.Note.enharmonic(noteName)
      const shouldShowChangeToEnharmonic = enharmonicNoteName !== noteName

      return (
        <Flipped flipId={id} shouldFlip={shouldFlip}>
          <div
            className={css(`
          width: ${Math.floor(100 / perLineCount)}%;
          position: relative;
          z-index: ${active ? zIndex + 2 : zIndex + 1};
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
                  Change note...
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
    zIndex,
    isDraggingOutOfContainer,
    innerRef,
    children,
    activeNoteCardIndex,
    shouldFlip,
    onChangeToEnharmonicClick,
    onEditClick,
    perLineCount,
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
          transition: background-color 0.3s;
          background-color: ${backgroundColor}
      `)}
      >
        <FlipperStyled flipKey={items}>
          {items.map(({ noteName, id }, index) => (
            <SortableNoteCard
              noteName={noteName}
              // @ts-ignore
              shouldFlip={shouldFlip}
              id={id}
              key={id}
              index={index}
              // @ts-ignore
              bgColor={getNoteCardColorByNoteName(noteName)}
              tabIndex={-1}
              perLineCount={perLineCount}
              width={1}
              zIndex={zIndex}
              active={activeNoteCardIndex === index}
              onEditClick={() => onEditClick(index)}
              onChangeToEnharmonicClick={() => onChangeToEnharmonicClick(index)}
              onDeleteClick={() => onDeleteClick(index)}
              onMouseOver={() => {
                if (onMouseOver) {
                  onMouseOver(index)
                }
              }}
              onMouseLeave={() => {
                if (onMouseLeave) {
                  onMouseLeave(index)
                }
              }}
            >
              {noteName}
            </SortableNoteCard>
          ))}
          {children}
        </FlipperStyled>
      </div>
    )
  },
)

const DRAG_AND_DROP_TRANSITION_DURATION_MS = 300

export interface NoteCardNote {
  noteName: string
  id: string
}

type NoteCardsProps = {
  notes: NoteCardNote[]
  zIndex?: number
  perLineCount?: number
  activeNoteCardIndex?: number
  onMouseOver?: (index: number) => any
  onMouseLeave?: (index: number) => any
  onCardsReorder: (arg: { oldIndex: number; newIndex: number }) => any
  onChangeToEnharmonicClick: (index: number) => any
  onDeleteClick: (index: number) => any
  onCardDraggedOut: (index: number) => any
  onEditNote?: (index: number, data: { noteName: string }) => any
}

type NoteCardsState = {
  noteCardDraggedIndex?: number
  isDragging: boolean
  isDraggingOutOfContainer?: boolean

  noteEditingModalIsOpen?: boolean
  noteEditingModalNoteIndex?: number
}

class NoteCards extends React.Component<NoteCardsProps, NoteCardsState> {
  containerRef: React.RefObject<React.ReactNode> = React.createRef()
  state: NoteCardsState = {
    isDragging: false,
    isDraggingOutOfContainer: false,
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
      this.props.onCardDraggedOut(this.state.noteCardDraggedIndex)
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

  private closeNoteEditingModal = () => {
    this.setState({
      noteEditingModalIsOpen: false,
      noteEditingModalNoteIndex: undefined,
    })
  }

  private handleEditNoteClick = (index: number) => {
    this.setState({
      noteEditingModalIsOpen: true,
      noteEditingModalNoteIndex: index,
    })
  }

  private handleEditNoteSubmit = ({ noteName }) => {
    if (this.props.onEditNote) {
      this.props.onEditNote(this.state.noteEditingModalNoteIndex!, { noteName })
    }
    this.closeNoteEditingModal()
  }

  public render() {
    const {
      children,
      onDeleteClick,
      onChangeToEnharmonicClick,
      notes,
      activeNoteCardIndex,
      onMouseOver,
      onMouseLeave,
      zIndex,
      perLineCount,
    } = this.props

    return (
      <>
        <SortableNotesContainer
          // @ts-ignore
          isDragging={this.state.isDragging}
          isDraggingOutOfContainer={this.state.isDraggingOutOfContainer}
          innerRef={this.containerRef}
          shouldFlip={this.shouldFlip}
          transitionDuration={DRAG_AND_DROP_TRANSITION_DURATION_MS}
          activeNoteCardIndex={activeNoteCardIndex}
          items={notes}
          perLineCount={perLineCount || 4}
          zIndex={zIndex || 1000}
          onMouseOver={onMouseOver}
          onMouseLeave={onMouseLeave}
          onSortEnd={this.handleSortEnd}
          onSortMove={this.handleSortMove}
          onSortStart={this.handleSortStart}
          onEditClick={this.handleEditNoteClick}
          onDeleteClick={onDeleteClick}
          onChangeToEnharmonicClick={onChangeToEnharmonicClick}
          axis="xy"
          children={children}
        />
        {this.state.noteEditingModalIsOpen && (
          <PickNoteModal
            isOpen
            noteName={
              this.state.noteEditingModalNoteIndex
                ? this.props.notes[this.state.noteEditingModalNoteIndex]
                    .noteName
                : undefined
            }
            onClose={this.closeNoteEditingModal}
            onSubmit={this.handleEditNoteSubmit}
          />
        )}
      </>
    )
  }
}

export default NoteCards
