import * as React from 'react'
import { Flipper, Flipped } from 'react-flip-toolkit'
import styled, { css } from 'react-emotion'
import * as tonal from 'tonal'
import { transpose } from 'tonal-distance'
import * as _ from 'lodash'
import { SortableContainer, SortableElement } from 'react-sortable-hoc'

import ListItemIcon from '@material-ui/core/ListItemIcon'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import PlusIcon from '@material-ui/icons/Add'
import MinusIcon from '@material-ui/icons/Remove'
import Plus1Icon from '@material-ui/icons/ExposurePlus1'
import Minus1Icon from '@material-ui/icons/ExposureNeg1'
import CompareArrowsIcon from '@material-ui/icons/CompareArrows'
import EditIcon from '@material-ui/icons/Edit'
import RemoveIcon from '@material-ui/icons/Close'

import { Flex, Text } from './ui'
import NoteCard from './NoteCard'
import PickNoteModal from './PickNoteModal'
import { observer } from 'mobx-react'
import {
  getNotePitchClassWithSharp,
  getEnharmonicVersionForNote,
  getConcertPitchMidi,
} from '../musicUtils'
import { getColorForNote } from '../utils';
import sessionStore from '../services/sessionStore'

const FlipperAlignCenter = styled(Flipper)`
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: center;
  align-items: center;
`

const FlipperAlignTop = styled(Flipper)`
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: flex-start;
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
      this.props.onNoteEdited(this.getEnharmonicNote() || this.props.noteName)
    }

    private handleOctaveUpClick = () =>
      this.props.onNoteEdited(
        transpose(this.props.noteName, tonal.Interval.fromSemitones(12)),
      )

    private handleOctaveDownClick = () =>
      this.props.onNoteEdited(
        transpose(this.props.noteName, tonal.Interval.fromSemitones(-12)),
      )

    private handleSemitoneUpClick = () =>
      this.props.onNoteEdited(
        tonal.Note.fromMidi(
          (tonal.Note.midi(this.props.noteName) as number) + 1,
          true,
        ),
      )

    private handleSemitoneDownClick = () =>
      this.props.onNoteEdited(
        tonal.Note.fromMidi(
          (tonal.Note.midi(this.props.noteName) as number) - 1,
          true,
        ),
      )

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

    private getEnharmonicNote = () => {
      const { noteName } = this.props
      let octave = tonal.Note.oct(noteName) as number
      let noteNameWithOctave = noteName
      if (!octave) {
        octave = 4
        noteNameWithOctave = `${noteName}4`
      }

      const enharmonicNoteName = getEnharmonicVersionForNote(noteNameWithOctave)

      return enharmonicNoteName
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
        hideContextMenu,
        disableRemoving,
        disabledNotePitches,
        ...props
      } = this.props

      const menuId = `note-card-menu-${id}`

      let octave = tonal.Note.oct(noteName) as number
      let noteNameWithOctave = noteName
      if (!octave) {
        octave = 4
        noteNameWithOctave = `${noteName}4`
      }

      const midi = tonal.Note.midi(noteNameWithOctave) as number
      const midiConcertPitch = getConcertPitchMidi(
        sessionStore.activeSession!.instrumentTransposing,
        midi,
      ) as number

      const enharmonicPitchName = tonal.Note.pc(
        this.getEnharmonicNote() as string,
      ) as string
      const shouldShowChangeToEnharmonic = !!enharmonicPitchName

      const noteNameHalfStepUp = getNotePitchClassWithSharp(
        tonal.Note.fromMidi(midi + 1),
      )
      const noteNameHalfStepDown = getNotePitchClassWithSharp(
        tonal.Note.fromMidi(midi - 1),
      )

      let disabledNotePitchesMap = {}
      if (disabledNotePitches) {
        disabledNotePitches.forEach(n => {
          disabledNotePitchesMap[n] = true
        })
      }

      const shouldDisableHalfStepUp =
        midiConcertPitch >= 95 || disabledNotePitchesMap[noteNameHalfStepUp]
      const shouldDisableHalfStepDown =
        midiConcertPitch <= 24 || disabledNotePitchesMap[noteNameHalfStepDown]

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
                open={!hideContextMenu && this.state.menuOpen}
                onClose={this.closeMenu}
              >
                <MenuItem
                  disabled={octave >= 6}
                  onClick={this.handleOctaveUpClick}
                >
                  <ListItemIcon>
                    <PlusIcon />
                  </ListItemIcon>
                  Octave up
                </MenuItem>
                <MenuItem
                  disabled={octave < 2}
                  onClick={this.handleOctaveDownClick}
                >
                  <ListItemIcon>
                    <MinusIcon />
                  </ListItemIcon>
                  Octave down
                </MenuItem>

                <MenuItem
                  disabled={shouldDisableHalfStepUp} // "B6"
                  onClick={this.handleSemitoneUpClick}
                >
                  <ListItemIcon>
                    <Plus1Icon />
                  </ListItemIcon>
                  Half-step up
                </MenuItem>
                <MenuItem
                  disabled={shouldDisableHalfStepDown} // "C1"
                  onClick={this.handleSemitoneDownClick}
                >
                  <ListItemIcon>
                    <Minus1Icon />
                  </ListItemIcon>
                  Half-step down
                </MenuItem>

                {shouldShowChangeToEnharmonic && (
                  <MenuItem onClick={this.handleChangeToEnharmonicClick}>
                    <ListItemIcon>
                      <CompareArrowsIcon />
                    </ListItemIcon>
                    {'Change to '}
                    <Text ml={1} fontWeight="bold">
                      {enharmonicPitchName &&
                        tonal.Note.pc(enharmonicPitchName)}
                    </Text>
                  </MenuItem>
                )}

                <MenuItem autoFocus onClick={this.handleEditClick}>
                  <ListItemIcon>
                    <EditIcon color="action" />
                  </ListItemIcon>
                  Change note...
                </MenuItem>

                {!disableRemoving && (
                  <MenuItem onClick={this.handleDeleteClick} color="secondary">
                    <ListItemIcon>
                      <RemoveIcon />
                    </ListItemIcon>
                    Remove
                  </MenuItem>
                )}
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
  observer(
    ({
      items,
      isDragging,
      zIndex,
      isDraggingOutOfContainer,
      innerRef,
      children,
      activeNoteCardIndex,
      hideContextMenu,
      disableRemoving,
      shouldFlip,
      onEditClick,
      perLineCount,
      onDeleteClick,
      onEditNote,
      onMouseOver,
      showOctaves,
      onMouseLeave,
      verticalAlign,
      disabledNotePitches,
    }) => {
      let backgroundColor = 'transparent'
      if (isDraggingOutOfContainer) {
        backgroundColor = '#ffe4e4'
      } else if (isDragging) {
        backgroundColor = '#eff8ff'
      }

      let FlipperComponent =
        verticalAlign === 'top' ? FlipperAlignTop : FlipperAlignCenter

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
          <FlipperComponent flipKey={items}>
            {items.map(({ noteName, id }, index) => {
              const noteCardText =
                settingsStore.showNoteOctaves || showOctaves
                  ? noteName
                  : tonal.Note.pc(noteName)

              return (
                <SortableNoteCard
                  noteName={noteName}
                  // @ts-ignore
                  shouldFlip={shouldFlip}
                  id={id}
                  key={id}
                  index={index}
                  // @ts-ignore
                  bgColor={getColorForNote(noteName)}
                  tabIndex={-1}
                  perLineCount={perLineCount}
                  hideContextMenu={hideContextMenu}
                  disableRemoving={disableRemoving}
                  disabledNotePitches={disabledNotePitches}
                  width={1}
                  zIndex={zIndex}
                  active={activeNoteCardIndex === index}
                  onEditClick={() => onEditClick(index)}
                  onNoteEdited={noteName => onEditNote(index, noteName)}
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
                  {noteCardText}
                </SortableNoteCard>
              )
            })}
            {children}
          </FlipperComponent>
        </div>
      )
    },
  ),
)

const DRAG_AND_DROP_TRANSITION_DURATION_MS = 300

export interface NoteCardNote {
  noteName: string
  id: string
}

type NoteCardsProps = {
  notes: NoteCardNote[]
  disabledNotePitches?: string[]
  draggable?: boolean
  disableRemoving?: boolean
  hideContextMenu?: boolean
  showOctaves?: boolean
  zIndex?: number
  verticalAlign?: 'top' | 'center'
  perLineCount?: number
  activeNoteCardIndex?: number
  onMouseOver?: (index: number) => any
  onMouseLeave?: (index: number) => any
  onCardsReorder?: (arg: { oldIndex: number; newIndex: number }) => any
  onDeleteClick?: (index: number) => any
  onCardDraggedOut?: (index: number) => any
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
      if (this.props.onCardDraggedOut) {
        this.props.onCardDraggedOut(this.state.noteCardDraggedIndex)
      }
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

  private handleEditNote = (index, noteName) => {
    if (this.props.onEditNote) {
      this.props.onEditNote(index, { noteName })
    }
  }

  public render() {
    const {
      children,
      onDeleteClick,
      notes,
      activeNoteCardIndex,
      onMouseOver,
      onMouseLeave,
      zIndex,
      perLineCount,
      hideContextMenu,
      showOctaves,
      disableRemoving,
      verticalAlign,
      disabledNotePitches: disabledNotePitches,
    } = this.props

    return (
      <>
        <SortableNotesContainer
          // @ts-ignore
          isDragging={this.state.isDragging}
          isDraggingOutOfContainer={this.state.isDraggingOutOfContainer}
          innerRef={this.containerRef}
          shouldFlip={this.shouldFlip}
          hideContextMenu={hideContextMenu}
          disableRemoving={disableRemoving}
          transitionDuration={DRAG_AND_DROP_TRANSITION_DURATION_MS}
          activeNoteCardIndex={activeNoteCardIndex}
          items={notes}
          verticalAlign={verticalAlign || 'center'}
          perLineCount={perLineCount || 4}
          zIndex={zIndex || 1000}
          onMouseOver={onMouseOver}
          onEditNote={this.handleEditNote}
          showOctaves={showOctaves}
          onMouseLeave={onMouseLeave}
          onSortEnd={this.handleSortEnd}
          onSortMove={this.handleSortMove}
          onSortStart={this.handleSortStart}
          onEditClick={this.handleEditNoteClick}
          onDeleteClick={onDeleteClick}
          axis="xy"
          children={children}
          disabledNotePitches={disabledNotePitches || []}
        />
        {this.state.noteEditingModalIsOpen && (
          <PickNoteModal
            isOpen={this.state.noteEditingModalIsOpen}
            disabledNotePitches={_.difference(
              disabledNotePitches || [],
              this.state.noteEditingModalNoteIndex != null
                ? [
                    getNotePitchClassWithSharp(
                      this.props.notes[this.state.noteEditingModalNoteIndex]
                        .noteName,
                    ),
                  ]
                : [],
            )}
            noteName={
              this.state.noteEditingModalNoteIndex != null
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
