import * as React from 'react'
import { ThemeProvider } from 'emotion-theming'
import { css, cx } from 'react-emotion'
import _ from 'lodash'
import * as tonal from 'tonal'
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
import Hidden from '@material-ui/core/Hidden'
import Snackbar from '@material-ui/core/Snackbar'
import CloseIcon from '@material-ui/icons/Close'

import SettingsIcon from '@material-ui/icons/Settings'
import PlayIcon from '@material-ui/icons/PlayArrow'
import StopIcon from '@material-ui/icons/Stop'
import MenuIcon from '@material-ui/icons/Menu'
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft'
import DeleteIcon from '@material-ui/icons/Close'
import SaveIcon from '@material-ui/icons/Save'
import ArrowsIcon from '@material-ui/icons/Cached'
import TimerIcon from '@material-ui/icons/Timer'
import MetronomeIcon from 'mdi-material-ui/Metronome'
import TextField from '@material-ui/core/TextField'
import InputAdornment from '@material-ui/core/InputAdornment'

import Chip from '@material-ui/core/Chip'

import { Flex, Box, Button, Text } from './ui'
import NotesStaff from './NotesStaff'
import MeasureScreenSize from './MeasureScreenSize'

import {
  shuffle,
  arrayMove,
  getNoteCardColorByNoteName,
  createDefaultSession,
} from '../utils'

import theme from '../styles/theme'
import globalStyles from '../styles/globalStyles'

import NoteCards from './NoteCards'

import {
  NoteCardType,
  StaffTick,
  NoteModifiers,
  ChromaticApproachesType,
  PlayableLoopTick,
  PlayableLoop,
  EnharmonicFlatsMap,
  ChromaticNoteSharps,
  User,
  Session,
  Scale,
} from '../types'
import PickNoteModal from './PickNoteModal'
import ArpeggioModifierModal, {
  SubmitValuesType as ArpeggioModifierModalSubmitValues,
} from './ArpeggioModifierModal'
import ScaleModifierModal, {
  SubmitValuesType as ScaleModifierModalSubmitValues,
} from './ScaleModifierModal'
import IntervalModifierModal, {
  SubmitValuesType as IntervalModifierModalSubmitValues,
} from './IntervalModifierModal'
import ChromaticApproachesModifierModal from './ChromaticApproachesModifierModal'
import PianoKeyboard from './PianoKeyboard'

import SettingsModal from './SettingsModal'
import AddEntityButton from './AddEntityButton'
import {
  generateStaffTicks,
  scaleByScaleType,
  SemitonesToIntervalShortNameMap,
} from '../musicUtils'
import AudioFontsConfig, { AudioFontId } from '../audioFontsConfig'
import AudioEngine, { AnimationCallback } from '../services/audioEngine'
import { AudioEngineContext } from './withAudioEngine'
import firebase, { FirebaseContext, base } from '../services/firebase'
import SignInModal from './SignInModal'
import Tooltip from './ui/Tooltip'
import {
  CircularProgress,
  Avatar,
  Fade,
  Grow,
  withStyles,
  WithStyles,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  SwipeableDrawer,
  withWidth,
} from '@material-ui/core'
import { WithWidth } from '@material-ui/core/withWidth'

globalStyles()

console.log('All supported audio fonts: ', _.map(AudioFontsConfig, 'title'))
console.log('All supported chord names: ', Chord.names())

type AppState = {
  isMenuOpen: boolean
  disableStartTooltips?: boolean

  hasInitializedOnlineStatus: boolean
  isOnline?: boolean
  isOfflineNotificationShown: boolean
  isOnlineNotificationShown: boolean

  isSignedIn: boolean
  currentUser?: User

  isInitialized: boolean
  isLoadingAudioFont: boolean

  sessionsById: { [sessionId: string]: Session }
  activeSessionId?: string

  bpm: number
  rests: number
  countInCounts: number
  countInEnabled: boolean
  metronomeEnabled: boolean
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
  contentWidth: number
  notesStaffWidth: number

  signInModalIsOpen: boolean
  settingsModalIsOpen: boolean

  // Modifier dialogs
  chromaticApproachesModalIsOpen: boolean
  chordsModalIsOpen: boolean
  scalesModalIsOpen: boolean
  intervalsModalIsOpen: boolean

  noteAddingModalIsOpen: boolean
  noteEditingModalIsOpen: boolean
  noteEditingModalNoteCard?: NoteCardType
}

const defaultSession = createDefaultSession()

// This is needed to ensure the right CSS script tags insertion order to ensure
// that Material UI's CSS plays nicely with CSS generated by the "emotion" CSS-in-JS library.
// See this: https://material-ui.com/customization/css-in-js/#css-injection-order
const generateClassName = createGenerateClassName({
  productionPrefix: 'mu-jss-',
})
const jss = create({
  ...jssPreset(),
  // We define a custom insertion point that JSS will look for injecting the styles in the DOM.
  insertionPoint: document.getElementById('jss-insertion-point') as HTMLElement,
})

const audioEngine = new AudioEngine()

const unpackSessionState = (session: Session) => {
  const noteCards = (session.noteCards || []).map(nc => ({
    id: nc.id || uuid(),
    noteName: nc.noteName,
    text: tonal.Note.pc(nc.noteName),
    midi: tonal.Note.midi(nc.noteName),
    freq: tonal.Note.freq(nc.noteName),
    color: getNoteCardColorByNoteName(nc.noteName),
  }))

  const noteCardsById = _.keyBy(noteCards, 'id')

  return {
    noteCards,
    noteCardsById,
    bpm: session.bpm,
    rests: session.rests,
    countInCounts: session.countInCounts,
    countInEnabled: session.countInEnabled,
    metronomeEnabled: session.metronomeEnabled,
    modifiers: session.modifiers,
  }
}

const menuWidth = 240

const styles = theme => ({
  root: {
    display: 'flex',
    height: '100%',
    width: '100%',
  },
  appBar: {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    width: `calc(100% - ${menuWidth}px)`,
    marginLeft: menuWidth,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginLeft: 12,
    marginRight: 20,
  },
  hide: {
    display: 'none',
  },
  drawer: {
    width: menuWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: menuWidth,
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexGrow: 1,
    paddingTop: theme.spacing.unit * 6,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  contentShifted: {
    marginLeft: -menuWidth,
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  },
})

class App extends React.Component<WithStyles & WithWidth, AppState> {
  // @ts-ignore
  private unregisterAuthObserver: firebase.Unsubscribe
  // @ts-ignore
  private unregisterSessionsObserver: firebase.Unsubscribe

  constructor(props) {
    super(props)

    this.state = _.merge({
      isMenuOpen: false,
      isInitialized: false,

      hasInitializedOnlineStatus: false,
      isOfflineNotificationShown: false,
      isOnlineNotificationShown: false,
      isLoadingAudioFont: false,
      audioFontId: AudioFontsConfig[1].id,

      ...unpackSessionState(createDefaultSession() as Session),

      sessionsById: {},

      bpm: 120,
      rests: 1,
      noteCards: [],
      noteCardsById: {},
      enharmonicFlatsMap: {},

      // Screen size
      height: 0,
      width: 0,
      notesStaffWidth: 0,

      isPlaying: false,
      staffTicks: [],
      staffTicksPerCard: {},
      activeNoteCardIndex: 0,
      activeStaffTickIndex: 0,

      signInModalIsOpen: false,
      isSignedIn: false,

      chromaticApproachesModalIsOpen: false,
      chordsModalIsOpen: false,
      scalesModalIsOpen: false,
      intervalsModalIsOpen: false,
      noteAddingModalIsOpen: false,
      noteEditingModalIsOpen: false,
      noteEditingModalNoteCard: undefined,

      settingsModalIsOpen: false,
    })
  }

  componentDidMount() {
    this.init()
  }

  componentWillUnmount() {
    audioEngine.cleanUp()

    if (this.unregisterAuthObserver) {
      this.unregisterAuthObserver()
    }
    if (this.unregisterSessionsObserver) {
      base.removeBinding(this.unregisterSessionsObserver)
    }
  }

  private openMenu = () => {
    this.toggleTooltipVisibility()
    this.setState({ isMenuOpen: true }, () => {
      setTimeout(this.handleContentWidthUpdate, 500)
    })
  }
  private closeMenu = () => {
    this.toggleTooltipVisibility()
    this.setState({ isMenuOpen: false }, () => {
      setTimeout(this.handleContentWidthUpdate, 500)
    })
  }

  private onAuthStateChanged = (user: firebase.User | null) => {
    console.log('onAuthStateChanged: ', user, user && user.isAnonymous)
    this.setState(
      {
        isSignedIn: !!user,
        currentUser: user || undefined,
      },
      async () => {
        await this.fetchAndRestoreSessions()
      },
    )

    if (user && this.state.signInModalIsOpen) {
      this.closeSignInModal()
    }
  }

  private restoreSavedSessions = (
    sessions: Session[],
    activeSessionId: string,
  ) => {
    console.log('restoreSavedSessions: ', sessions)
    this.setState(
      {
        sessionsById: _.keyBy(sessions, 'key'),
      },
      () => this.activateSession(activeSessionId),
    )
  }

  private activateSession = (sessionId: string) => {
    const session = this.state.sessionsById[sessionId]
    console.log('loadSession -> restoreSession: ', sessionId, session)
    if (!session) {
      console.error('loadSession -> no session: ', sessionId)
      return
    }

    this.setState(
      _.merge(
        {
          activeSessionId: sessionId,
          modifiers: {
            chords: {},
            scales: {},
            intervals: {},
            enclosures: {},
          },
        },
        unpackSessionState(session),
      ),
      () => {
        this.onNotesUpdated()
        audioEngine.setBpm(this.state.bpm)
        audioEngine.setMetronomeEnabled(this.state.metronomeEnabled)
        audioEngine.setCountIn(
          this.state.countInEnabled ? this.state.countInCounts : 0,
        )
      },
    )
  }

  private fetchAndRestoreSessions = async () => {
    const user = firebase.auth().currentUser
    if (!user) {
      return
    }

    let sessions = await base.fetch(`users/${user.uid}/sessions`, {
      asArray: true,
    })

    if (!sessions || sessions.length === 0) {
      await base.push(`users/${user.uid}/sessions`, {
        data: {
          ...defaultSession,
          author: user.uid,
        } as Session,
      })

      sessions = await base.fetch(`users/${user.uid}/sessions`, {
        asArray: true,
      })
    }

    this.restoreSavedSessions(sessions, sessions[0].key)
  }

  private restoreLocalState = () => {
    console.log('restoreLocalState')
    let restoredState: Partial<AppState> = {}

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

    if (restoredState) {
      this.setState({
        enharmonicFlatsMap: restoredState.enharmonicFlatsMap
          ? restoredState.enharmonicFlatsMap
          : this.state.enharmonicFlatsMap,
      })
    }
  }

  private getActiveSession = () => {
    const { sessionsById, activeSessionId } = this.state
    if (!sessionsById || !activeSessionId) {
      return null
    }
    return sessionsById[activeSessionId]
  }

  private loadDefaultSession = () => {
    const defaultSessionId = uuid()
    this.setState(
      {
        sessionsById: {
          [defaultSessionId]: {
            ...defaultSession,
            key: defaultSessionId,
          } as Session,
        },
      },
      () => {
        this.activateSession(defaultSessionId)
      },
    )
  }

  private init = async () => {
    await this.initAudioEngine()
    if (this.state.isInitialized) {
      return
    }

    this.restoreLocalState()

    // Track the "online/offline" state, see:
    // https://firebase.google.com/docs/database/web/offline-capabilities#section-connection-state
    const connectedRef = firebase.database().ref('.info/connected')
    connectedRef.on('value', snap => {
      if (snap) {
        // Ignore the first time this callback is called
        if (!this.state.hasInitializedOnlineStatus) {
          this.setState({ hasInitializedOnlineStatus: true })
          return
        }

        if (snap.val() === true) {
          if (this.state.isOfflineNotificationShown) {
            this.setState({ isOnlineNotificationShown: true })
          }
          this.setState({ isOnline: true, isOfflineNotificationShown: false })
          console.log('CONNECTED: YES')
        } else {
          this.setState({
            isOnline: false,
            isOfflineNotificationShown: true,
            isOnlineNotificationShown: false,
          })
          console.log('CONNECTED: NO')
        }
      }
    })

    await new Promise(resolve => {
      const unregisterInitAuthObserver = firebase
        .auth()
        .onAuthStateChanged(user => {
          this.setState(
            {
              isSignedIn: !!user,
              currentUser: user || undefined,
            },
            async () => {
              unregisterInitAuthObserver()

              if (user && this.state.isOnline !== false) {
                await this.fetchAndRestoreSessions()
              } else {
                await this.loadDefaultSession()
              }

              resolve()
            },
          )
        })
    })

    await this.updateStaffNotes()
    await this.onNotesUpdated()

    console.log('this: ', this)

    this.setState({ isInitialized: true }, () => {
      this.unregisterAuthObserver = firebase
        .auth()
        .onAuthStateChanged(this.onAuthStateChanged)
    })
  }

  private initAudioEngine = async () => {
    audioEngine.setAnimationCallback(this.drawAnimation)
    await this.loadAndSetAudioFont(this.state.audioFontId)
  }

  private loadAndSetAudioFont = async (audioFontId: AudioFontId) => {
    this.setState({ isLoadingAudioFont: true })
    await audioEngine.setAudioFont(audioFontId)
    this.setState({ audioFontId, isLoadingAudioFont: false }, this.saveAppState)
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
      return 130
    }
    if (height > 300) {
      return 80
    }
    return 40
  }

  private handleShuffleClick = () => {
    this.updateActiveSession({
      noteCards: [
        this.state.noteCards[0],
        ...shuffle(this.state.noteCards.slice(1)),
      ],
    })
  }

  private saveLocalAppState = () => {
    window.localStorage.setItem(
      'appState',
      JSON.stringify({
        audioFontId: this.state.audioFontId,
        enharmonicFlatsMap: this.state.enharmonicFlatsMap,
      }),
    )
  }

  private saveActiveSession = () => {
    const user = firebase.auth().currentUser
    const session = this.getActiveSession()
    if (!user || !session) {
      return
    }
    console.log('Save session: ', session)
    base.update(`users/${user.uid}/sessions/${session.key}`, { data: session })
  }

  private saveAppState = () => {
    console.log('saveAppState')
    this.saveLocalAppState()
    this.saveActiveSession()
  }

  private generateLoop = () => {
    const { staffTicks } = this.state

    // Generate loop
    const loopTicks: PlayableLoopTick[] = staffTicks.map(
      (staffTick, index) => ({
        notes: staffTick.notes,
        meta: {
          staffTickIndex: index,
          noteCardId: staffTick.noteCardId!,
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
  }

  private drawAnimation: AnimationCallback = ({
    tick,
  }: {
    tick: PlayableLoopTick
  }) => {
    this.setState(state => {
      if (!state.isPlaying) {
        return null
      }

      const nextStaffTickIndex = tick.meta.staffTickIndex
      console.log('nextStaffNoteIndex: ', nextStaffTickIndex)
      if (nextStaffTickIndex == null) {
        return null
      }
      // (state.activeStaffTickIndex + 1) % this.state.staffTicks.length
      const nextStaffTick = this.state.staffTicks[nextStaffTickIndex]
      if (!nextStaffTick) {
        return null
      }

      // TODO: optimize this serial search code to a hash lookup
      const nextNoteCardIndex = this.state.noteCards.findIndex(
        nc => nc.id === nextStaffTick.noteCardId,
      )
      return {
        activeStaffTickIndex: nextStaffTickIndex,
        activeNoteCardIndex: nextNoteCardIndex,
      }
    })
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

  private updateActiveSession = (data, updateNotes = true) => {
    const session = this.getActiveSession()
    if (!session) {
      return
    }

    const noteCards = (data.noteCards || session.noteCards || []).map(nc => ({
      noteName: nc.noteName,
      id: nc.id,
    }))

    const updatedSession = {
      ...session,
      ...data,
      noteCards,
    }

    this.setState(
      {
        sessionsById: {
          ...this.state.sessionsById,
          [session.key]: updatedSession,
        },
        ...unpackSessionState(updatedSession),
      },
      () => {
        if (updateNotes) {
          this.onNotesUpdated()
        }
        this.saveAppState()
      },
    )
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
      this.updateActiveSession({ bpm: bpmValue }, false)
    }
  }

  private handleCountInCountsChange = e => {
    let value = this.state.countInCounts
    try {
      if (!e.target.value) {
        value = 0
      } else {
        value = parseInt(e.target.value, 10)
        if (isNaN(value)) {
          value = 0
        }
        if (value > 16) {
          value = 16
        }
        if (value < 0) {
          value = 0
        }
      }
    } finally {
      audioEngine.setCountIn(this.state.countInEnabled ? value : 0)
      this.updateActiveSession({ countInCounts: value }, false)
    }
  }

  private handleCountInToggle = () => {
    audioEngine.setCountIn(
      this.state.countInEnabled ? 0 : this.state.countInCounts,
    )
    this.updateActiveSession(
      {
        countInEnabled: !Boolean(this.state.countInEnabled),
      },
      false,
    )
  }

  private handleMetronomeToggle = () => {
    audioEngine.setMetronomeEnabled(!Boolean(this.state.metronomeEnabled))
    this.updateActiveSession(
      {
        metronomeEnabled: !Boolean(this.state.metronomeEnabled),
      },
      false,
    )
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
      this.updateActiveSession({ rests: restsValue })
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
    this.updateActiveSession({
      noteCards: newNoteCards,
    })
  }

  private handleCardsReorder = ({ oldIndex, newIndex }) => {
    const newNoteCards = arrayMove(this.state.noteCards, oldIndex, newIndex)
    this.updateActiveSession({
      noteCards: newNoteCards,
    })
  }

  private handleContentWidthUpdate = () => {
    const contentWidth = (document.getElementById(
      'app-content',
    ) as HTMLElement).getBoundingClientRect().width

    this.setState({ contentWidth })
  }

  private toggleTooltipVisibility = () => {
    this.setState({ disableStartTooltips: true }, () => {
      setTimeout(() => {
        this.setState({ disableStartTooltips: false })
      }, 50)
    })
  }

  private handleScreenSizeUpdate = ({ width, height }) => {
    this.toggleTooltipVisibility()
    this.setState({ width, height }, this.handleContentWidthUpdate)
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

  private openScalesModal = () => {
    this.setState({
      scalesModalIsOpen: true,
    })
  }

  private closeScalesModal = () => {
    this.setState({
      scalesModalIsOpen: false,
    })
  }

  private openIntervalsModal = () => {
    this.setState({
      intervalsModalIsOpen: true,
    })
  }

  private closeIntervalsModal = () => {
    this.setState({
      intervalsModalIsOpen: false,
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

    this.updateActiveSession({
      noteCards: newNoteCards,
      noteCardsById: _.keyBy(newNoteCards, 'id'),
    })
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

  private handleArpeggioModifierModalConfirm = (
    values: ArpeggioModifierModalSubmitValues,
  ) => {
    this.updateActiveSession({
      modifiers: {
        ...this.state.modifiers,
        chords: {
          ...values,
          enabled: true,
        },
      },
    })

    this.closeArpeggioAddingModal()
  }

  private handleScaleModifierModalConfirm = (
    values: ScaleModifierModalSubmitValues,
  ) => {
    this.updateActiveSession({
      modifiers: {
        ...this.state.modifiers,
        scales: {
          ...values,
          enabled: true,
        },
      },
    })

    this.closeScalesModal()
  }

  private handleIntervalsModifierModalConfirm = (
    values: IntervalModifierModalSubmitValues,
  ) => {
    this.updateActiveSession({
      modifiers: {
        ...this.state.modifiers,
        intervals: {
          ...values,
          enabled: true,
        },
      },
    })

    this.closeIntervalsModal()
  }

  handleChromaticApproachModifierModalConfirm = ({
    type,
  }: {
    type: ChromaticApproachesType
  }) => {
    this.updateActiveSession({
      modifiers: {
        ...this.state.modifiers,
        chromaticApproaches: {
          enabled: true,
          type,
        },
      },
    })

    this.closeChromaticApproachesModal()
  }

  private handleRemoveArpeggioClick = () => {
    this.updateActiveSession({
      modifiers: {
        ...this.state.modifiers,
        chords: {
          ...this.state.modifiers.chords,
          enabled: false,
        },
      },
    })
  }

  private handleRemoveScalesClick = () => {
    this.updateActiveSession({
      modifiers: {
        ...this.state.modifiers,
        scales: {
          ...this.state.modifiers.scales,
          enabled: false,
        },
      },
    })
  }

  private handleRemoveIntervalsClick = () => {
    this.updateActiveSession({
      modifiers: {
        ...this.state.modifiers,
        intervals: {
          ...this.state.modifiers.intervals,
          enabled: false,
        },
      },
    })
  }

  private handleRemoveChromaticApproachesClick = () => {
    this.updateActiveSession({
      modifiers: {
        ...this.state.modifiers,
        chromaticApproaches: {
          ...this.state.modifiers.chromaticApproaches,
          enabled: false,
        },
      },
    })
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
      },
    ]

    this.updateActiveSession({ noteCards: newNoteCards })
    this.closeNoteAddingModal()
  }

  private renderApp = () => {
    const { classes } = this.props
    const {
      isSignedIn,
      bpm,
      rests,
      countInCounts,
      countInEnabled,
      metronomeEnabled,
      noteCards,
      staffTicks,
      staffTicksPerCard,
      isPlaying,
      activeNoteCardIndex,
      activeStaffTickIndex,
      noteCardWithMouseOver,
    } = this.state

    const isMobileMenu = this.props.width === 'xs' || this.props.width === 'sm'

    const activeNoteCard = isPlaying
      ? noteCards[activeNoteCardIndex]
      : undefined
    const activeStaffTick = isPlaying
      ? staffTicks[activeStaffTickIndex]
      : undefined

    const activeNoteCardStaffTicks = activeNoteCard
      ? staffTicksPerCard[activeNoteCard.id]
      : undefined

    const noteCardWithMouseOverStaffTicks = noteCardWithMouseOver
      ? staffTicksPerCard[noteCardWithMouseOver.id]
      : undefined

    const currentUser = firebase.auth().currentUser

    const ShuffleButton = (
      <Tooltip title="Reshuffle cards">
        <Button
          variant="contained"
          m={[1, 2]}
          onClick={this.handleShuffleClick}
        >
          <ArrowsIcon className={css({ margin: '0 0.5rem' })} />
        </Button>
      </Tooltip>
    )
    const ToggleCountInButton = (
      <Tooltip
        title={countInEnabled ? 'Turn off count in' : 'Turn on count in'}
      >
        <Button
          color={countInEnabled ? 'primary' : 'default'}
          m={[1, 2]}
          onClick={this.handleCountInToggle}
        >
          <TimerIcon className={css({ margin: '0 0.5rem' })} />
        </Button>
      </Tooltip>
    )
    const ToggleMetronomeButton = (
      <Tooltip
        title={metronomeEnabled ? 'Turn metronome off' : 'Turn metronome on'}
      >
        <Button
          color={metronomeEnabled ? 'primary' : 'default'}
          m={[1, 2]}
          onClick={this.handleMetronomeToggle}
        >
          <MetronomeIcon className={css({ margin: '0 0.5rem' })} />
        </Button>
      </Tooltip>
    )

    const CountInTextInput = (
      <TextField
        className={css({
          marginLeft: '15px',
          maxWidth: '65px',
        })}
        InputProps={{
          className: css({ fontSize: '1.3rem' }),
        }}
        label="Count in"
        id="countInCounts"
        disabled={!countInEnabled}
        type="number"
        // @ts-ignore
        step="1"
        min="0"
        max="16"
        value={`${countInCounts}`}
        onChange={this.handleCountInCountsChange}
      />
    )
    const RestsTextInput = (
      <TextField
        className={css({
          marginLeft: '15px',
          maxWidth: '50px',
        })}
        InputProps={{
          className: css({ fontSize: '1.3rem' }),
        }}
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
    )
    const TempoTextInput = (
      <TextField
        className={css({ maxWidth: '95px' })}
        label="Tempo"
        InputProps={{
          endAdornment: <InputAdornment position="end">BPM</InputAdornment>,
          className: css({ fontSize: '1.3rem' }),
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
    )
    const SessionControls = (
      <Box mb={1}>
        {TempoTextInput}
        {RestsTextInput}
        {CountInTextInput}
        {ToggleCountInButton}
        {ToggleMetronomeButton}
      </Box>
    )

    const TogglePlaybackButton = (
      <Button
        title={isPlaying ? 'Stop' : 'Play'}
        bg={isPlaying ? 'red' : '#00c200'}
        m={[1, 2]}
        className={css({ maxWidth: '100px' })}
        onClick={this.togglePlayback}
      >
        {isPlaying ? (
          <StopIcon className={css({ margin: '0 0.5rem' })} />
        ) : (
          <PlayIcon className={css({ margin: '0 0.5rem' })} />
        )}
        <Hidden xsDown>{isPlaying ? 'Stop' : 'Play'}</Hidden>
      </Button>
    )

    const ToolbarContent = (
      <>
        <IconButton
          color="inherit"
          aria-label={this.state.isMenuOpen ? 'Close menu' : 'Open menu'}
          onClick={this.state.isMenuOpen ? this.closeMenu : this.openMenu}
          className={cx(
            classes.menuButton,
            !isMobileMenu && this.state.isMenuOpen && classes.hide,
          )}
        >
          <MenuIcon />
        </IconButton>

        {!isSignedIn && (
          <MuiButton
            color="secondary"
            variant="raised"
            onClick={!isSignedIn ? this.openSignInModal : undefined}
          >
            <SaveIcon />
            <Hidden xsDown>Save</Hidden>
          </MuiButton>
        )}

        <Box className={css({ flexGrow: 1 })} />

        {!isSignedIn ? (
          <MuiButton
            // color="primary"
            color="secondary"
            onClick={this.openSignInModal}
            variant="raised"
          >
            Sign in
          </MuiButton>
        ) : (
          <MuiButton color="inherit" onClick={this.signOut} variant="flat">
            <Avatar
              className={css({
                height: 30,
                width: 30,
              })}
              src={
                currentUser && currentUser.photoURL
                  ? currentUser.photoURL
                  : undefined
              }
            >
              {currentUser && currentUser.displayName
                ? currentUser.displayName
                : null}
            </Avatar>
            <Text ml={2}>Log out</Text>
          </MuiButton>
        )}
      </>
    )

    const ModifierChips = (
      <>
        {this.state.modifiers.chords.enabled && (
          <Tooltip title="Change chords settings" disableFocusListener>
            <Chip
              clickable
              color="primary"
              variant="outlined"
              label={`Chords: ${this.state.modifiers.chords.chordType}`}
              onClick={this.openArpeggioAddingModal}
              onDelete={this.handleRemoveArpeggioClick}
              deleteIcon={
                <Tooltip variant="gray" title="Remove chords" placement="right">
                  <DeleteIcon />
                </Tooltip>
              }
              classes={{
                root: css({ marginRight: '0.5rem' }),
              }}
            />
          </Tooltip>
        )}
        {this.state.modifiers.scales.enabled && (
          <Tooltip title="Change scales settings" disableFocusListener>
            <Chip
              color="primary"
              variant="outlined"
              label={`Scale: ${
                (scaleByScaleType[
                  this.state.modifiers.scales.scaleType
                ] as Scale).title
              }`}
              onClick={this.openScalesModal}
              onDelete={this.handleRemoveScalesClick}
              deleteIcon={
                <Tooltip variant="gray" title="Remove scales" placement="right">
                  <DeleteIcon />
                </Tooltip>
              }
              classes={{
                root: css({ marginRight: '0.5rem' }),
              }}
            />
          </Tooltip>
        )}

        {this.state.modifiers.intervals.enabled && (
          <Tooltip title="Change intervals settings" disableFocusListener>
            <Chip
              color="primary"
              variant="outlined"
              label={`Intervals: ${
                SemitonesToIntervalShortNameMap[
                  this.state.modifiers.intervals.interval
                ]
              }`}
              onClick={this.openIntervalsModal}
              onDelete={this.handleRemoveIntervalsClick}
              deleteIcon={
                <Tooltip
                  variant="gray"
                  title="Remove intervals"
                  placement="right"
                >
                  <DeleteIcon />
                </Tooltip>
              }
              classes={{
                root: css({ marginRight: '0.5rem' }),
              }}
            />
          </Tooltip>
        )}

        {this.state.modifiers.chromaticApproaches.enabled && (
          <Tooltip title="Change enclosures settings" disableFocusListener>
            <Chip
              color="primary"
              variant="outlined"
              label={`Enclosure: ${
                this.state.modifiers.chromaticApproaches.type
              }`}
              deleteIcon={
                <Tooltip title="Remove enclosures" placement="right">
                  <DeleteIcon />
                </Tooltip>
              }
              onClick={this.openChromaticApproachesModal}
              onDelete={this.handleRemoveChromaticApproachesClick}
              classes={{
                root: css({ marginRight: '0.5rem' }),
              }}
            />
          </Tooltip>
        )}
      </>
    )

    const notesStaffLines =
      this.state.height >= 700
        ? Math.max(
            1,
            Math.min(
              this.state.height >= 900 ? 3 : 2,
              Math.ceil(this.state.staffTicks.length / 20),
            ),
          )
        : 1

    const MenuContent = (
      <>
        <div className={classes.drawerHeader}>
          <IconButton onClick={this.closeMenu}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />
        <List>
          <ListItem button onClick={this.openSettingsModal}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
        </List>
        <Divider />
        <List dense>
          <ListSubheader>Your sessions</ListSubheader>
          {['My first session', 'Scales drill', 'Learning triads'].map(
            (text, index) => (
              <ListItem selected={index === 0} button key={text}>
                <ListItemText primary={text} />
              </ListItem>
            ),
          )}
        </List>
      </>
    )

    return (
      <>
        <MeasureScreenSize onUpdate={this.handleScreenSizeUpdate} fireOnMount>
          <Fade in appear timeout={{ enter: 1000 }}>
            <div className={classes.root}>
              <AppBar
                position="fixed"
                className={cx(
                  !isMobileMenu && this.state.isMenuOpen && classes.appBarShift
                )}
              >
                <Toolbar variant="dense">{ToolbarContent}</Toolbar>
              </AppBar>

              <Hidden mdUp implementation="js">
                <SwipeableDrawer
                  variant="temporary"
                  anchor="left"
                  open={this.state.isMenuOpen}
                  onOpen={this.openMenu}
                  onClose={this.closeMenu}
                  classes={{
                    paper: classes.drawerPaper,
                  }}
                  ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                  }}
                >
                  {MenuContent}
                </SwipeableDrawer>
              </Hidden>

              <Hidden smDown implementation="js">
                <Drawer
                  className={classes.drawer}
                  variant="persistent"
                  anchor="left"
                  open={this.state.isMenuOpen}
                  classes={{
                    paper: classes.drawerPaper,
                  }}
                >
                  {MenuContent}
                </Drawer>
              </Hidden>

              <div
                id="app-content"
                className={cx(
                  classes.content,
                  !isMobileMenu && classes.contentShifted,
                  !isMobileMenu &&
                    this.state.isMenuOpen &&
                    classes.contentShift,
                )}
              >
                <Flex
                  pt={[3, 3, 4]}
                  flex={1}
                  px={[3, 4, 4]}
                  maxWidth={960}
                  width={1}
                  justifyContent="center"
                  alignItems="center"
                  flexDirection="column"
                >
                  <Flex
                    alignItems="center"
                    flexDirection="row"
                    mb={3}
                    width={1}
                    flexWrap="wrap"
                    justifyContent="center"
                  >
                    <Box
                      flex="1"
                      className={css({ whiteSpace: 'nowrap' })}
                      mb={1}
                      mr={2}
                    >
                      {TogglePlaybackButton}
                      {ShuffleButton}
                    </Box>

                    {SessionControls}
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
                    <Grow
                      in={this.state.isInitialized}
                      timeout={{ enter: 5000 }}
                      appear
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
                    </Grow>

                    <Flex
                      flexDirection="row-reverse"
                      alignItems="center"
                      width={1}
                      px={[1, 2, 2]}
                      mt={[4, 2, 3]}
                      mb={[2, 2, 3]}
                    >
                      <Fade in={this.state.isInitialized} appear>
                        <div>
                          <AddEntityButton
                            showHelpTooltip={
                              noteCards.length === 0 &&
                              !this.state.disableStartTooltips &&
                              !(isMobileMenu && this.state.isMenuOpen)
                            }
                            enableOnlyNote={noteCards.length === 0}
                            onAddSingleNoteClick={this.openNoteAddingModal}
                            onAddArpeggioClick={this.openArpeggioAddingModal}
                            onAddScaleClick={this.openScalesModal}
                            onAddChromaticApproachesClick={
                              this.openChromaticApproachesModal
                            }
                            onAddIntervalsClick={this.openIntervalsModal}
                            disableSingleNote={
                              this.state.noteCards.length >= 12
                            }
                            disableChords={
                              this.state.modifiers.chords.enabled ||
                              this.state.modifiers.scales.enabled ||
                              this.state.modifiers.intervals.enabled
                            }
                            disableScales={
                              this.state.modifiers.scales.enabled ||
                              this.state.modifiers.chords.enabled ||
                              this.state.modifiers.intervals.enabled
                            }
                            disableIntervals={
                              this.state.modifiers.scales.enabled ||
                              this.state.modifiers.chords.enabled ||
                              this.state.modifiers.intervals.enabled
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
                        </div>
                      </Fade>

                      <Flex flex-direction="row" flex={1} alignItems="center">
                        {ModifierChips}
                      </Flex>
                    </Flex>
                  </Flex>

                  <NotesStaff
                    lines={notesStaffLines}
                    isPlaying={isPlaying}
                    key={this.state.contentWidth}
                    showEnd
                    id="notation"
                    ticks={this.state.staffTicks}
                    activeTickIndex={
                      isPlaying ? activeStaffTickIndex : undefined
                    }
                    height={20 + 100 * notesStaffLines}
                  />
                </Flex>

                <Box mt={[1, 2, 3]}>
                  <PianoKeyboard
                    width={
                      this.state.width -
                      (!isMobileMenu && this.state.isMenuOpen ? menuWidth : 0)
                    }
                    height={this.getPianoHeight()}
                    secondaryNotesMidi={
                      activeNoteCardStaffTicks
                        ? _.flatten(
                            activeNoteCardStaffTicks.map(t =>
                              t.notes.map(n => n.midi),
                            ),
                          )
                        : noteCardWithMouseOverStaffTicks
                          ? _.flatten(
                              noteCardWithMouseOverStaffTicks.map(t =>
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
              </div>
            </div>
          </Fade>

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
            initialValues={this.state.modifiers.chords}
          />

          <IntervalModifierModal
            isOpen={this.state.intervalsModalIsOpen}
            onClose={this.closeIntervalsModal}
            onSubmit={this.handleIntervalsModifierModalConfirm}
            initialValues={this.state.modifiers.intervals}
          />

          <ScaleModifierModal
            isOpen={this.state.scalesModalIsOpen}
            onClose={this.closeScalesModal}
            onSubmit={this.handleScaleModifierModalConfirm}
            initialValues={this.state.modifiers.scales}
          />

          <ChromaticApproachesModifierModal
            isOpen={this.state.chromaticApproachesModalIsOpen}
            onClose={this.closeChromaticApproachesModal}
            onSubmit={this.handleChromaticApproachModifierModalConfirm}
            defaultType={this.state.modifiers.chromaticApproaches.type}
          />

          <PickNoteModal
            isOpen={this.state.noteAddingModalIsOpen}
            onClose={this.closeNoteAddingModal}
            onSubmit={this.handleNoteClickInNoteCardAddingModal}
            enharmonicFlatsMap={this.state.enharmonicFlatsMap}
            onEnharmonicFlatsMapToggle={this.handleEnharmonicMapToggle}
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
              onEnharmonicFlatsMapToggle={this.handleEnharmonicMapToggle}
            />
          )}
        </MeasureScreenSize>
      </>
    )
  }

  private renderLoader = () => {
    return (
      <Flex flexDirection="column" alignItems="center">
        <Typography variant="h4" color="primary">
          Random Variations
        </Typography>
        <Fade in appear timeout={{ enter: 1000 }}>
          <Typography variant="h6" color="secondary">
            Your music practice app
          </Typography>
        </Fade>
        <Box mt={3}>
          <CircularProgress size={50} />
        </Box>
      </Flex>
    )
  }

  private closeOfflineNotification = () => {
    this.setState({ isOfflineNotificationShown: false })
  }

  private closeOnlineNotification = () => {
    this.setState({ isOnlineNotificationShown: false })
  }

  private renderOfflineNotification = () => {
    if (!this.state.isOfflineNotificationShown) {
      return null
    }

    return (
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        open={this.state.isOfflineNotificationShown}
        onClose={this.closeOfflineNotification}
        ContentProps={{
          className: css({ backgroundColor: '#FF7E79' }),
          'aria-describedby': 'offline-notification-message',
        }}
        message={
          <span id="offline-notification-message">
            You're offline - you won't be able to use your saved sessions and a
            few other features
          </span>
        }
        action={[
          <IconButton
            key="close"
            aria-label="Close"
            color="inherit"
            onClick={this.closeOfflineNotification}
          >
            <CloseIcon />
          </IconButton>,
        ]}
      />
    )
  }

  private renderOnlineNotification = () => {
    if (!this.state.isOnlineNotificationShown) {
      return null
    }

    return (
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        autoHideDuration={5000}
        open={this.state.isOnlineNotificationShown}
        onClose={this.closeOnlineNotification}
        ContentProps={{
          className: css({ backgroundColor: '#4BCB7C' }),
          'aria-describedby': 'online-notification-message',
        }}
        message={
          <span id="online-notification-message">You're back online!</span>
        }
        action={[
          <IconButton
            key="close"
            aria-label="Close"
            color="inherit"
            onClick={this.closeOnlineNotification}
          >
            <CloseIcon />
          </IconButton>,
        ]}
      />
    )
  }

  public render() {
    return (
      <ThemeProvider theme={theme}>
        <AudioEngineContext.Provider
          value={{ audioEngine, audioFontId: this.state.audioFontId }}
        >
          <FirebaseContext.Provider value={firebase}>
            <JssProvider jss={jss} generateClassName={generateClassName}>
              <>
                <CssBaseline />

                {this.renderOfflineNotification()}
                {this.renderOnlineNotification()}

                <Flex
                  height="100vh"
                  width="100vw"
                  alignItems="center"
                  justifyContent="center"
                  css="overflow: hidden;"
                  flexDirection="column"
                >
                  {this.state.isInitialized
                    ? this.renderApp()
                    : this.renderLoader()}
                </Flex>
              </>
            </JssProvider>
          </FirebaseContext.Provider>
        </AudioEngineContext.Provider>
      </ThemeProvider>
    )
  }
}

// @ts-ignore
export default withStyles(styles, { withTheme: true })(withWidth()(App))
