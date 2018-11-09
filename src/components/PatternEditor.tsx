import * as React from 'react'
import * as _ from 'lodash'

import ArrowUpIcon from '@material-ui/icons/ArrowDropUp'
import ArrowDownIcon from '@material-ui/icons/ArrowDropDown'
import AddIcon from '@material-ui/icons/Add'

import {
  SortableContainer,
  SortableElement,
  arrayMove,
} from 'react-sortable-hoc'

import { ArpeggioPattern, ArpeggioPatternElement } from 'src/types'
import { Button, Tooltip, Menu, MenuItem } from '@material-ui/core'
import { css } from 'react-emotion'
import { Flex } from './ui/Flex'
import { withState, compose } from 'recompose'

type PatternEditorProps = {
  getSortableContainer?: () => any
  useLetters?: boolean
  value: ArpeggioPattern
  onChange: (pattern: ArpeggioPattern) => any
  min: number
  max: number
}

const numberToLetter = (value: number) =>
  String.fromCharCode('A'.charCodeAt(0) + value - 1)

const SortablePatternElement = SortableElement(
  compose(
    withState('menuOpen', 'setMenuOpen', false),
    withState('menuAnchorEl', 'setMenuAnchorEl', null),
  )(
    // @ts-ignore
    ({
      useLetters,
      menuOpen,
      setMenuOpen,
      menuAnchorEl,
      setMenuAnchorEl,
      onItemNoteChange,
      onItemNoteMute,
      onItemNoteDelete,
      item,
      itemIndex: index,
      min,
      max,
    }: {
      value: ArpeggioPatternElement
      [k: string]: any
    }) => {
      let buttonText = '-'
      if (!item.muted) {
        buttonText = useLetters ? numberToLetter(item.note) : item.note
      }

      return (
        <>
          <Menu
            anchorReference="anchorEl"
            anchorEl={menuAnchorEl}
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
          >
            <MenuItem
              autoFocus
              onClick={() => {
                onItemNoteMute(index, !item.muted)
                setMenuOpen(false)
              }}
            >
              {item.muted ? 'Unmute' : 'Mute'}
            </MenuItem>
            <MenuItem
              autoFocus
              onClick={() => {
                onItemNoteDelete(index)
                setMenuOpen(false)
              }}
            >
              Remove
            </MenuItem>
          </Menu>

          <Flex
            flexDirection="column"
            zIndex={5000}
            alignItems="center"
            mx={[1, 2, 2]}
            my={[1, 2, 3]}
            maxWidth={50}
          >
            <Button
              tabIndex={-1}
              className={css({ minWidth: '30px', padding: '0.5rem 0' })}
              onClick={() => {
                let value
                if (item.note != null) {
                  value = item.note < max ? item.note + 1 : min
                } else {
                  value = max
                }
                onItemNoteChange(index, value)
              }}
            >
              <ArrowUpIcon />
            </Button>

            <Button
              variant="outlined"
              onClick={event => {
                setMenuAnchorEl(event.target)
                setMenuOpen(true)
              }}
              className={css({
                minWidth: '30px',
                fontSize: '2rem',
                lineHeight: '2rem',
                padding: '1rem !important',
              })}
            >
              {buttonText}
            </Button>

            <Button
              tabIndex={-1}
              className={css({ minWidth: '30px', padding: '0.5rem 0' })}
              onClick={() => {
                let value
                if (item.note != null) {
                  value = item.note > min ? item.note - 1 : max
                } else {
                  value = min
                }
                onItemNoteChange(index, value)
              }}
            >
              <ArrowDownIcon />
            </Button>
          </Flex>
        </>
      )
    },
  ),
)

const SortablePatternElements = SortableContainer(
  ({ items, ...other }: { items: ArpeggioPatternElement[] }) => (
    <>
      {items.map((item, index) => (
        <SortablePatternElement
          key={`item-${index}`}
          index={index}
          // @ts-ignore
          item={item}
          {...other}
          itemIndex={index}
        />
      ))}
    </>
  ),
)

// @ts-ignore
class PatternEditor extends React.Component<PatternEditorProps> {
  handleItemNoteChange = (index: number, noteValue: number) => {
    const { value: pattern } = this.props

    const newItems = [...pattern.items]
    newItems[index].note = noteValue

    const newPattern = {
      ...pattern,
      items: newItems,
    }
    this.props.onChange(newPattern)
  }

  handleItemNoteMutedChange = (index: number, muted: boolean) => {
    const { value: pattern } = this.props

    const newItems = [...pattern.items]
    newItems[index].muted = muted

    const newPattern = {
      ...pattern,
      items: newItems,
    }
    this.props.onChange(newPattern)
  }

  handleItemNoteDelete = (index: number) => {
    const { value: pattern } = this.props

    let newItems = [...pattern.items]
    delete newItems[index]
    newItems = newItems.filter(x => x)

    const newPattern = {
      ...pattern,
      items: newItems,
    }
    this.props.onChange(newPattern)
  }

  handleAddNoteToPattern = () => {
    const { value: pattern } = this.props
    const newPattern = {
      ...pattern,
      items: [...pattern.items, { note: 1 }],
    }
    this.props.onChange(newPattern)
  }

  handleItemsReorder = ({ oldIndex, newIndex }) => {
    const { value: pattern } = this.props
    const newPattern = {
      ...pattern,
      items: arrayMove(pattern.items, oldIndex, newIndex),
    }
    this.props.onChange(newPattern)
  }

  render() {
    const {
      useLetters,
      getSortableContainer,
      min,
      max,
      value: pattern,
    } = this.props
    return (
      <Flex
        alignItems="center"
        justifyContent="center"
        flex={1}
        flexWrap="wrap"
      >
        <SortablePatternElements
          // @ts-ignore
          onItemNoteChange={this.handleItemNoteChange}
          onItemNoteDelete={this.handleItemNoteDelete}
          onItemNoteMute={this.handleItemNoteMutedChange}
          items={pattern.items}
          useLetters={useLetters}
          axis="x"
          distance={10}
          onSortEnd={this.handleItemsReorder}
          // @ts-ignore
          min={min}
          // @ts-ignore
          max={max}
          getContainer={getSortableContainer}
        />
        {pattern.items.length < 16 && (
          <Tooltip title="Add note" disableFocusListener={true}>
            <Button
              className={css({ minWidth: '40px', marginLeft: '1rem' })}
              variant="fab"
              size="small"
              aria-label="Add"
              onClick={this.handleAddNoteToPattern}
            >
              <AddIcon fontSize="small" />
            </Button>
          </Tooltip>
        )}
      </Flex>
    )
  }
}

export default PatternEditor
