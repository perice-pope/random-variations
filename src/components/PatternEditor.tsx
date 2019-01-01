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

import { ArpeggioPattern, ArpeggioPatternElement } from '../types'
import { Button, Menu, MenuItem } from '@material-ui/core'
import { css, cx } from 'react-emotion'
import Tooltip from './ui/Tooltip'
import { Flex } from './ui/Flex'
import { withState, compose } from 'recompose'

type PatternEditorProps = {
  getSortableContainer?: () => any
  useLetters?: boolean
  value: ArpeggioPattern
  className?: string
  onChange: (pattern: ArpeggioPattern) => any
  min: number
  max: number
  maxPatternLength?: number
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
      itemsCount,
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
            mx={0}
            my={[1, 1, 1]}
            maxWidth={50}
          >
            <Button
              tabIndex={-1}
              className={css({
                width: '100%',
                minWidth: '30px',
                padding: '0.5rem 0',
              })}
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
              className={cx(
                css({
                  minWidth: '30px',
                  fontSize: '1.4rem',
                  lineHeight: '1.4rem',
                  padding: '1rem !important',
                  borderRadius: '0 !important',
                }),
                itemsCount >= 6 &&
                  css({
                    minWidth: '24px',
                    fontSize: '1.2rem',
                    lineHeight: '1.2rem',
                    padding: '0.7rem !important',
                  }),
                itemsCount >= 9 &&
                  css({
                    minWidth: '22px',
                    fontSize: '1.1rem',
                    lineHeight: '1.1rem',
                    padding: '0.5rem !important',
                  }),
              )}
            >
              {buttonText}
            </Button>

            <Button
              tabIndex={-1}
              className={cx(
                css({
                  width: '100%',
                  minWidth: '24px',
                  padding: '0.5rem 0',
                }),
              )}
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
          itemsCount={items.length}
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
      maxPatternLength,
      value: pattern,
      className,
    } = this.props
    return (
      <div
        className={cx(
          css(`
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
          `),
          className,
        )}
      >
        <SortablePatternElements
          // @ts-ignore
          onItemNoteChange={this.handleItemNoteChange}
          onItemNoteDelete={this.handleItemNoteDelete}
          onItemNoteMute={this.handleItemNoteMutedChange}
          items={pattern.items}
          useLetters={useLetters}
          axis="x"
          lockAxis="x"
          distance={10}
          onSortEnd={this.handleItemsReorder}
          // @ts-ignore
          min={min}
          // @ts-ignore
          max={max}
          lockToContainerEdges
          getContainer={getSortableContainer}
        />
        {pattern.items.length < (maxPatternLength || 16) && (
          <Tooltip title="Add note">
            <Button
              className={css({ minWidth: '40px', marginLeft: '1rem' })}
              variant="fab"
              color="secondary"
              size="small"
              aria-label="Add"
              onClick={this.handleAddNoteToPattern}
            >
              <AddIcon fontSize="small" />
            </Button>
          </Tooltip>
        )}
      </div>
    )
  }
}

export default PatternEditor
