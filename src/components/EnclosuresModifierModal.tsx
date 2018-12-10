import * as React from 'react'
import * as _ from 'lodash'
import { css } from 'react-emotion'

import { default as MuButton } from '@material-ui/core/Button'

import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import withMobileDialog from '@material-ui/core/withMobileDialog'

import { EnclosuresType } from '../types'
import { enclosureOptions } from '../musicUtils'
import { FormControl, NativeSelect, Input, InputLabel } from '@material-ui/core'

type SubmitArgsType = {
  type: EnclosuresType
}

type EnclosuresModifierModalProps = {
  isOpen: boolean
  onClose: () => any
  onSubmit: (args: SubmitArgsType) => any
  defaultType?: EnclosuresType
}

type EnclosuresModifierModalState = {
  type: EnclosuresType
}

type EnclosuresOption = {
  title: string
  value: EnclosuresType
}

const EnclosuresOptions: EnclosuresOption[] = enclosureOptions.map(
  ({ type, title }) => ({
    title,
    value: type,
  }),
)

// @ts-ignore
class EnclosuresModifierModal extends React.Component<
  EnclosuresModifierModalProps & { fullScreen: boolean },
  EnclosuresModifierModalState
> {
  constructor(props) {
    super(props)

    this.state = {
      type: props.defaultType,
    }
  }

  handleSubmit = () => {
    this.props.onSubmit({
      type: this.state.type,
    })
  }

  handleTypeSelected = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as EnclosuresType
    console.log('type = ', type)
    this.setState({ type })
  }

  render() {
    return (
      <Dialog
        fullWidth={true}
        fullScreen={this.props.fullScreen}
        open={this.props.isOpen}
        onClose={this.handleSubmit}
        aria-labelledby="chromatic-approach-modifier-dialog"
      >
        <DialogTitle id="chromatic-approach-modifier-dialog">
          Enclosure
        </DialogTitle>

        <DialogContent>
          <FormControl className={css({ flex: 1, marginRight: '1rem' })}>
            <InputLabel htmlFor="enclosure-type-preset">
              Enclosure type
            </InputLabel>
            <NativeSelect
              value={this.state.type}
              onChange={this.handleTypeSelected}
              name="type"
              input={<Input id="enclosure-type-preset" />}
            >
              {EnclosuresOptions.map(({ title, value }) => (
                <option key={value} value={value}>
                  {title}
                </option>
              ))}
            </NativeSelect>
          </FormControl>
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

export default withMobileDialog<EnclosuresModifierModalProps>()(
  EnclosuresModifierModal,
)
