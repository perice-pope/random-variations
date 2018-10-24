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

import { Flex, Box, BaseButton, Paper, BaseButtonProps } from './ui'

import { getNoteCardColorByNoteName } from '../utils'
import { EnharmonicFlatsMap, ChromaticNoteSharps } from 'src/types'
import { css } from 'emotion'
import { lighten } from 'polished'
import { withAudioEngine } from './withAudioEngine'
import AudioEngine from './services/audioEngine'
import styled from 'react-emotion'

const chromaticNotes = TonalRange.chromatic(['C4', 'B4'], true)

type PickNoteModalProps = {
  audioEngine: AudioEngine
  isOpen: boolean
  enharmonicFlatsMap: EnharmonicFlatsMap
  onClose: () => any
  onSubmit: (args: { noteName: string }) => any
  onEnharmonicFlatsMapToggle?: (notePitch: ChromaticNoteSharps) => any
  noteName?: string
}

type PickNoteModalState = {
  noteName?: string
  notePitchName?: string
  enharmonicFlatsMap: EnharmonicFlatsMap
}

type NoteButtonProps = {
  active: boolean
} & BaseButtonProps

const NoteButton = styled(BaseButton)<NoteButtonProps>`
  transition: all 200ms;
  transform: ${({ active }) => (active ? 'scale(1.2)' : 'none')};

  background-color: ${({ active, bg }) =>
    active ? lighten(0.1, bg as string) : bg};

  ${({ active, bg }) => (active ? lighten(0.1, bg as string) : bg)};
`

// @ts-ignore
class PickNoteModal extends React.Component<
  PickNoteModalProps & InjectedProps,
  PickNoteModalState
> {
  constructor(props) {
    super(props)
    this.state = {
      noteName: props.noteName,
      notePitchName: tonal.Note.pc(props.noteName),
      enharmonicFlatsMap: this.props.enharmonicFlatsMap,
    }
  }

  submit = () => {
    if (this.state.noteName) {
      this.props.onSubmit({ noteName: this.state.noteName })
    }
  }

  onNoteSelected = (noteName: string) => {
    const noteEnharmonicName = tonal.Note.enharmonic(noteName)

    if (noteName !== noteEnharmonicName && this.state.noteName === noteName) {
      // This is a second click on a card with "enharmonic-capable" note...
      // this.props.onEnharmonicChange(noteNameWithSharp)
      const noteNameWithSharp = noteName.includes('#')
        ? noteName
        : noteEnharmonicName
      const notePitchWithSharp = tonal.Note.pc(noteNameWithSharp)

      this.setState({
        noteName: noteEnharmonicName,
        notePitchName: tonal.Note.pc(noteEnharmonicName),
        enharmonicFlatsMap: {
          ...this.state.enharmonicFlatsMap,
          [notePitchWithSharp]: !Boolean(
            this.state.enharmonicFlatsMap[notePitchWithSharp],
          ),
        },
      })

      if (this.props.onEnharmonicFlatsMapToggle) {
        this.props.onEnharmonicFlatsMapToggle(notePitchWithSharp)
      }

      return
    }

    this.setState({
      noteName: noteName,
      notePitchName: tonal.Note.pc(noteName),
    })
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
        <DialogContent
          className={css({ display: 'flex', alignItems: 'center' })}
        >
          <Flex flexDirection="column" alignItems="center" width={1} flex={1}>
            <Flex flexWrap="wrap" flex={1}>
              {chromaticNotes.map(noteNameWithSharp => {
                const notePitchWithSharp = tonal.Note.pc(noteNameWithSharp)

                const shouldUseFlat =
                  this.state.enharmonicFlatsMap[notePitchWithSharp] === true

                const noteName = shouldUseFlat
                  ? tonal.Note.enharmonic(noteNameWithSharp)
                  : noteNameWithSharp

                const notePitch = tonal.Note.pc(noteName)

                const isSelected = notePitch === this.state.notePitchName
                const bgColor = getNoteCardColorByNoteName(noteName)

                return (
                  <Box key={noteNameWithSharp} width={1 / 4} p={[1, 2, 2]}>
                    <NoteButton
                      // @ts-ignore
                      component={Paper}
                      active={isSelected}
                      fontWeight="bold"
                      fontSize={[2, 3, 3]}
                      p={[2, 2, 3]}
                      bg={bgColor}
                      hoverBg={isSelected ? bgColor : undefined}
                      borderRadius={15}
                      width={1}
                      onClick={() => {
                        this.onNoteSelected(noteName)
                        this.props.audioEngine.playNote(
                          {
                            midi: tonal.Note.midi(noteName),
                          },
                          0,
                          1.0,
                        )
                      }}
                    >
                      {notePitch}
                    </NoteButton>
                  </Box>
                )
              })}
            </Flex>

            <Box mt={4} width={1}>
              <PianoKeyboard
                height={100}
                onPlayNote={midiNote => {
                  const noteNameWithSharp = tonal.Note.fromMidi(midiNote, true)
                  const notePitchWithSharp = tonal.Note.pc(noteNameWithSharp)
                  const noteName = this.state.enharmonicFlatsMap[
                    notePitchWithSharp
                  ]
                    ? tonal.Note.enharmonic(noteNameWithSharp)
                    : noteNameWithSharp
                  this.onNoteSelected(noteName)
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

export default withAudioEngine(
  withMobileDialog<PickNoteModalProps>()(PickNoteModal),
)
