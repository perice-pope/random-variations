import * as React from 'react'
import * as _ from 'lodash'
import * as tonal from 'tonal'
import * as TonalRange from 'tonal-range'

import PianoKeyboard from './PianoKeyboard'

import { default as MuButton } from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import withMobileDialog, {
  InjectedProps,
} from '@material-ui/core/withMobileDialog'

import { Flex, Box, Button } from './ui'

import { getNoteCardColorByNoteName } from '../utils'

const chromaticNotes = TonalRange.chromatic(['C4', 'B4'], true)

type PickNoteModalProps = {
  isOpen: boolean
  onClose: () => any
  onSubmit: (args: { noteName: string }) => any
  noteName?: string
}

type PickNoteModalState = {
  noteName?: string
  notePitchClass?: string
}

// @ts-ignore
class PickNoteModal extends React.Component<
  PickNoteModalProps & InjectedProps,
  PickNoteModalState
> {
  constructor(props) {
    super(props)
    this.state = {
      noteName: props.noteName,
      notePitchClass: tonal.Note.pc(props.noteName),
    }
  }

  submit = () => {
    if (this.state.noteName) {
      this.props.onSubmit({ noteName: this.state.noteName })
    }
  }

  onNoteSelected = noteName => {
    this.setState({ noteName, notePitchClass: tonal.Note.pc(noteName) })
  }

  render() {
    return (
      <Dialog
        fullScreen={this.props.fullScreen}
        open={this.props.isOpen}
        onClose={this.submit}
        aria-labelledby="pick-note-dialog"
      >
        <DialogTitle id="pick-note-dialog">Pick a note</DialogTitle>
        <DialogContent>
          <Flex flexDirection="column" alignItems="center">
            <Flex flexWrap="wrap" flex={1}>
              {chromaticNotes.map(noteName => {
                return (
                  <Box key={noteName} width={1 / 4} p={[1, 2, 2]}>
                    <Button
                      borderRadius={15}
                      border={
                        tonal.Note.pc(noteName) === this.state.notePitchClass
                          ? '4px solid red'
                          : '4px solid transparent'
                      }
                      width={1}
                      bg={getNoteCardColorByNoteName(noteName)}
                      onClick={() => this.onNoteSelected(noteName)}
                    >
                      {tonal.Note.pc(noteName)}
                    </Button>
                  </Box>
                )
              })}
            </Flex>

            <Box mt={[3, 3, 3]} width={1}>
              <PianoKeyboard
                height={100}
                onPlayNote={midiNote => {
                  this.onNoteSelected(tonal.Note.fromMidi(midiNote, true))
                }}
                primaryNotesMidi={
                  this.state.noteName
                    ? [tonal.Note.midi(this.state.noteName)]
                    : undefined
                }
                notesColor={
                  this.state.noteName
                    ? getNoteCardColorByNoteName(this.state.noteName)
                    : undefined
                }
              />
            </Box>
          </Flex>
        </DialogContent>
        <DialogActions>
          <MuButton onClick={this.props.onClose} color="secondary">
            Cancel
          </MuButton>
          <MuButton
            disabled={!this.state.noteName}
            onClick={this.submit}
            color="primary"
            autoFocus
          >
            OK
          </MuButton>
        </DialogActions>
      </Dialog>
    )
  }
}

export default withMobileDialog<PickNoteModalProps>()(PickNoteModal)
