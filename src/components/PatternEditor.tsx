import * as React from 'react'
import * as _ from 'lodash'

import ArrowUpIcon from '@material-ui/icons/ArrowDropUp'
import ArrowDownIcon from '@material-ui/icons/ArrowDropDown'

import { ArpeggioPattern } from 'src/types'
import { Button, NativeSelect, OutlinedInput } from '@material-ui/core'
import { css } from 'react-emotion'
import { Flex } from './ui/Flex'

type PatternEditorProps = {
  value: ArpeggioPattern
  onChange: (pattern: ArpeggioPattern) => any
  min: number
  max: number
}

const renderSelectOptions = _.memoize(
  (min, max) => {
    const options: React.ReactNode[] = []
    for (let i = min; i <= max; ++i) {
      options.push(
        <option key={i} value={i}>
          {i}
        </option>,
      )
    }
    return options
  },
  (min, max) => `${min}:${max}`,
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

  render() {
    const { min, max, value: pattern } = this.props
    return (
      <Flex
        flex={1}
        flexDirection="row"
        flexWrap="wrap"
        alignItems="center"
        justifyContent="center"
      >
        {pattern.items.map((item, index) => (
          <Flex
            flexDirection="column"
            mx={[1, 2, 2]}
            my={[1, 2, 3]}
            maxWidth={50}
          >
            <Button
              tabIndex={-1}
              className={css({ minWidth: '50px', padding: '0.5rem 0' })}
              onClick={() => {
                let value
                if (item.note != null) {
                  value = item.note < max ? item.note + 1 : min
                } else {
                  value = max
                }
                this.handleItemNoteChange(index, value)
              }}
            >
              <ArrowUpIcon />
            </Button>

            <NativeSelect
              value={item.note}
              IconComponent={() => <></>}
              classes={
                {
                  // select: css({ fontSize: '2rem', lineHeight: '2rem' }),
                }
              }
              onChange={e => {
                let value
                if (e.target.value) {
                  value = parseInt(e.target.value, 10)
                  if (value > max) {
                    value = max
                  }
                  if (value < min) {
                    value = min
                  }
                }
                this.handleItemNoteChange(index, value)
              }}
              input={
                <OutlinedInput
                  labelWidth={0}
                  inputProps={{
                    className: css({
                      fontSize: '2rem',
                      lineHeight: '2rem',
                      padding: '1rem !important',
                    }),
                  }}
                />
              }
            >
              <optgroup
                className={css({ fontSize: '1rem', lineHeight: '1rem' })}
              >
                {renderSelectOptions(min, max)}
              </optgroup>
            </NativeSelect>

            <Button
              tabIndex={-1}
              className={css({ minWidth: '50px', padding: '0.5rem 0' })}
              onClick={() => {
                let value
                if (item.note != null) {
                  value = item.note > min ? item.note - 1 : max
                } else {
                  value = min
                }
                this.handleItemNoteChange(index, value)
              }}
            >
              <ArrowDownIcon />
            </Button>
          </Flex>
        ))}
      </Flex>
    )
  }
}

export default PatternEditor
