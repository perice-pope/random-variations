import * as React from 'react'
import { ThemeProvider } from 'emotion-theming'
import { withProps } from 'recompose'
import * as _ from 'lodash'
import Tone from 'tone'
import * as tonal from 'tonal'
import * as TonalRange from 'tonal-range'
import Modal from 'react-modal'

import { Flex, Box, Button, TextInput, Label } from './ui'
import NotesStaff from './NotesStaff'
import MeasureScreenSize from './MeasureScreenSize'

import { shuffle, arrayMove, getNoteCardColorByNoteName } from '../utils'

import theme from '../styles/theme'
import globalStyles from '../styles/globalStyles'

import NoteCards from './NoteCards'

import { NoteCardType, StaffNoteType } from '../types'
import PianoKeyboard from './PianoKeyboard'

Modal.setAppElement('#root')
globalStyles()

const BpmInput = withProps({
  p: [2, 2, 2],
  fontSize: [2, 3, 3],
  mx: [2, 2, 2],
  px: [2, 3, 3],
})(TextInput)

type AppState = {
  bpm: number
  isPlaying: boolean

  noteCards: NoteCardType[]
  staffNotes: StaffNoteType[]
  activeNoteCardIndex: number

  height: number
  width: number
  notesStaffWidth: number

  noteAddingModalIsOpen: boolean
  noteEditingModalIsOpen: boolean
  noteEditingModalNoteCard?: NoteCardType
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

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
  },
}

type PickNoteModalProps = {
  isOpen: boolean
  onClose: () => any
  onSubmit: (args: { noteName: string }) => any
  selectedNoteName?: string
}

const PickNoteModal: React.SFC<PickNoteModalProps> = (
  props: PickNoteModalProps,
) => (
  <Modal
    isOpen={props.isOpen}
    onRequestClose={props.onClose}
    style={customStyles}
    contentLabel="Edit card"
  >
    <h2>Pick a note</h2>
    <Flex flexWrap="wrap">
      {chromaticNotes.map(noteName => {
        return (
          <Box width={1 / 4} p={[1, 2, 2]}>
            <Button
              borderRadius={15}
              border={
                props.selectedNoteName && noteName === props.selectedNoteName
                  ? '4px solid red'
                  : undefined
              }
              width={1}
              key={noteName}
              bg={getNoteCardColorByNoteName(noteName)}
              onClick={() => props.onSubmit({ noteName })}
            >
              {tonal.Note.pc(noteName)}
            </Button>
          </Box>
        )
      })}
    </Flex>
  </Modal>
)

class App extends React.Component<{}, AppState> {
  private synth: any
  private scheduledEvents: any[] = []
  private notesStaffRef: React.RefObject<NotesStaff>
  private notesStaffContainerRef: React.RefObject<any>

  constructor(props) {
    super(props)

    const noteName = _.sample(chromaticNotes)
    const randomNoteCard = {
      id: '0',
      text: tonal.Note.pc(noteName),
      note: noteName,
      midi: tonal.Note.midi(noteName),
      color: getNoteCardColorByNoteName(noteName),
    }

    this.state = {
      // Screen size
      height: 0,
      width: 0,
      notesStaffWidth: 0,

      bpm: 120,
      isPlaying: false,
      noteCards: [randomNoteCard],
      staffNotes: [],
      activeNoteCardIndex: 0,

      noteAddingModalIsOpen: false,
      noteEditingModalIsOpen: false,
      noteEditingModalNoteCard: undefined,
    }

    this.notesStaffRef = React.createRef()
    this.notesStaffContainerRef = React.createRef()
  }

  componentDidMount() {
    this.initSynth()
    this.scheduleNotes()
    this.updateStaffNotes()
  }

  componentWillUnmount() {
    this.cleanUp()
  }

  updateStaffNotes = () => {
    const { noteCards } = this.state
    const staffNotes: StaffNoteType[] = noteCards.map(
      (noteCard, index) =>
        ({
          index,
          note: noteCard.note,
          midi: noteCard.midi,
          color: noteCard.color,
          duration: '4',
        } as StaffNoteType),
    )

    this.setState({ staffNotes }, this.renderNotation)
  }

  private getActiveStaffNote = () => {
    const { isPlaying, staffNotes, activeNoteCardIndex } = this.state
    if (!isPlaying) {
      return undefined
    }
    return staffNotes[activeNoteCardIndex]
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

    Tone.Transport.loopEnd = `0:${this.state.noteCards.length}`
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
      this.onNoteCardsUpdated,
    )
  }

  private onNoteCardsUpdated = () => {
    const hasBeenPlaying = this.state.isPlaying
    this.stopPlaying(() => {
      // Update loop length according to the number of note cards
      Tone.Transport.loopEnd = `0:${this.state.noteCards.length}`

      this.updateStaffNotes()

      if (hasBeenPlaying) {
        setTimeout(this.startPlaying, 200)
      }
    })
  }

  scheduleNote = (
    note: string,
    time: string = '0:0',
    duration: string = '4n',
  ) => {
    console.log(`Scheduling note: ${note} ${time}`)

    return Tone.Transport.schedule(contextTime => {
      if (this.synth) {
        this.synth.triggerAttackRelease(note, duration, contextTime)
      }

      Tone.Draw.schedule(() => this.drawAnimation(time), contextTime)
    }, Tone.Time(time))
  }

  drawAnimation = time => {
    console.log('drawAnimation', time, Tone.Transport.progress)
    if (time === '0:0' && this.state.activeNoteCardIndex === 0) {
      this.updateStaffNotes()
      return
    }

    this.setState(
      state => ({
        activeNoteCardIndex: state.isPlaying
          ? (state.activeNoteCardIndex + 1) % this.state.noteCards.length
          : state.activeNoteCardIndex,
      }),
      this.updateStaffNotes,
    )
  }

  scheduleNotes = () => {
    console.log('scheduleNotes is called\n---------\n')
    this.scheduledEvents.forEach(eventId => Tone.Transport.clear(eventId))

    this.state.noteCards.forEach(({ note }, index) => {
      this.scheduledEvents.push(
        this.scheduleNote(note, `${Math.floor(index / 4)}:${index % 4}`),
      )
    })
  }

  startPlaying = () => {
    this.scheduleNotes()
    this.setState({ isPlaying: true }, () => {
      Tone.Master.mute = false
      Tone.Transport.start()
    })
  }

  stopPlaying = (cb?: () => any) => {
    this.setState({ isPlaying: false, activeNoteCardIndex: 0 }, () => {
      Tone.Master.mute = true
      Tone.Transport.stop()

      this.updateStaffNotes()

      if (cb) {
        cb()
      }
    })
  }

  togglePlayback = () => {
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
      this.setState({
        bpm: bpmValue,
      })
    }
  }

  private handleNoteCardClick = (noteCard: NoteCardType) => {
    this.setState({
      noteEditingModalIsOpen: true,
      noteEditingModalNoteCard: noteCard,
    })
  }

  private handleNoteCardDraggedOut = (noteCard: NoteCardType) => {
    this.setState(
      {
        noteCards: this.state.noteCards.filter(nc => nc !== noteCard),
      },
      this.onNoteCardsUpdated,
    )
  }

  private handleCardsReorder = ({ oldIndex, newIndex }) => {
    this.setState(
      {
        noteCards: arrayMove(this.state.noteCards, oldIndex, newIndex),
      },
      this.onNoteCardsUpdated,
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
      this.onNoteCardsUpdated,
    )
  }

  private handleNoteClickInNoteCardAddingModal = ({ noteName }) => {
    const newNoteCards = [
      ...this.state.noteCards,
      {
        id: `${this.state.noteCards.length}`,
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
      this.onNoteCardsUpdated,
    )
  }

  public render() {
    const { bpm, noteCards, isPlaying, activeNoteCardIndex } = this.state

    const activeNoteCard = isPlaying
      ? noteCards[activeNoteCardIndex]
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
              <Flex
                pt={[2, 3, 4]}
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
                      bg={isPlaying ? 'red' : 'green'}
                      m={[1, 2]}
                      onClick={this.togglePlayback}
                    >
                      {isPlaying ? 'Stop' : 'Play'}
                    </Button>

                    <Button
                      title="Shuffle note cards"
                      m={[1, 2]}
                      onClick={this.handleShuffleClick}
                    >
                      Shuffle!
                    </Button>
                  </Box>

                  <Label for="bpm" fontSize={[2, 3, 3]}>
                    BPM:
                  </Label>
                  <BpmInput
                    id="bpm"
                    type="number"
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
                    onNoteCardClick={this.handleNoteCardClick}
                    onCardsReorder={this.handleCardsReorder}
                    onCardDraggedOut={this.handleNoteCardDraggedOut}
                  >
                    {this.state.noteCards.length < 12 ? (
                      <Button
                        onClick={this.openNoteAddingModal}
                        title="Add a note"
                        bg="rgba(1,1,1,0)"
                        border="dashed 2px #c0c3c7"
                        borderRadius={40}
                        color="#777777"
                        maxHeight={120}
                        alignSelf="center"
                        opacity={0}
                      >
                        + Add note
                      </Button>
                    ) : null}
                  </NoteCards>
                </Flex>

                <Box innerRef={this.notesStaffContainerRef} width={1}>
                  <NotesStaff
                    notes={this.state.staffNotes}
                    activeNote={this.getActiveStaffNote()}
                    width={this.state.notesStaffWidth}
                    ref={this.notesStaffRef}
                    height={160}
                  />
                </Box>
              </Flex>

              <Box mt={[1, 2, 3]}>
                <PianoKeyboard
                  width={Math.max(layoutMinWidth, this.state.width)}
                  height={this.getPianoHeight()}
                  activeNotesMidi={
                    activeNoteCard ? [activeNoteCard.midi] : undefined
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
