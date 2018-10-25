import * as React from 'react'
import { ThemeProvider } from 'emotion-theming'
import { css } from 'react-emotion'
import { withProps } from 'recompose'
import * as _ from 'lodash'
import * as tonal from 'tonal'
import * as TonalRange from 'tonal-range'
import * as Chord from 'tonal-chord'
import uuid from 'uuid/v4'

import JssProvider from 'react-jss/lib/JssProvider'
import { create } from 'jss'
import { createGenerateClassName, jssPreset } from '@material-ui/core/styles'

import CssBaseline from '@material-ui/core/CssBaseline'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import MuiButton from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import IconButton from '@material-ui/core/IconButton'
import MenuIcon from '@material-ui/icons/Menu'
import SettingsIcon from '@material-ui/icons/Settings'
import PlayIcon from '@material-ui/icons/PlayArrow'
import StopIcon from '@material-ui/icons/Stop'
import ArrowsIcon from '@material-ui/icons/Cached'
import TextField from '@material-ui/core/TextField'
import InputAdornment from '@material-ui/core/InputAdornment'

import Chip from '@material-ui/core/Chip'

import { Flex, Box, Button } from './ui'
import NotesStaff from './NotesStaff'
import MeasureScreenSize from './MeasureScreenSize'

import { shuffle, arrayMove, getNoteCardColorByNoteName } from '../utils'

import theme from '../styles/theme'
import globalStyles from '../styles/globalStyles'

import NoteCards from './NoteCards'

import {
  NoteCardType,
  StaffTick,
  ArpeggioType,
  ArpeggioDirection,
  NoteModifiers,
  ChromaticApproachesType,
  PlayableLoopTick,
  PlayableLoop,
  EnharmonicFlatsMap,
  ChromaticNoteSharps,
  User,
} from '../types'
import PickNoteModal from './PickNoteModal'
import ArpeggioModifierModal from './ArpeggioModifierModal'
import ChromaticApproachesModifierModal from './ChromaticApproachesModifierModal'
import PianoKeyboard from './PianoKeyboard'

import SettingsModal from './SettingsModal'
import AddEntityButton from './AddEntityButton'
import { generateStaffTicks } from '../musicUtils'
import AudioFontsConfig, { AudioFontId } from '../audioFontsConfig'
import AudioEngine, { AnimationCallback } from '../services/audioEngine'
import { AudioEngineContext } from './withAudioEngine'
import firebase, { FirebaseContext } from 'src/services/firebase'
import SignInModal from './SignInModal'

globalStyles()

console.log('All supported audio fonts: ', _.map(AudioFontsConfig, 'title'))
console.log('All supported chord names: ', Chord.names())

type AppState = {
  isSignedIn: boolean
  currentUser?: User

  isInitialized: boolean
  isLoadingAudioFont: boolean

  bpm: number
  rests: number
  isPlaying: boolean

  audioFontId: AudioFontId
  enharmonicFlatsMap: EnharmonicFlatsMap

  noteCardWithMouseOver?: NoteCardType
  noteCards: NoteCardType[]
  noteCardsById: { [noteCardId: string]: NoteCardType }
  staffTicks: StaffTick[]
  staffTicksPerCard: { [noteCardId: string]: StaffTick[] }
  activeNoteCardIndex: number
  activeStaffTickIndex: number

  modifiers: NoteModifiers

  height: number
  width: number
  notesStaffWidth: number

  signInModalIsOpen: boolean
  settingsModalIsOpen: boolean
  chromaticApproachesModalIsOpen: boolean
  chordsModalIsOpen: boolean

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

// This is needed to ensure the right CSS script tags insertion order to ensure
// that Material UI's CSS plays nicely with CSS generated by the "emotion" CSS-in-JS library.
// See this: https://material-ui.com/customization/css-in-js/#css-injection-order
const generateClassName = createGenerateClassName()
const jss = create({
  ...jssPreset(),
  // We define a custom insertion point that JSS will look for injecting the styles in the DOM.
  insertionPoint: document.getElementById('jss-insertion-point') as HTMLElement,
})

const audioEngine = new AudioEngine()

class App extends React.Component<{}, AppState> {
  private notesStaffRef: React.RefObject<NotesStaff>
  private notesStaffContainerRef: React.RefObject<any>
  private unregisterAuthObserver: firebase.Unsubscribe

  constructor(props) {
    super(props)

    let restoredState: Partial<AppState> = {}

    const noteName = _.sample(chromaticNotes)
    const randomNoteCard = {
      noteName,
      id: uuid(),
      text: tonal.Note.pc(noteName),
      midi: tonal.Note.midi(noteName),
      freq: tonal.Note.freq(noteName),
      color: getNoteCardColorByNoteName(noteName),
    }

    const savedState = window.localStorage.getItem('appState')
    if (savedState) {
      try {
        restoredState = JSON.parse(savedState) as Partial<AppState>
        console.log('restoredState = ', restoredState)
      } catch (error) {
        console.error(error)
        window.localStorage.removeItem('appState')
      }
    }

    const noteCards = restoredState.noteCards || [randomNoteCard]
    const noteCardsById = _.keyBy(noteCards, 'id')

    this.state = _.merge(
      {
        isInitialized: false,
        isLoadingAudioFont: false,
        audioFontId: AudioFontsConfig[0].id,

        bpm: 120,
        rests: 1,
        noteCards,
        noteCardsById,
        enharmonicFlatsMap: {
          'C#': true,
          'D#': true,
        },

        // Screen size
        height: 0,
        width: 0,
        notesStaffWidth: 0,

        isPlaying: false,
        staffTicks: [],
        staffTicksPerCard: {},
        activeNoteCardIndex: 0,
        activeStaffTickIndex: 0,

        modifiers: {
          arpeggio: {
            enabled: true,
            direction: 'up',
            type: 'M',
          },
          chromaticApproaches: {
            enabled: false,
            type: 'down',
          },
        },

        signInModalIsOpen: false,
        isSignedIn: false,

        chromaticApproachesModalIsOpen: false,
        chordsModalIsOpen: false,
        noteAddingModalIsOpen: false,
        noteEditingModalIsOpen: false,
        noteEditingModalNoteCard: undefined,

        settingsModalIsOpen: false,
      },
      restoredState,
    )

    this.notesStaffRef = React.createRef()
    this.notesStaffContainerRef = React.createRef()
  }

  componentDidMount() {
    this.init()
  }

  componentWillUnmount() {
    audioEngine.cleanUp()

    if (this.unregisterAuthObserver) {
      this.unregisterAuthObserver()
    }
  }

  private init = async () => {
    this.unregisterAuthObserver = firebase.auth().onAuthStateChanged(user => {
      this.setState({ isSignedIn: !!user, currentUser: user || undefined })
      this.closeSignInModal()
    })

    await this.updateStaffNotes()
    await this.initAudioEngine()
    await this.onNotesUpdated()

    this.setState({ isInitialized: true })
  }

  private initAudioEngine = async () => {
    audioEngine.setBpm(this.state.bpm)
    audioEngine.setAnimationCallback(this.drawAnimation)
    await this.loadAndSetAudioFont(this.state.audioFontId)
  }

  private loadAndSetAudioFont = async (audioFontId: AudioFontId) => {
    this.setState({ isLoadingAudioFont: true })
    await audioEngine.setAudioFont(audioFontId)
    this.setState(
      { audioFontId, isLoadingAudioFont: false },
      this.serializeAndSaveAppStateLocally,
    )
  }

  private updateStaffNotes = async () => {
    const { noteCards, modifiers, rests } = this.state
    const staffTicks = generateStaffTicks({ noteCards, modifiers, rests })
    const staffTicksPerCard = _.groupBy(staffTicks, 'noteCardId')

    return new Promise(resolve => {
      this.setState({ staffTicks, staffTicksPerCard }, () => {
        resolve()
      })
    })
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
        rests: this.state.rests,
        audioFontId: this.state.audioFontId,
        enharmonicFlatsMap: this.state.enharmonicFlatsMap,
        noteCards: this.state.noteCards,
        modifiers: this.state.modifiers,
      }),
    )
  }

  private generateLoop = () => {
    const { staffTicks } = this.state

    // Generate loop
    const loopTicks: PlayableLoopTick[] = staffTicks.map(
      (staffTick, index) => ({
        notes: staffTick.notes,
        meta: {
          staffTickIndex: index,
          noteCardId: staffTick.noteCardId,
        },
      }),
    )

    const loop: PlayableLoop = { ticks: loopTicks }
    return loop
  }

  private onNotesUpdated = async () => {
    console.log('onNotesUpdated')
    await this.updateStaffNotes()

    const loop = this.generateLoop()
    audioEngine.setLoop(loop)

    this.serializeAndSaveAppStateLocally()
  }

  private drawAnimation: AnimationCallback = ({ tick }) => {
    this.setState(state => {
      if (!state.isPlaying) {
        return null
      }

      const nextStaffNoteIndex = tick.meta.staffTickIndex
      // (state.activeStaffTickIndex + 1) % this.state.staffTicks.length
      const nextStaffNote = this.state.staffTicks[nextStaffNoteIndex]
      // TODO: optimize this serial search code to a hash lookup
      const nextNoteCardIndex = this.state.noteCards.findIndex(
        nc => nc.id === nextStaffNote.noteCardId,
      )
      return {
        activeStaffTickIndex: nextStaffNoteIndex,
        activeNoteCardIndex: nextNoteCardIndex,
      }
    }, this.updateStaffNotes)
  }

  private startPlaying = () => {
    console.log('startPlaying')
    this.setState({ isPlaying: true }, () => {
      audioEngine.playLoop()
    })
  }

  private stopPlaying = (cb?: () => any) => {
    console.log('stopPlaying')

    this.setState(
      { isPlaying: false, activeNoteCardIndex: 0, activeStaffTickIndex: 0 },
      async () => {
        audioEngine.stopLoop()

        await this.updateStaffNotes()

        if (cb) {
          cb()
        }
      },
    )
  }

  private togglePlayback = () => {
    console.log('togglePlayback')
    if (this.state.isPlaying) {
      this.stopPlaying()
    } else {
      this.startPlaying()
    }
  }

  private handleBpmChange = e => {
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
      audioEngine.setBpm(bpmValue)

      this.setState(
        {
          bpm: bpmValue,
        },
        this.serializeAndSaveAppStateLocally,
      )
    }
  }

  private handleRestsChange = e => {
    let restsValue = this.state.rests
    try {
      if (!e.target.value) {
        restsValue = 0
      } else {
        restsValue = parseInt(e.target.value, 10)
        if (isNaN(restsValue)) {
          restsValue = 0
        }
      }
    } finally {
      this.setState(
        {
          rests: restsValue,
        },
        this.onNotesUpdated,
      )
    }
  }

  private handleAudioFontChanged = async (audioFontId: AudioFontId) => {
    await this.loadAndSetAudioFont(audioFontId)
    audioEngine.playNote({ midi: tonal.Note.midi('C4') }, 0, 0.5)
  }

  private handleMouseOverNoteCard = (noteCard: NoteCardType) => {
    this.setState({ noteCardWithMouseOver: noteCard })
  }

  private handleMouseLeaveNoteCard = () => {
    this.setState({ noteCardWithMouseOver: undefined })
  }

  private handleEditCardClick = (noteCard: NoteCardType) => {
    this.setState({
      noteEditingModalIsOpen: true,
      noteEditingModalNoteCard: noteCard,
    })
  }

  private handleChangeNoteCardToEnharmonicClick = (noteCard: NoteCardType) => {
    this.updateNoteCard({
      noteCardId: noteCard.id,
      noteName: tonal.Note.enharmonic(noteCard.noteName),
    })
  }

  private handleDeleteCardClick = (noteCard: NoteCardType) =>
    this.deleteNoteCard(noteCard)

  private handleNoteCardDraggedOut = (noteCard: NoteCardType) =>
    this.deleteNoteCard(noteCard)

  private deleteNoteCard = (noteCard: NoteCardType) => {
    const newNoteCards = this.state.noteCards.filter(nc => nc !== noteCard)
    this.setState(
      {
        noteCards: newNoteCards,
        noteCardsById: _.keyBy(newNoteCards, 'id'),
      },
      this.onNotesUpdated,
    )
  }

  private handleCardsReorder = ({ oldIndex, newIndex }) => {
    const newNoteCards = arrayMove(this.state.noteCards, oldIndex, newIndex)
    this.setState(
      {
        noteCards: newNoteCards,
      },
      this.onNotesUpdated,
    )
  }

  private handleScreenSizeUpdate = ({ width, height }) => {
    if (this.notesStaffContainerRef.current) {
      const {
        width: notesStaffWidth,
      } = this.notesStaffContainerRef.current.getBoundingClientRect()
      this.setState({ notesStaffWidth })
    }
    this.setState({ width, height })
  }

  private signOut = () => {
    firebase.auth().signOut()
  }

  private openSignInModal = () => {
    this.setState({ signInModalIsOpen: true })
  }

  private closeSignInModal = () => {
    this.setState({ signInModalIsOpen: false })
  }

  private openSettingsModal = () => {
    this.setState({ settingsModalIsOpen: true })
  }

  private closeSettingsModal = () => {
    this.setState({ settingsModalIsOpen: false })
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

  private openArpeggioAddingModal = () => {
    this.setState({
      chordsModalIsOpen: true,
    })
  }

  private closeArpeggioAddingModal = () => {
    this.setState({
      chordsModalIsOpen: false,
    })
  }

  private openChromaticApproachesModal = () => {
    this.setState({
      chromaticApproachesModalIsOpen: true,
    })
  }

  private closeChromaticApproachesModal = () => {
    this.setState({
      chromaticApproachesModalIsOpen: false,
    })
  }

  private updateNoteCard = ({ noteCardId, noteName }) => {
    const newNoteCards = this.state.noteCards.map(noteCard => {
      if (noteCard.id !== noteCardId) {
        return noteCard
      }

      return {
        ...noteCard,
        noteName,
        text: tonal.Note.pc(noteName),
        note: noteName,
        midi: tonal.Note.midi(noteName),
        color: getNoteCardColorByNoteName(noteName),
      }
    })

    this.setState(
      {
        noteCards: newNoteCards,
        noteCardsById: _.keyBy(newNoteCards, 'id'),
      },
      this.onNotesUpdated,
    )
  }

  private handleNoteClickInNoteCardEditingModal = ({ noteName }) => {
    if (!this.state.noteEditingModalNoteCard) {
      return
    }

    this.updateNoteCard({
      noteCardId: this.state.noteEditingModalNoteCard.id,
      noteName,
    })

    this.setState({
      noteEditingModalIsOpen: false,
      noteEditingModalNoteCard: undefined,
    })
  }

  private handleArpeggioModifierModalConfirm = ({
    type,
    direction,
  }: {
    type: ArpeggioType
    direction: ArpeggioDirection
  }) => {
    this.setState(
      {
        modifiers: {
          ...this.state.modifiers,
          arpeggio: {
            enabled: true,
            type,
            direction,
          },
        },
      },
      this.onNotesUpdated,
    )

    this.closeArpeggioAddingModal()
  }

  handleChromaticApproachModifierModalConfirm = ({
    type,
  }: {
    type: ChromaticApproachesType
  }) => {
    this.setState(
      {
        modifiers: {
          ...this.state.modifiers,
          chromaticApproaches: {
            enabled: true,
            type,
          },
        },
      },
      this.onNotesUpdated,
    )

    this.closeChromaticApproachesModal()
  }

  private handleRemoveArpeggioClick = () => {
    this.setState(
      {
        modifiers: {
          ...this.state.modifiers,
          arpeggio: {
            ...this.state.modifiers.arpeggio,
            enabled: false,
          },
        },
      },
      this.onNotesUpdated,
    )
  }

  private handleRemoveChromaticApproachesClick = () => {
    this.setState(
      {
        modifiers: {
          ...this.state.modifiers,
          chromaticApproaches: {
            ...this.state.modifiers.chromaticApproaches,
            enabled: false,
          },
        },
      },
      this.onNotesUpdated,
    )
  }

  private handleEnharmonicMapToggle = (pitchName: ChromaticNoteSharps) => {
    this.setState({
      enharmonicFlatsMap: {
        ...this.state.enharmonicFlatsMap,
        [pitchName]: !Boolean(this.state.enharmonicFlatsMap[pitchName]),
      },
    })
  }

  private handleNoteClickInNoteCardAddingModal = ({ noteName }) => {
    const newNoteCards = [
      ...this.state.noteCards,
      {
        noteName,
        id: uuid(),
        text: tonal.Note.pc(noteName),
        midi: tonal.Note.midi(noteName),
        freq: tonal.Note.freq(noteName),
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

  public render() {
    const {
      bpm,
      rests,
      noteCards,
      staffTicks,
      staffTicksPerCard,
      isPlaying,
      activeNoteCardIndex,
      activeStaffTickIndex,
      noteCardWithMouseOver,
    } = this.state

    const activeNoteCard = isPlaying
      ? noteCards[activeNoteCardIndex]
      : undefined
    const activeStaffTick = isPlaying
      ? staffTicks[activeStaffTickIndex]
      : undefined

    const activeNoteCardTicks = activeNoteCard
      ? staffTicksPerCard[activeNoteCard.id]
      : undefined

    const noteCardWithMouseOverTicks = noteCardWithMouseOver
      ? staffTicksPerCard[noteCardWithMouseOver.id]
      : undefined
    return (
      <ThemeProvider theme={theme}>
        <AudioEngineContext.Provider value={audioEngine}>
          <FirebaseContext.Provider value={firebase}>
            <JssProvider jss={jss} generateClassName={generateClassName}>
              <>
                <CssBaseline />

                <MeasureScreenSize
                  onUpdate={this.handleScreenSizeUpdate}
                  fireOnMount
                >
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
                        <Typography
                          variant="h6"
                          color="inherit"
                          className={css({ flexGrow: 1 })}
                        >
                          Random Variations
                        </Typography>

                        {!this.state.isSignedIn ? (
                          <MuiButton
                            color="inherit"
                            onClick={this.openSignInModal}
                          >
                            Sign in
                          </MuiButton>
                        ) : (
                          <MuiButton color="inherit" onClick={this.signOut}>
                            Sign out
                          </MuiButton>
                        )}

                        <IconButton
                          color="inherit"
                          onClick={this.openSettingsModal}
                        >
                          <SettingsIcon />
                        </IconButton>
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
                      <Flex
                        alignItems="center"
                        flexDirection="row"
                        mb={3}
                        width={1}
                      >
                        <Box flex="1">
                          <Button
                            title={isPlaying ? 'Stop' : 'Play'}
                            bg={isPlaying ? 'red' : '#00c200'}
                            m={[1, 2]}
                            onClick={this.togglePlayback}
                          >
                            {isPlaying ? (
                              <StopIcon
                                className={css({ marginRight: '0.5rem' })}
                              />
                            ) : (
                              <PlayIcon
                                className={css({ marginRight: '0.5rem' })}
                              />
                            )}
                            {isPlaying ? 'Stop' : 'Play'}
                          </Button>

                          <Button
                            variant="contained"
                            title="Shuffle note cards"
                            m={[1, 2]}
                            onClick={this.handleShuffleClick}
                          >
                            <ArrowsIcon
                              className={css({ marginRight: '0.5rem' })}
                            />
                            Shuffle!
                          </Button>
                        </Box>

                        <TextField
                          className={css({ maxWidth: '80px' })}
                          label="Tempo"
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                BPM
                              </InputAdornment>
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

                        <TextField
                          className={css({
                            marginLeft: '15px',
                            maxWidth: '50px',
                          })}
                          label="Rests"
                          id="rests"
                          type="number"
                          // @ts-ignore
                          step="1"
                          min="0"
                          max="8"
                          value={`${rests}`}
                          onChange={this.handleRestsChange}
                        />
                      </Flex>

                      <Flex
                        flex={2}
                        alignItems="center"
                        justifyContent="center"
                        flexDirection="column"
                        maxHeight={400}
                        width={1}
                        maxWidth={700}
                      >
                        <NoteCards
                          noteCards={noteCards}
                          activeNoteCard={activeNoteCard}
                          onChangeToEnharmonicClick={
                            this.handleChangeNoteCardToEnharmonicClick
                          }
                          onMouseOver={this.handleMouseOverNoteCard}
                          onMouseLeave={this.handleMouseLeaveNoteCard}
                          onEditClick={this.handleEditCardClick}
                          onDeleteClick={this.handleDeleteCardClick}
                          onCardsReorder={this.handleCardsReorder}
                          onCardDraggedOut={this.handleNoteCardDraggedOut}
                        />

                        <Flex
                          flexDirection="row-reverse"
                          alignItems="center"
                          width={1}
                          px={[1, 2, 2]}
                          mt={[4, 2, 3]}
                          mb={[2, 2, 3]}
                        >
                          <AddEntityButton
                            onAddSingleNoteClick={this.openNoteAddingModal}
                            onAddArpeggioClick={this.openArpeggioAddingModal}
                            onAddChromaticApproachesClick={
                              this.openChromaticApproachesModal
                            }
                            disableSingleNote={
                              this.state.noteCards.length >= 12
                            }
                            disableChords={
                              this.state.modifiers.arpeggio.enabled
                            }
                            disableChromaticApproaches={
                              this.state.modifiers.chromaticApproaches.enabled
                            }
                            buttonProps={{
                              disabled: isPlaying,
                              className: css({
                                marginLeft: '1rem',
                              }),
                            }}
                          />

                          <Flex
                            flex-direction="row"
                            flex={1}
                            alignItems="center"
                          >
                            {this.state.modifiers.arpeggio.enabled && (
                              <Chip
                                color="primary"
                                label={`Chords: ${
                                  this.state.modifiers.arpeggio.type
                                } / ${this.state.modifiers.arpeggio.direction}`}
                                onClick={this.openArpeggioAddingModal}
                                onDelete={this.handleRemoveArpeggioClick}
                                classes={{
                                  root: css({ marginRight: '0.5rem' }),
                                }}
                              />
                            )}
                            {this.state.modifiers.chromaticApproaches
                              .enabled && (
                              <Chip
                                color="primary"
                                label={`Enclosure / ${
                                  this.state.modifiers.chromaticApproaches.type
                                }`}
                                onClick={this.openChromaticApproachesModal}
                                onDelete={
                                  this.handleRemoveChromaticApproachesClick
                                }
                                classes={{
                                  root: css({ marginRight: '0.5rem' }),
                                }}
                              />
                            )}
                          </Flex>
                        </Flex>
                      </Flex>

                      <Box innerRef={this.notesStaffContainerRef} width={1}>
                        <NotesStaff
                          isPlaying={isPlaying}
                          id="notation"
                          ticks={this.state.staffTicks}
                          activeTickIndex={
                            isPlaying ? activeStaffTickIndex : undefined
                          }
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
                        secondaryNotesMidi={
                          activeNoteCardTicks
                            ? _.flatten(
                                activeNoteCardTicks.map(t =>
                                  t.notes.map(n => n.midi),
                                ),
                              )
                            : noteCardWithMouseOverTicks
                              ? _.flatten(
                                  noteCardWithMouseOverTicks.map(t =>
                                    t.notes.map(n => n.midi),
                                  ),
                                )
                              : undefined
                        }
                        primaryNotesMidi={
                          activeStaffTick
                            ? activeStaffTick.notes.map(n => n.midi)
                            : noteCardWithMouseOver
                              ? [noteCardWithMouseOver.midi]
                              : undefined
                        }
                        notesColor={
                          activeNoteCard
                            ? activeNoteCard.color
                            : noteCardWithMouseOver
                              ? noteCardWithMouseOver.color
                              : undefined
                        }
                      />
                    </Box>

                    <SignInModal
                      isOpen={this.state.signInModalIsOpen}
                      onClose={this.closeSignInModal}
                    />

                    <SettingsModal
                      isOpen={this.state.settingsModalIsOpen}
                      onClose={this.closeSettingsModal}
                      defaultValues={{
                        audioFontId: this.state.audioFontId,
                      }}
                      onSubmit={this.closeSettingsModal}
                      onAudioFontChanged={this.handleAudioFontChanged}
                    />

                    <ArpeggioModifierModal
                      isOpen={this.state.chordsModalIsOpen}
                      onClose={this.closeArpeggioAddingModal}
                      onSubmit={this.handleArpeggioModifierModalConfirm}
                      defaultDirection={this.state.modifiers.arpeggio.direction}
                      defaultType={this.state.modifiers.arpeggio.type}
                    />

                    <ChromaticApproachesModifierModal
                      isOpen={this.state.chromaticApproachesModalIsOpen}
                      onClose={this.closeChromaticApproachesModal}
                      onSubmit={
                        this.handleChromaticApproachModifierModalConfirm
                      }
                      defaultType={
                        this.state.modifiers.chromaticApproaches.type
                      }
                    />

                    <PickNoteModal
                      isOpen={this.state.noteAddingModalIsOpen}
                      onClose={this.closeNoteAddingModal}
                      onSubmit={this.handleNoteClickInNoteCardAddingModal}
                      enharmonicFlatsMap={this.state.enharmonicFlatsMap}
                      onEnharmonicFlatsMapToggle={
                        this.handleEnharmonicMapToggle
                      }
                    />

                    {this.state.noteEditingModalIsOpen && (
                      <PickNoteModal
                        isOpen
                        noteName={
                          this.state.noteEditingModalNoteCard
                            ? this.state.noteEditingModalNoteCard.noteName
                            : undefined
                        }
                        onClose={this.closeNoteEditingModal}
                        onSubmit={this.handleNoteClickInNoteCardEditingModal}
                        enharmonicFlatsMap={this.state.enharmonicFlatsMap}
                        onEnharmonicFlatsMapToggle={
                          this.handleEnharmonicMapToggle
                        }
                      />
                    )}
                  </Flex>
                </MeasureScreenSize>
              </>
            </JssProvider>
          </FirebaseContext.Provider>
        </AudioEngineContext.Provider>
      </ThemeProvider>
    )
  }
}

export default App
