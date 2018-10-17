import * as React from 'react'
import { ThemeProvider } from 'emotion-theming'
import { css } from 'react-emotion'
import { withProps } from 'recompose'
import * as _ from 'lodash'
import Tone from 'tone'
import * as tonal from 'tonal'
import * as TonalRange from 'tonal-range'
import { transpose } from 'tonal-distance'
import uuid from 'uuid/v4'

import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import IconButton from '@material-ui/core/IconButton'
import MenuIcon from '@material-ui/icons/Menu'
import PlayIcon from '@material-ui/icons/PlayArrow'
import StopIcon from '@material-ui/icons/Stop'
import ArrowsIcon from '@material-ui/icons/Cached'
import TextField from '@material-ui/core/TextField'
import InputAdornment from '@material-ui/core/InputAdornment'

import { Flex, Box, Button } from './ui'
import NotesStaff from './NotesStaff'
import MeasureScreenSize from './MeasureScreenSize'

import { shuffle, arrayMove, getNoteCardColorByNoteName } from '../utils'

import theme from '../styles/theme'
import globalStyles from '../styles/globalStyles'

import NoteCards from './NoteCards'

import { NoteCardType, StaffNoteType } from '../types'
import PickNoteModal from './PickNoteModal'
import PianoKeyboard from './PianoKeyboard'

import AddEntityButton from './AddEntityButton'

globalStyles()

type AppState = {
  bpm: number
  isPlaying: boolean

  noteCards: NoteCardType[]
  staffNotes: StaffNoteType[]
  activeNoteCardIndex: number
  activeStaffNoteIndex: number

  height: number
  width: number
  notesStaffWidth: number

  noteAddingModalIsOpen: boolean
  noteEditingModalIsOpen: boolean
  noteEditingModalNoteCard?: NoteCardType

  areTriadsEnabled: boolean
}

const chromaticNotes = TonalRange.chromatic(['C4', 'B4'], true)

const layoutMinWidth = 320

// @ts-ignore
const ContentContainer = withProps({
  mx: 'auto',
  maxWidth: '960px',
  height: '100%',
  width: 1,
  px: 4,
  // @ts-ignore
})(Box)

class App extends React.Component<{}, AppState> {
  private synth: any
  private scheduledEvents: any[] = []
  private notesStaffRef: React.RefObject<NotesStaff>
  private notesStaffContainerRef: React.RefObject<any>

  constructor(props) {
    super(props)

    let restoredState: Partial<AppState> = {}

    const noteName = _.sample(chromaticNotes)
    const randomNoteCard = {
      id: uuid(),
      text: tonal.Note.pc(noteName),
      note: noteName,
      midi: tonal.Note.midi(noteName),
      color: getNoteCardColorByNoteName(noteName),
    }

    const savedState = window.localStorage.getItem('appState')
    if (savedState) {
      try {
        restoredState = JSON.parse(savedState) as Partial<AppState>
      } catch (error) {
        console.error(error)
        window.localStorage.removeItem('appState')
      }
    }

    this.state = {
      bpm: 120,
      noteCards: [randomNoteCard],
      areTriadsEnabled: false,

      // Screen size
      height: 0,
      width: 0,
      notesStaffWidth: 0,

      isPlaying: false,
      staffNotes: [],
      activeNoteCardIndex: 0,
      activeStaffNoteIndex: 0,

      noteAddingModalIsOpen: false,
      noteEditingModalIsOpen: false,
      noteEditingModalNoteCard: undefined,

      ...restoredState,
    }

    this.notesStaffRef = React.createRef()
    this.notesStaffContainerRef = React.createRef()
  }

  componentDidMount() {
    this.init()
  }

  componentWillUnmount() {
    this.cleanUp()
  }

  private init = async () => {
    await this.updateStaffNotes()
    this.initSynth()
    this.scheduleNotes()
  }

  private updateStaffNotes = async () => {
    const { noteCards } = this.state
    const staffNotes: StaffNoteType[] = _.flatten(
      noteCards.map(noteCard => {
        const result: any[] = []

        let note = noteCard.note

        result.push({
          note: note,
          midi: tonal.Note.midi(note),
          freq: tonal.Note.freq(note),
          color: noteCard.color,
          duration: '4',
        })

        if (this.state.areTriadsEnabled) {
          note = transpose(note, '3M')
          result.push({
            note: note,
            midi: tonal.Note.midi(note),
            freq: tonal.Note.freq(note),
            color: 'black',
            duration: '4',
          })
          note = transpose(note, '3m')
          result.push({
            note: note,
            midi: tonal.Note.midi(note),
            freq: tonal.Note.freq(note),
            color: 'black',
            duration: '4',
          })
        }
        return result
      }),
    ).map((v, index) => ({ ...v, index }))

    return new Promise(resolve => {
      this.setState({ staffNotes }, () => {
        this.renderNotation()
        resolve()
      })
    })
  }

  private getActiveStaffNote = () => {
    const { isPlaying, staffNotes, activeStaffNoteIndex } = this.state
    if (!isPlaying) {
      return undefined
    }
    return staffNotes[activeStaffNoteIndex]
  }

  private getPianoHeight = () => {
    const { height } = this.state
    if (height > 600) {
      return 200
    }
    if (height > 300) {
      return 130
    }
    return 80
  }

  private initSynth = () => {
    this.cleanUp()

    this.synth = new Tone.PolySynth(10, Tone.Synth, {
      oscillator: {
        partials: [0, 2, 3, 4],
      },
    }).toMaster()

    Tone.Transport.loopEnd = `0:${this.state.staffNotes.length}`
    Tone.Transport.loop = true

    Tone.Transport.bpm.value = this.state.bpm
  }

  private cleanUp = () => {
    if (this.synth) {
      this.synth.disconnect(Tone.Master)
      this.synth.dispose()
      this.synth = null
    }
  }

  private handleShuffleClick = () => {
    this.setState(
      state => ({
        noteCards: [state.noteCards[0], ...shuffle(state.noteCards.slice(1))],
      }),
      this.onNotesUpdated,
    )
  }

  private serializeAndSaveAppStateLocally = () => {
    window.localStorage.setItem(
      'appState',
      JSON.stringify({
        bpm: this.state.bpm,
        noteCards: this.state.noteCards,
        areTriadsEnabled: this.state.areTriadsEnabled,
      }),
    )
  }

  private onNotesUpdated = () => {
    console.log('onNotesUpdated')
    const hasBeenPlaying = this.state.isPlaying

    this.serializeAndSaveAppStateLocally()

    this.stopPlaying(async () => {
      await this.updateStaffNotes()

      if (hasBeenPlaying) {
        setTimeout(this.startPlaying, 200)
      }
    })
  }

  scheduleNote = (
    freq: number,
    time: string = '0:0',
    duration: string = '4n',
  ) => {
    console.log('sheduleNote', freq, time, duration)
    return Tone.Transport.schedule(contextTime => {
      if (this.synth) {
        this.synth.triggerAttackRelease(freq, duration, contextTime)
      }

      Tone.Draw.schedule(() => this.drawAnimation(time), contextTime)
    }, Tone.Time(time))
  }

  drawAnimation = time => {
    console.log('drawAnimation', time, Tone.Transport.progress)

    this.setState(state => {
      if (time === '0:0' && state.activeStaffNoteIndex === 0) {
        return null
      }
      if (!state.isPlaying) {
        return null
      }

      const nextStaffNoteIndex =
        (state.activeStaffNoteIndex + 1) % this.state.staffNotes.length
      const nextNoteCardIndex = state.areTriadsEnabled
        ? Math.floor(nextStaffNoteIndex / 3)
        : nextStaffNoteIndex
      return {
        activeStaffNoteIndex: nextStaffNoteIndex,
        activeNoteCardIndex: nextNoteCardIndex,
      }
    }, this.updateStaffNotes)
  }

  scheduleNotes = () => {
    console.log('scheduleNotes is called\n---------\n')
    // Update loop length according to the number of note cards
    Tone.Transport.loopEnd = `0:${this.state.staffNotes.length}`
    this.scheduledEvents.forEach(eventId => Tone.Transport.clear(eventId))

    this.state.staffNotes.forEach(({ freq }, index) => {
      this.scheduledEvents.push(
        this.scheduleNote(freq, `${Math.floor(index / 4)}:${index % 4}`),
      )
    })
  }

  startPlaying = () => {
    console.log('startPlaying')
    this.scheduleNotes()
    this.setState({ isPlaying: true }, () => {
      Tone.Master.volume.rampTo(1, 100)
      Tone.Transport.start()
    })
  }

  stopPlaying = (cb?: () => any) => {
    console.log('stopPlaying')
    if (!this.state.isPlaying) {
      if (cb) {
        cb()
      }
      return
    }

    this.setState(
      { isPlaying: false, activeNoteCardIndex: 0, activeStaffNoteIndex: 0 },
      async () => {
        Tone.Master.volume.rampTo(0)
        Tone.Transport.stop()

        await this.updateStaffNotes()

        if (cb) {
          cb()
        }
      },
    )
  }

  togglePlayback = () => {
    console.log('togglePlayback')
    if (this.state.isPlaying) {
      this.stopPlaying()
    } else {
      this.startPlaying()
    }
  }

  handleBpmChange = e => {
    let bpmValue = this.state.bpm
    try {
      if (!e.target.value) {
        bpmValue = 0
      } else {
        bpmValue = parseInt(e.target.value, 10)
        if (isNaN(bpmValue)) {
          bpmValue = 0
        }
      }
    } finally {
      Tone.Transport.bpm.value = bpmValue
      this.setState(
        {
          bpm: bpmValue,
        },
        this.serializeAndSaveAppStateLocally,
      )
    }
  }

  private handleEditCardClick = (noteCard: NoteCardType) => {
    this.setState({
      noteEditingModalIsOpen: true,
      noteEditingModalNoteCard: noteCard,
    })
  }

  private handleDeleteCardClick = (noteCard: NoteCardType) =>
    this.deleteNoteCard(noteCard)

  private handleNoteCardDraggedOut = (noteCard: NoteCardType) =>
    this.deleteNoteCard(noteCard)

  private deleteNoteCard = (noteCard: NoteCardType) => {
    this.setState(
      {
        noteCards: this.state.noteCards.filter(nc => nc !== noteCard),
      },
      this.onNotesUpdated,
    )
  }

  private handleCardsReorder = ({ oldIndex, newIndex }) => {
    this.setState(
      {
        noteCards: arrayMove(this.state.noteCards, oldIndex, newIndex),
      },
      this.onNotesUpdated,
    )
  }

  private handleScreenSizeUpdate = ({ height, width }) => {
    if (this.notesStaffContainerRef.current) {
      const {
        width: notesStaffWidth,
      } = this.notesStaffContainerRef.current.getBoundingClientRect()
      this.setState({ notesStaffWidth })
    }
    this.setState({ height, width }, this.renderNotation)
  }

  private renderNotation = () => {
    if (this.notesStaffRef.current) {
      this.notesStaffRef.current.draw()
    }
  }

  private closeNoteEditingModal = () => {
    this.setState({
      noteEditingModalIsOpen: false,
      noteEditingModalNoteCard: undefined,
    })
  }

  private closeNoteAddingModal = () => {
    this.setState({
      noteAddingModalIsOpen: false,
    })
  }

  private openNoteAddingModal = () => {
    this.setState({
      noteAddingModalIsOpen: true,
    })
  }

  private handleNoteClickInNoteCardEditingModal = ({ noteName }) => {
    const newNoteCards = this.state.noteCards.map(noteCard => {
      if (noteCard !== this.state.noteEditingModalNoteCard) {
        return noteCard
      }

      return {
        ...noteCard,
        text: tonal.Note.pc(noteName),
        note: noteName,
        midi: tonal.Note.midi(noteName),
        color: getNoteCardColorByNoteName(noteName),
      }
    })

    this.setState(
      {
        noteCards: newNoteCards,
        noteEditingModalIsOpen: false,
        noteEditingModalNoteCard: undefined,
      },
      this.onNotesUpdated,
    )
  }

  private handleNoteClickInNoteCardAddingModal = ({ noteName }) => {
    const newNoteCards = [
      ...this.state.noteCards,
      {
        id: uuid(),
        text: tonal.Note.pc(noteName),
        note: noteName,
        midi: tonal.Note.midi(noteName),
        color: getNoteCardColorByNoteName(noteName),
      },
    ]

    this.setState(
      {
        noteCards: newNoteCards,
        noteAddingModalIsOpen: false,
      },
      this.onNotesUpdated,
    )
  }

  private toggleTriads = () => {
    this.setState(
      state => ({ areTriadsEnabled: !state.areTriadsEnabled }),
      this.onNotesUpdated,
    )
  }

  public render() {
    const {
      bpm,
      noteCards,
      staffNotes,
      isPlaying,
      activeNoteCardIndex,
      activeStaffNoteIndex,
    } = this.state

    const activeNoteCard = isPlaying
      ? noteCards[activeNoteCardIndex]
      : undefined
    const activeStaffNote = isPlaying
      ? staffNotes[activeStaffNoteIndex]
      : undefined

    return (
      <ThemeProvider theme={theme}>
        <>
          <MeasureScreenSize onUpdate={this.handleScreenSizeUpdate} fireOnMount>
            <Flex
              height="100vh"
              width="100vw"
              alignItems="center"
              justifyContent="center"
              css="overflow: hidden;"
              flexDirection="column"
            >
              <AppBar position="static">
                <Toolbar variant="dense">
                  <IconButton color="inherit" aria-label="Menu">
                    <MenuIcon />
                  </IconButton>
                  <Typography variant="h6" color="inherit">
                    Random Variations
                  </Typography>
                </Toolbar>
              </AppBar>
              <Flex
                pt={[3, 3, 4]}
                flex={1}
                px={[3]}
                width={1}
                maxWidth={960}
                justifyContent="center"
                alignItems="center"
                flexDirection="column"
              >
                <Flex alignItems="center" flexDirection="row" mb={3} width={1}>
                  <Box flex="1">
                    <Button
                      title={isPlaying ? 'Stop' : 'Play'}
                      bg={isPlaying ? 'red' : '#00c200'}
                      m={[1, 2]}
                      onClick={this.togglePlayback}
                    >
                      {isPlaying ? (
                        <StopIcon className={css({ marginRight: '0.5rem' })} />
                      ) : (
                        <PlayIcon className={css({ marginRight: '0.5rem' })} />
                      )}
                      {isPlaying ? 'Stop' : 'Play'}
                    </Button>

                    <Button
                      variant="contained"
                      title="Shuffle note cards"
                      m={[1, 2]}
                      onClick={this.handleShuffleClick}
                    >
                      <ArrowsIcon className={css({ marginRight: '0.5rem' })} />
                      Shuffle!
                    </Button>
                  </Box>

                  <TextField
                    className={css({ maxWidth: '100px' })}
                    label="Tempo"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">BPM</InputAdornment>
                      ),
                    }}
                    id="bpm"
                    type="number"
                    // @ts-ignore
                    step="1"
                    min="0"
                    max="400"
                    value={`${bpm}`}
                    onChange={this.handleBpmChange}
                  />
                </Flex>

                <Flex
                  flex={2}
                  alignItems="center"
                  maxHeight={400}
                  width={1}
                  maxWidth={700}
                >
                  <NoteCards
                    noteCards={noteCards}
                    activeNoteCard={activeNoteCard}
                    onEditClick={this.handleEditCardClick}
                    onDeleteClick={this.handleDeleteCardClick}
                    onCardsReorder={this.handleCardsReorder}
                    onCardDraggedOut={this.handleNoteCardDraggedOut}
                  >
                    {this.state.noteCards.length < 12 ? (
                      <Flex
                        p={3}
                        width={1 / 4}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <AddEntityButton
                          onAddSingleNoteClick={this.openNoteAddingModal}
                          onAddArpeggioClick={this.toggleTriads}
                          buttonProps={{
                            disabled: isPlaying,
                          }}
                        />
                      </Flex>
                    ) : null}
                  </NoteCards>
                </Flex>

                <Box innerRef={this.notesStaffContainerRef} width={1}>
                  <NotesStaff
                    notes={this.state.staffNotes}
                    activeNote={this.getActiveStaffNote()}
                    ref={this.notesStaffRef}
                    height={160}
                    width={this.state.notesStaffWidth}
                  />
                </Box>
              </Flex>

              <Box mt={[1, 2, 3]}>
                <PianoKeyboard
                  width={Math.max(layoutMinWidth, this.state.width)}
                  height={this.getPianoHeight()}
                  activeNotesMidi={
                    activeStaffNote ? [activeStaffNote.midi] : undefined
                  }
                  activeNotesColor={
                    activeNoteCard ? activeNoteCard.color : undefined
                  }
                />
              </Box>

              <PickNoteModal
                isOpen={this.state.noteAddingModalIsOpen}
                onClose={this.closeNoteAddingModal}
                onSubmit={this.handleNoteClickInNoteCardAddingModal}
              />

              <PickNoteModal
                isOpen={this.state.noteEditingModalIsOpen}
                selectedNoteName={
                  this.state.noteEditingModalNoteCard
                    ? this.state.noteEditingModalNoteCard.note
                    : undefined
                }
                onClose={this.closeNoteEditingModal}
                onSubmit={this.handleNoteClickInNoteCardEditingModal}
              />
            </Flex>
          </MeasureScreenSize>
        </>
      </ThemeProvider>
    )
  }
}

export default App
