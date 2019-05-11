import * as React from 'react'
import * as _ from 'lodash'
import { css } from 'react-emotion'
import * as tonal from 'tonal'
import memoize from 'memoize-one'

import Button, { default as MuButton } from '@material-ui/core/Button'

import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import withMobileDialog from '@material-ui/core/withMobileDialog'
import ArrowsIcon from '@material-ui/icons/Cached'

import PlayIcon from '@material-ui/icons/PlayArrow'
import StopIcon from '@material-ui/icons/Stop'

import { EnclosuresType, StaffTick } from '../../types'
import {
  enclosureOptions,
  enclosureByEnclosureType,
  getConcertPitchMidi,
} from '../../musicUtils'
import {
  FormControl,
  NativeSelect,
  Input,
  IconButton,
  Typography,
  InputLabel,
} from '@material-ui/core'
import NotesStaff from '../NotesStaff'
import { Flex, Box } from '../ui'
import settingsStore from '../../services/settingsStore'

import {
  WithAudioEngineInjectedProps,
  withAudioEngine,
} from '../withAudioEngine'

import AudioEngine, {
  TickCallback,
  ChannelAudioContent,
  SoundEvent,
} from '../../services/audioEngine'
import Tooltip from '../ui/Tooltip'
import sessionStore from '../../services/sessionStore'
import { channelId } from '../../utils/channels'

const audioEngine = new AudioEngine()

type SubmitArgsType = {
  type: EnclosuresType
}

type EnclosuresModifierModalProps = {
  isOpen: boolean
  onClose: () => any
  onSubmit: (args: SubmitArgsType) => any
  defaultType?: EnclosuresType
  baseNote?: string
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
  static defaultProps: Partial<EnclosuresModifierModalProps> = {
    baseNote: 'C4',
  }

  state: State = {
    type: this.props.defaultType || 'one down, one up',
    isPlaying: false,
  }

  handleClose = () => {
    audioEngine.stopLoop()
    this.setState({ isPlaying: false })
    this.props.onClose()
  }

  handleSubmit = () => {
    audioEngine.stopLoop()
    this.setState({ isPlaying: false })
    this.props.onSubmit({ type: this.state.type })
  }

  handleTypeSelected = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as EnclosuresType
    this.setState({ type }, this.setPlaybackLoop)
  }

  generateStaffTicks = memoize((type, baseNote) => {
    const enclosureToUse =
      type === 'random'
        ? _.sample(enclosureOptions)!
        : enclosureByEnclosureType[type]

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
              color: 'black',
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
            color: 'red',
            id: 'main',
            isMainNote: true,
            midi: tonal.Note.midi(baseNote),
          },
        ],
      } as StaffTick,
    ]

    return staffTicks.map(st => ({
      ...st,
      notes: st.notes.map(n => ({
        ...n,
        midi: getConcertPitchMidi(
          sessionStore.activeSession!.instrumentTransposing,
          n.midi,
        ),
      })),
    }))
  })

  setPlaybackLoop = () => {
    const staffTicks: StaffTick[] = [
      ...this.generateStaffTicks(this.state.type, this.props.baseNote),
      {
        id: 'rest',
        notes: [],
      },
    ]
    const audioFontId = settingsStore.audioFontId
    const notesChannelAudioContent: ChannelAudioContent<{
      staffTickIndex: number
    }> = {
      loop: {
        startAt: 0,
        endAt: staffTicks.length - 1,
      },
      startAt: 0,
      events: staffTicks.map(
        (tick, staffTickIndex) =>
          ({
            sounds: tick.notes.map(note => ({ midi: note.midi, audioFontId })),
            data: { staffTickIndex },
          } as SoundEvent<{ staffTickIndex: number }>),
      ),
      playbackRate: 1,
    }
    audioEngine.setAudioContent({ [channelId.NOTES]: notesChannelAudioContent })
    audioEngine.setTickCallback(this.tickCallback)
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

  tickCallback: TickCallback = ({
    event,
  }: {
    event: SoundEvent<{ staffTickIndex: number }>
  }) => {
    if (event.data) {
      this.setState({ activeTickIndex: event.data.staffTickIndex })
    }
  }

  handleSelectRandomType = () => {
    const type = _.sample(enclosureOptions)!.type as EnclosuresType
    this.setState({ type }, this.setPlaybackLoop)
  }

  render() {
    if (!this.props.isOpen) {
      return null
    }

    return (
      <Dialog
        fullWidth={true}
        fullScreen={this.props.fullScreen}
        open={this.props.isOpen}
        maxWidth="sm"
        scroll="paper"
        onClose={this.handleSubmit}
        aria-labelledby="chromatic-approach-modifier-dialog"
      >
        <DialogContent>
          <Box>
            <Typography variant="h5">Enclosures</Typography>
            <Typography variant="subtitle2">
              Add enclosure notes for the base note in each measure
            </Typography>

            <Box mt={3}>
              <div
                className={css(`
                display: flex;
                flex-direction: row;
                align-items: flex-end;
                
                @media screen and (max-width: 500px) {
                  flex-direction: column;
                  align-items: stretch;
                }
              `)}
              >
                <div className={css(`flex: 1; margin-top: 7px;`)}>
                  <FormControl
                    fullWidth
                    className={css({ flex: 1, marginRight: '1rem' })}
                  >
                    <InputLabel htmlFor="enclosure-type-preset">
                      Enclosure type
                    </InputLabel>
                    <NativeSelect
                      fullWidth
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
                </div>

                <Tooltip title="Choose random enclosure">
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={this.handleSelectRandomType}
                    className={css(`
                      margin-left: 0.5rem;
                      @media screen and (max-width: 500px) {
                        margin-left: 0;
                        margin-top: 0.5rem;
                      }
                    `)}
                  >
                    <ArrowsIcon
                      fontSize="small"
                      className={css(`margin-right: 0.5rem;`)}
                    />
                    Random
                  </Button>
                </Tooltip>
              </div>
            </Box>

            <Box>
              <Flex flexDirection="row" alignItems="center">
                <IconButton
                  color="secondary"
                  onClick={this.togglePlayback}
                  className={css(`margin-left: -1rem; margin-right: 0.5rem;`)}
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
                  ticks={this.generateStaffTicks(
                    this.state.type,
                    this.props.baseNote,
                  )}
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
          <MuButton onClick={this.handleClose} color="secondary">
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
  withMobileDialog<EnclosuresModifierModalProps>({ breakpoint: 'xs' })(
    EnclosuresModifierModal,
  ),
)
