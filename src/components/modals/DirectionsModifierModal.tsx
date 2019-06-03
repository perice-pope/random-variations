import * as React from 'react'
import * as _ from 'lodash'

import { default as MuButton } from '@material-ui/core/Button'

import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import withMobileDialog from '@material-ui/core/withMobileDialog'

import FormControl from '@material-ui/core/FormControl'
import NativeSelect from '@material-ui/core/NativeSelect'

import { DirectionsModifier } from '../../types'
import { ChangeEvent } from 'react'
import { Input, Typography, InputLabel } from '@material-ui/core'
import { css } from 'react-emotion'
import {
  patternDirectionOptions,
  patternDirectionByType,
} from '../../musicUtils'
import { Flex } from '../ui/Flex'
import { Box } from '../ui'
import { Omit } from '../../utils'

export type SubmitValuesType = Omit<DirectionsModifier, 'enabled'>

type DirectionsModifierModalProps = {
  isOpen: boolean
  onClose: () => any
  onSubmit: (args: SubmitValuesType) => any
  initialValues?: SubmitValuesType
  baseNote?: string
}

type DirectionsModifierModalState = {
  values: SubmitValuesType
}

type DirectionTypeOption = {
  title: string
  value: string
}

const directionOptions: DirectionTypeOption[] = patternDirectionOptions.map(
  ({ type, title }) => ({
    value: type,
    title,
  }),
)

// @ts-ignore
class DirectionsModifierModal extends React.Component<
  DirectionsModifierModalProps & { fullScreen: boolean },
  DirectionsModifierModalState
> {
  static defaultProps: Partial<DirectionsModifierModalProps> = {
    initialValues: {
      direction: patternDirectionOptions[0],
      random: false,
    },
  }

  state: DirectionsModifierModalState = {
    values: _.merge(
      DirectionsModifierModal.defaultProps.initialValues,
      this.props.initialValues || {},
    ),
  }

  handleSubmit = () => {
    this.props.onSubmit(this.state.values)
  }

  handleDirectionTypeSelected = (e: ChangeEvent<HTMLSelectElement>) => {
    const directionType = e.target.value
    console.log(
      directionType,
      patternDirectionByType,
      patternDirectionByType[directionType],
    )

    this.setState({
      values: {
        ...this.state.values,
        direction:
          patternDirectionByType[directionType] || patternDirectionOptions[0],
      },
    })
  }

  render() {
    if (!this.props.isOpen) {
      return null
    }

    const { direction } = this.state.values

    return (
      <Dialog
        fullWidth={true}
        fullScreen={this.props.fullScreen}
        maxWidth="sm"
        scroll="paper"
        open={this.props.isOpen}
        onClose={this.handleSubmit}
        aria-labelledby="direction-modifier-dialog"
      >
        <DialogContent id="direction-modifier-dialog-content">
          <Box mt={2}>
            <Typography variant="h5">Directions</Typography>
            <Typography variant="subtitle2">
              Change direction of note patterns in each measure
            </Typography>
          </Box>

          <Box>
            <Box mt={3} mb={2}>
              {/* <Typography variant="overline">Pattern direction</Typography> */}
              <Flex flexDirection="row">
                <FormControl className={css({ flex: 1 })}>
                  <InputLabel htmlFor="direction-type">
                    Pattern direction
                  </InputLabel>
                  <NativeSelect
                    value={direction.type}
                    onChange={this.handleDirectionTypeSelected}
                    name="direction"
                    input={<Input id="direction-type" />}
                  >
                    {directionOptions.map(({ title, value }) => (
                      <option key={value} value={value}>
                        {title}
                      </option>
                    ))}
                  </NativeSelect>
                </FormControl>
              </Flex>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <MuButton onClick={this.props.onClose} color="secondary">
            Cancel
          </MuButton>
          <MuButton onClick={this.handleSubmit} color="primary" autoFocus>
            OK
          </MuButton>
        </DialogActions>
      </Dialog>
    )
  }
}

export default withMobileDialog<DirectionsModifierModalProps>({
  breakpoint: 'xs',
})(DirectionsModifierModal)
