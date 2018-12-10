import * as React from 'react'
import * as _ from 'lodash'
import { css } from 'react-emotion'
import * as tonal from 'tonal'
import memoize from 'memoize-one'

import { default as MuButton } from '@material-ui/core/Button'

import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import withMobileDialog from '@material-ui/core/withMobileDialog'

import PlayIcon from '@material-ui/icons/PlayArrow'
import StopIcon from '@material-ui/icons/Stop'

import { EnclosuresType, StaffTick } from '../types'
import { enclosureOptions, enclosureByEnclosureType } from '../musicUtils'
import {
  FormControl,
  NativeSelect,
  Input,
  InputLabel,
  IconButton,
} from '@material-ui/core'
import NotesStaff from './NotesStaff'
import { Flex, Box } from './ui'
import settingsStore from '../services/settingsStore'

import {
  WithAudioEngineInjectedProps,
  withAudioEngine,
} from './withAudioEngine'

import AudioEngine, { AnimationCallback } from '../services/audioEngine'

const audioEngine = new AudioEngine()

type SubmitArgsType = {
  type: EnclosuresType
}

type EnclosuresModifierModalProps = {
  isOpen: boolean
  onClose: () => any
  onSubmit: (args: SubmitArgsType) => any
  defaultType?: EnclosuresType
}

type State = {
  type: EnclosuresType
  isPlaying: boolean
  activeTickIndex?: number
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
  EnclosuresModifierModalProps & {
    fullScreen: boolean
  } & WithAudioEngineInjectedProps,
  State
> {
  state: State = {
    type: this.props.defaultType || 'one down, one up',
    isPlaying: false,
  }

  handleSubmit = () => {
    audioEngine.stopLoop()
    this.props.onSubmit({
      type: this.state.type,
    })
  }

  handleTypeSelected = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as EnclosuresType
    console.log('type = ', type)
    this.setState({ type }, this.setPlaybackLoop)
  }

  generateStaffTicks = memoize(type => {
    const enclosureToUse =
      type === 'random'
        ? _.sample(enclosureOptions)!
        : enclosureByEnclosureType[type]

    const baseNote = 'C4'

    const enclosureNotes = enclosureToUse.semitones.map(semitoneStep => {
      // For notes above the base note, use flats
      if (semitoneStep > 0) {
        return tonal.Note.fromMidi(tonal.Note.midi(baseNote)! + semitoneStep)
      }
      // For notes above the base note, use sharps
      return tonal.Note.fromMidi(
        tonal.Note.midi(baseNote)! + semitoneStep,
        true,
      )
    })

    // TODO: reuse similar logic from musicUtils module
    let staffTicks: StaffTick[] = [
      ...enclosureNotes.map((noteName, index) => {
        return {
          id: `${index}`,
          notes: [
            {
              noteName,
              color: 'red',
              id: `${index}`,
              isMainNote: false,
              midi: tonal.Note.midi(noteName),
            },
          ],
        } as StaffTick
      }),
      {
        id: 'main',
        notes: [
          {
            noteName: baseNote,
            color: 'black',
            id: 'main',
            isMainNote: true,
            midi: tonal.Note.midi(baseNote),
          },
        ],
      } as StaffTick,
    ]

    return staffTicks
  })

  setPlaybackLoop = () => {
    const ticks: StaffTick[] = [
      ...this.generateStaffTicks(this.state.type),
      {
        id: 'rest',
        notes: [],
      },
    ]
    audioEngine.setAudioFont(this.props.audioFontId)
    audioEngine.setLoop(ticks)
    audioEngine.setAnimationCallback(this.animationCallback)
  }

  togglePlayback = () => {
    if (this.state.isPlaying) {
      audioEngine.stopLoop()
      this.setState({ isPlaying: false })
    } else {
      this.setPlaybackLoop()
      audioEngine.playLoop()
      this.setState({ isPlaying: true, activeTickIndex: 0 })
    }
  }

  animationCallback: AnimationCallback = ({ tick }) => {
    if (tick.notes.length > 0) {
      this.setState({ activeTickIndex: tick.meta.staffTickIndex })
    }
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
          <Box maxWidth={600} width={1} mx="auto">
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

            <Box>
              <Flex flexDirection="row" alignItems="center">
                <IconButton
                  color="secondary"
                  onClick={this.togglePlayback}
                  className={css(`margin-right: 0.5rem;`)}
                >
                  {this.state.isPlaying ? (
                    <StopIcon fontSize="large" />
                  ) : (
                    <PlayIcon fontSize="large" />
                  )}
                </IconButton>
                <NotesStaff
                  id="chord-preview"
                  clef={settingsStore.clefType}
                  activeTickIndex={
                    this.state.isPlaying
                      ? this.state.activeTickIndex
                      : undefined
                  }
                  ticks={this.generateStaffTicks(this.state.type)}
                  isPlaying={this.state.isPlaying}
                  showBreaks
                  containerProps={{ flex: '1' }}
                  maxLines={1}
                />
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

export default withAudioEngine(
  withMobileDialog<EnclosuresModifierModalProps>()(EnclosuresModifierModal),
)
