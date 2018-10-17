import * as React from 'react'
import * as _ from 'lodash'
import * as tonal from 'tonal'
import * as TonalRange from 'tonal-range'

import { default as MuButton } from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import withMobileDialog from '@material-ui/core/withMobileDialog'

import { Flex, Box, Button } from './ui'

import { getNoteCardColorByNoteName } from '../utils'

const chromaticNotes = TonalRange.chromatic(['C4', 'B4'], true)

type PickNoteModalProps = {
  isOpen: boolean
  onClose: () => any
  onSubmit: (args: { noteName: string }) => any
  selectedNoteName?: string
}

// @ts-ignore
const PickNoteModal: React.SFC<PickNoteModalProps> = (
  props: PickNoteModalProps & { fullScreen: boolean },
) => (
  <Dialog
    fullScreen={props.fullScreen}
    open={props.isOpen}
    onClose={props.onClose}
    aria-labelledby="pick-note-dialog"
  >
    <DialogTitle id="pick-note-dialog">Pick a note</DialogTitle>
    <DialogContent>
      <Flex flexWrap="wrap">
        {chromaticNotes.map(noteName => {
          return (
            <Box key={noteName} width={1 / 4} p={[1, 2, 2]}>
              <Button
                borderRadius={15}
                border={
                  props.selectedNoteName && noteName === props.selectedNoteName
                    ? '4px solid red'
                    : undefined
                }
                width={1}
                bg={getNoteCardColorByNoteName(noteName)}
                onClick={() => props.onSubmit({ noteName })}
              >
                {tonal.Note.pc(noteName)}
              </Button>
            </Box>
          )
        })}
      </Flex>
    </DialogContent>
    <DialogActions>
      <MuButton onClick={props.onClose} color="secondary">
        Cancel
      </MuButton>
      <MuButton onClick={props.onClose} color="primary" autoFocus>
        OK
      </MuButton>
    </DialogActions>
  </Dialog>
)

export default withMobileDialog<PickNoteModalProps>()(PickNoteModal)
