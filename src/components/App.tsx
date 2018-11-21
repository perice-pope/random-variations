import * as React from 'react'
import { ThemeProvider } from 'emotion-theming'
import { css, cx } from 'react-emotion'
import _ from 'lodash'
import * as tonal from 'tonal'
import * as Chord from 'tonal-chord'
import { RouteComponentProps } from 'react-router'
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

import SettingsIcon from '@material-ui/icons/Settings'
import PlayIcon from '@material-ui/icons/PlayArrow'
import StopIcon from '@material-ui/icons/Stop'
import MenuIcon from '@material-ui/icons/Menu'
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft'
import DeleteIcon from '@material-ui/icons/Close'
import PlusIcon from '@material-ui/icons/Add'
import EditIcon from '@material-ui/icons/Edit'
import ShareIcon from '@material-ui/icons/Share'
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
  timeago,
  parseIntEnsureInBounds,
} from '../utils'

import theme from '../styles/theme'
import globalStyles from '../styles/globalStyles'

import NoteCards from './NoteCards'

import {
  NoteCardType,
  StaffTick,
  ChromaticApproachesType,
  PlayableLoopTick,
  PlayableLoop,
  EnharmonicFlatsMap,
  ChromaticNoteSharps,
  User,
  Session,
  Scale,
  SessionNoteCard,
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
import { reaction, toJS } from 'mobx'
import { observer } from 'mobx-react'
import MobxDevTools from 'mobx-react-devtools'
import {
  generateStaffTicks,
  scaleByScaleType,
  SemitonesToIntervalShortNameMap,
} from '../musicUtils'
import AudioFontsConfig, { AudioFontId } from '../audioFontsConfig'
import AudioEngine, { AnimationCallback } from '../services/audioEngine'
import { AudioEngineContext } from './withAudioEngine'
import firebase, { FirebaseContext } from '../services/firebase'
import sessionStore from '../services/sessionStore'
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
  ListItemSecondaryAction,
  Menu,
  MenuItem,
} from '@material-ui/core'
import { WithWidth } from '@material-ui/core/withWidth'
import memoize from 'memoize-one'
import ToastNotifications, { notificationsStore } from './ToastNotifications'
import ButtonWithMenu from './ButtonWithMenu'

globalStyles()

// @ts-ignore
window.notificationsStore = notificationsStore

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

  isPlaying: boolean

  audioFontId: AudioFontId
  enharmonicFlatsMap: EnharmonicFlatsMap

  noteCardWithMouseOver?: NoteCardType

  staffTicks: StaffTick[]
  tickLabels: { [tickIndex: number]: string }
  staffTicksPerCard: { [noteCardId: string]: StaffTick[] }
  activeNoteCardIndex: number
  activeStaffTickIndex: number

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

const getNoteCardsFromSessionCards = memoize(
  (sessionNoteCards: SessionNoteCard[]) => {
    const noteCards: NoteCardType[] = (sessionNoteCards || []).map(nc => ({
      id: nc.id || uuid(),
      noteName: nc.noteName,
      text: tonal.Note.pc(nc.noteName) as string,
      midi: tonal.Note.midi(nc.noteName) as number,
      freq: tonal.Note.freq(nc.noteName) as number,
      color: getNoteCardColorByNoteName(nc.noteName),
    }))

    const noteCardsById = _.keyBy(noteCards, 'id')

    return {
      noteCards: noteCards as NoteCardType[],
      noteCardsById,
    }
  },
)

const menuWidth = 280

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

@observer
class App extends React.Component<
  WithStyles &
    WithWidth &
    RouteComponentProps<{ sessionKey?: string; sharedSessionKey?: string }>,
  AppState
> {
  // @ts-ignore
  private unregisterAuthObserver: firebase.Unsubscribe

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

      enharmonicFlatsMap: {},

      // Screen size
      height: 0,
      width: 0,
      notesStaffWidth: 0,

      isPlaying: false,
      staffTicks: [],
      tickLabels: {},
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

    reaction(
      () =>
        sessionStore.activeSession
          ? toJS(sessionStore.activeSession)
          : undefined,
      () => {
        this.onNotesUpdated()
      },
      {
        delay: 300,
      },
    )

    reaction(
      () =>
        sessionStore.activeSession ? sessionStore.activeSession.bpm : undefined,
      (bpm?: number) => {
        if (bpm != null) {
          audioEngine.setBpm(Math.max(1, bpm))
        }
      },
      {
        delay: 500,
      },
    )

    reaction(
      () =>
        sessionStore.activeSession
          ? toJS({
              countInCounts: sessionStore.activeSession.countInCounts,
              countInEnabled: sessionStore.activeSession.countInEnabled,
            })
          : {},
      ({
        countInCounts,
        countInEnabled,
      }: {
        countInCounts?: number
        countInEnabled?: boolean
      }) => {
        if (countInCounts != null && countInEnabled === true) {
          audioEngine.setCountIn(countInCounts)
        } else {
          audioEngine.setCountIn(0)
        }
      },
      {
        delay: 500,
      },
    )

    reaction(
      () =>
        sessionStore.activeSession
          ? sessionStore.activeSession.metronomeEnabled
          : undefined,
      (metronomeEnabled?: boolean) => {
        if (metronomeEnabled != null) {
          audioEngine.setMetronomeEnabled(metronomeEnabled)
        }
      },
    )
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
        const isSharedSession = !!this.props.match.params.sharedSessionKey
        const shouldLoadUserSessions = user && !user.isAnonymous

        const loadAndActivateOfflineSession = async () => {
          await sessionStore.loadAndActivateOfflineSession()
          await sessionStore.clearMySessions()
          if (!this.props.match.params.sessionKey) {
            this.props.history.replace('/')
          }
        }

        console.log('shouldLoadUserSessions', shouldLoadUserSessions)

        if (shouldLoadUserSessions) {
          await sessionStore.loadMySessions()
          if (!isSharedSession) {
            this.activateMySession(this.props.match.params.sessionKey)
          }
        } else if (!isSharedSession) {
          notificationsStore.showNotification({
            message: `This is a demo mode - your practice session won't be saved. Please sign in to be able to save your sessions.`,
            level: 'info',
            autohide: 15000,
          })
          await loadAndActivateOfflineSession()
        }

        if (isSharedSession) {
          try {
            await sessionStore.loadAndActivateSharedSession(
              this.props.match.params.sharedSessionKey,
            )
            notificationsStore.showNotification({
              message: `This practice session belongs to another user - any changes you make won't be saved. But feel free to click on "Save" button to create your own copy of this session.`,
              level: 'info',
              autohide: 15000,
            })
          } catch (error) {
            console.error(error)
            notificationsStore.showNotification({
              message:
                'Could not load session - link is invalid, or the session has been removed by its author',
              level: 'warning',
              autohide: 15000,
            })
            if (shouldLoadUserSessions) {
              this.activateMySession(this.props.match.params.sessionKey)
            } else {
              await loadAndActivateOfflineSession()
            }
          }
        }
      },
    )

    if (user && this.state.signInModalIsOpen) {
      this.closeSignInModal()
    }
  }

  private activateMySession = (sessionKey?: string) => {
    console.log('activateMySession: ', sessionKey)
    const firstSession = sessionStore.mySessionsSorted[0]
    let key = sessionKey
    if (!sessionKey && firstSession) {
      key = firstSession.key
    }
    try {
      sessionStore.activateMySessionByKey(key)
      if (this.props.match.params.sessionKey !== key) {
        this.props.history.replace(`/s/${key}`)
      }
    } catch (e) {
      console.error(e)

      key = firstSession.key
      sessionStore.activateMySessionByKey(key)
      if (this.props.match.params.sessionKey !== key) {
        this.props.history.replace(`/s/${key}`)
      }
    }
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

  private init = async () => {
    await this.initAudioEngine()
    if (this.state.isInitialized) {
      return
    }

    this.restoreLocalState()

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
    if (!sessionStore.activeSession) {
      return
    }

    const { modifiers, rests } = sessionStore.activeSession
    const { noteCards } = this.getNoteCards()

    const { ticks: staffTicks, tickLabels } = generateStaffTicks({
      noteCards,
      modifiers,
      rests,
    })
    const staffTicksPerCard = _.groupBy(staffTicks, 'noteCardId')

    return new Promise(resolve => {
      this.setState({ staffTicks, tickLabels, staffTicksPerCard }, () => {
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
    if (sessionStore.activeSession) {
      sessionStore.activeSession.noteCards = [
        sessionStore.activeSession.noteCards[0],
        ...shuffle(sessionStore.activeSession.noteCards.slice(1)),
      ]
    }
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

  private saveAppState = () => {
    console.log('saveAppState')
    this.saveLocalAppState()
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

      const { noteCards } = this.getNoteCards()
      // TODO: optimize this serial search code to a hash lookup
      const nextNoteCardIndex = noteCards.findIndex(
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

  private getNoteCards = () => {
    if (!sessionStore.activeSession) {
      return { noteCards: undefined, noteCardsById: undefined }
    }
    return getNoteCardsFromSessionCards(sessionStore.activeSession.noteCards)
  }

  private handleBpmChange = e => {
    const value = parseIntEnsureInBounds(e.target.value, 0, 400)
    if (sessionStore.activeSession) {
      sessionStore.activeSession.bpm = value
    }
  }

  private handleCountInCountsChange = e => {
    const value = parseIntEnsureInBounds(e.target.value, 0, 16)
    if (sessionStore.activeSession) {
      sessionStore.activeSession.countInCounts = value
    }
  }

  private handleCountInToggle = () => {
    if (sessionStore.activeSession) {
      sessionStore.activeSession.countInEnabled = !Boolean(
        sessionStore.activeSession.countInEnabled,
      )
    }
  }

  private handleMetronomeToggle = () => {
    if (sessionStore.activeSession) {
      sessionStore.activeSession.metronomeEnabled = !Boolean(
        sessionStore.activeSession.metronomeEnabled,
      )
    }
  }

  private handleRestsChange = e => {
    const value = parseIntEnsureInBounds(e.target.value, 0, 16)
    if (sessionStore.activeSession) {
      sessionStore.activeSession.rests = value
    }
  }

  private handleAudioFontChanged = async (audioFontId: AudioFontId) => {
    await this.loadAndSetAudioFont(audioFontId)
    audioEngine.playNote({ midi: tonal.Note.midi('C4') as number }, 0, 0.5)
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
    if (sessionStore.activeSession) {
      sessionStore.activeSession.noteCards = sessionStore.activeSession.noteCards.filter(
        nc => nc.id !== noteCard.id,
      )
    }
  }

  private handleCardsReorder = ({ oldIndex, newIndex }) => {
    if (sessionStore.activeSession) {
      sessionStore.activeSession.noteCards = arrayMove(
        sessionStore.activeSession.noteCards,
        oldIndex,
        newIndex,
      )
    }
  }

  private handleContentWidthUpdate = () => {
    const contentElement = document.getElementById('app-content') as HTMLElement
    if (!contentElement) {
      return
    }

    const contentWidth = (contentElement as HTMLElement).getBoundingClientRect()
      .width

    this.setState({ contentWidth })
  }

  private toggleTooltipVisibility = () => {
    this.setState({ disableStartTooltips: true }, () => {
      setTimeout(() => {
        this.setState({ disableStartTooltips: false })
      }, 200)
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
    if (sessionStore.activeSession) {
      sessionStore.activeSession.noteCards = sessionStore.activeSession.noteCards.map(
        nc => {
          if (nc.id !== noteCardId) {
            return nc
          }
          return {
            ...nc,
            noteName: noteName,
          }
        },
      )
    }
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
    if (sessionStore.activeSession) {
      sessionStore.activeSession.modifiers.chords = {
        ...values,
        enabled: true,
      }
    }
    this.closeArpeggioAddingModal()
  }

  private handleScaleModifierModalConfirm = (
    values: ScaleModifierModalSubmitValues,
  ) => {
    if (sessionStore.activeSession) {
      sessionStore.activeSession.modifiers.scales = {
        ...values,
        enabled: true,
      }
    }
    this.closeScalesModal()
  }

  private handleIntervalsModifierModalConfirm = (
    values: IntervalModifierModalSubmitValues,
  ) => {
    if (sessionStore.activeSession) {
      sessionStore.activeSession.modifiers.intervals = {
        ...values,
        enabled: true,
      }
    }

    this.closeIntervalsModal()
  }

  handleChromaticApproachModifierModalConfirm = ({
    type,
  }: {
    type: ChromaticApproachesType
  }) => {
    if (sessionStore.activeSession) {
      sessionStore.activeSession.modifiers.chromaticApproaches = {
        type,
        enabled: true,
      }
    }
    this.closeChromaticApproachesModal()
  }

  private handleRemoveArpeggioClick = () => {
    if (sessionStore.activeSession) {
      sessionStore.activeSession.modifiers.chords.enabled = false
    }
  }

  private handleRemoveScalesClick = () => {
    if (sessionStore.activeSession) {
      sessionStore.activeSession.modifiers.scales.enabled = false
    }
  }

  private handleRemoveIntervalsClick = () => {
    if (sessionStore.activeSession) {
      sessionStore.activeSession.modifiers.intervals.enabled = false
    }
  }

  private handleRemoveChromaticApproachesClick = () => {
    if (sessionStore.activeSession) {
      sessionStore.activeSession.modifiers.chromaticApproaches.enabled = false
    }
  }

  private handleCreateNewSessionClick = async () => {
    const sessionName = prompt(
      'Choose a name for the new session',
      'New session',
    )
    if (!sessionName) {
      return
    }

    await sessionStore.createAndActivateNewSession({
      name: sessionName,
    })
    notificationsStore.showNotification({
      message: `Created new session "${sessionName}"`,
      level: 'success',
      autohide: 3000,
    })
  }

  private saveSharedSessionToMySessions = async () => {
    const originalSession = sessionStore.activeSession!
    const sessionName = prompt(
      'Choose a name for your copy of this shared session',
      `Copy of "${originalSession.name}"`,
    )
    if (!sessionName) {
      return
    }

    const newSession = await sessionStore.createAndActivateNewSession({
      ...sessionStore.activeSession,
      name: sessionName,
    })
    this.props.history.replace(`/s/${newSession.key}`)
    notificationsStore.showNotification({
      message: `Saved "${
        originalSession.name
      }" in your sessions as "${sessionName}"`,
      level: 'success',
      autohide: 3000,
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
    if (sessionStore.activeSession) {
      sessionStore.activeSession.noteCards = [
        ...sessionStore.activeSession.noteCards,
        {
          noteName,
          id: uuid(),
        } as SessionNoteCard,
      ]
    }
    this.closeNoteAddingModal()
  }

  private handleDeleteSession = async session => {
    if (
      !confirm(
        `Do you really want to delete session${
          session.name ? ` "${session.name}"` : ''
        }?`,
      )
    ) {
      return
    }

    await sessionStore.deleteMySessionByKey(session.key)
    sessionStore.activateMySessionByKey(sessionStore.mySessionsSorted[0].key)
    notificationsStore.showNotification({
      message: `Deleted your session "${session.name}"`,
      level: 'success',
      autohide: 3000,
    })
  }

  private handleRenameSession = async (session: Session) => {
    const newName = prompt('Rename the session', session.name)
    if (!newName) {
      return
    }
    session.name = newName
    notificationsStore.showNotification({
      message: `Renamed your session "${session.name}" to "${newName}"`,
      level: 'success',
      autohide: 3000,
    })
  }

  private handleShareSession = async session => {
    const sharedKey = await sessionStore.shareMySessionByKey(session.key)
    alert(`Sharable link: ${window.location.origin}/shared/${sharedKey}`)
  }

  private renderApp = () => {
    console.log('renderApp', sessionStore.activeSession)
    if (!sessionStore.activeSession) {
      return
    }

    const { classes } = this.props
    const {
      isSignedIn,
      staffTicks,
      staffTicksPerCard,
      isPlaying,
      activeNoteCardIndex,
      activeStaffTickIndex,
      noteCardWithMouseOver,
    } = this.state

    const {
      bpm,
      rests,
      countInCounts,
      countInEnabled,
      metronomeEnabled,
      modifiers,
    } = sessionStore.activeSession

    const { noteCards } = this.getNoteCards()

    const isMobile = this.props.width === 'xs' || this.props.width === 'sm'

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
          disabled={noteCards.length < 3}
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
        disabled={noteCards.length < 1}
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
            !isMobile && this.state.isMenuOpen && classes.hide,
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

        {isSignedIn &&
          sessionStore.activeSessionType === 'shared' && (
            <MuiButton
              color="secondary"
              variant="raised"
              onClick={this.saveSharedSessionToMySessions}
            >
              <SaveIcon />
              <Hidden xsDown mdUp>
                Save
              </Hidden>
              <Hidden smDown>Save to my sessions</Hidden>
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
        {modifiers.chords.enabled && (
          <Tooltip title="Change chords settings" disableFocusListener>
            <Chip
              clickable
              color="primary"
              variant="outlined"
              label={`Chords: ${modifiers.chords.chordType}`}
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
        {modifiers.scales.enabled && (
          <Tooltip title="Change scales settings" disableFocusListener>
            <Chip
              color="primary"
              variant="outlined"
              label={`Scale: ${
                (scaleByScaleType[modifiers.scales.scaleType] as Scale).title
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

        {modifiers.intervals.enabled && (
          <Tooltip title="Change intervals settings" disableFocusListener>
            <Chip
              color="primary"
              variant="outlined"
              label={`Intervals: ${
                SemitonesToIntervalShortNameMap[modifiers.intervals.interval]
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

        {modifiers.chromaticApproaches.enabled && (
          <Tooltip title="Change enclosures settings" disableFocusListener>
            <Chip
              color="primary"
              variant="outlined"
              label={`Enclosure: ${modifiers.chromaticApproaches.type}`}
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

    let notesStaffLines = Math.max(
      1,
      this.state.height >= 500
        ? Math.ceil(
            this.state.staffTicks.length /
              (this.props.width === 'xs'
                ? 12
                : this.props.width === 'sm'
                  ? 16
                  : 20),
          )
        : 1,
    )

    if (this.state.height >= 900) {
      notesStaffLines = Math.min(notesStaffLines, 2)
    }
    console.log(this.state.staffTicks.length, notesStaffLines)

    let notesStaffScaleFactor = 1.0
    if (isMobile) {
      notesStaffScaleFactor = 0.6
    } else if (this.props.width === 'md') {
      notesStaffScaleFactor = 0.85
    }

    if (notesStaffLines > 1) {
      notesStaffScaleFactor *= 1 - 0.05 * notesStaffLines
    } else if (this.state.staffTicks.length > 10) {
      notesStaffScaleFactor *= 0.95
    }

    const sessionsSorted = sessionStore.mySessionsSorted

    const isLoggedIn = currentUser && !currentUser.isAnonymous

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

        <List dense className={css({ backgroundColor: 'white' })}>
          <ListSubheader
            className={css({
              display: 'flex',
              alignItems: 'center',
              fontSize: '1.2rem',
              paddingBottom: '0.5rem',
            })}
          >
            <span className={css({ flex: 1 })}>{'My sessions '}</span>
            {isLoggedIn && (
              <Tooltip title="Create a new session">
                <Button
                  variant="text"
                  onClick={this.handleCreateNewSessionClick}
                  color="secondary"
                >
                  <PlusIcon /> New
                </Button>
              </Tooltip>
            )}
          </ListSubheader>
          {!isLoggedIn && (
            <>
              <ListItem>
                Please sign in to be able to store your practice sessions:
              </ListItem>
              <ListItem>
                <MuiButton
                  // color="primary"
                  color="secondary"
                  onClick={this.openSignInModal}
                  variant="raised"
                >
                  Sign in
                </MuiButton>
              </ListItem>
            </>
          )}
          {isLoggedIn &&
            sessionsSorted.map(session => (
              <ListItem
                selected={
                  sessionStore.activeSession &&
                  session.key === sessionStore.activeSession.key
                }
                button
                key={session.key}
                onClick={() => this.activateMySession(session.key)}
              >
                <ListItemText
                  primary={session.name || 'Unnamed session'}
                  secondary={
                    session.createdAt ? (
                      <>
                        {'Created '}
                        {timeago(session.createdAt)}
                      </>
                    ) : (
                      undefined
                    )
                  }
                />
                <ListItemSecondaryAction>
                  <ButtonWithMenu
                    renderButton={props => (
                      <IconButton aria-label="Open session menu" {...props}>
                        <MenuIcon />
                      </IconButton>
                    )}
                    renderMenu={props => (
                      <Menu id={`session-menu-${session.key}`} {...props}>
                        <MenuItem
                          onClick={() => {
                            this.handleShareSession(session)
                          }}
                        >
                          <ShareIcon color="action" /> Share
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            this.handleRenameSession(session)
                          }}
                        >
                          <EditIcon color="action" /> Rename
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            this.handleDeleteSession(session)
                          }}
                        >
                          <DeleteIcon color="action" /> Delete
                        </MenuItem>
                      </Menu>
                    )}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
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
                  !isMobile && this.state.isMenuOpen && classes.appBarShift,
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
                  !isMobile && classes.contentShifted,
                  !isMobile && this.state.isMenuOpen && classes.contentShift,
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
                              !(isMobile && this.state.isMenuOpen)
                            }
                            enableOnlyNote={noteCards.length === 0}
                            onAddSingleNoteClick={this.openNoteAddingModal}
                            onAddArpeggioClick={this.openArpeggioAddingModal}
                            onAddScaleClick={this.openScalesModal}
                            onAddChromaticApproachesClick={
                              this.openChromaticApproachesModal
                            }
                            onAddIntervalsClick={this.openIntervalsModal}
                            disableSingleNote={noteCards.length >= 12}
                            disableChords={
                              modifiers.chords.enabled ||
                              modifiers.scales.enabled ||
                              modifiers.intervals.enabled
                            }
                            disableScales={
                              modifiers.scales.enabled ||
                              modifiers.chords.enabled ||
                              modifiers.intervals.enabled
                            }
                            disableIntervals={
                              modifiers.scales.enabled ||
                              modifiers.chords.enabled ||
                              modifiers.intervals.enabled
                            }
                            disableChromaticApproaches={
                              modifiers.chromaticApproaches.enabled
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
                    scale={notesStaffScaleFactor}
                    lines={notesStaffLines}
                    isPlaying={isPlaying}
                    key={this.state.contentWidth}
                    showEnd
                    id="notation"
                    ticks={this.state.staffTicks}
                    tickLabels={!isMobile ? this.state.tickLabels : undefined}
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
                      (!isMobile && this.state.isMenuOpen ? menuWidth : 0)
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
            initialValues={modifiers.chords}
          />

          <IntervalModifierModal
            isOpen={this.state.intervalsModalIsOpen}
            onClose={this.closeIntervalsModal}
            onSubmit={this.handleIntervalsModifierModalConfirm}
            initialValues={modifiers.intervals}
          />

          <ScaleModifierModal
            isOpen={this.state.scalesModalIsOpen}
            onClose={this.closeScalesModal}
            onSubmit={this.handleScaleModifierModalConfirm}
            initialValues={modifiers.scales}
          />

          <ChromaticApproachesModifierModal
            isOpen={this.state.chromaticApproachesModalIsOpen}
            onClose={this.closeChromaticApproachesModal}
            onSubmit={this.handleChromaticApproachModifierModalConfirm}
            defaultType={modifiers.chromaticApproaches.type}
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
                {process.env.NODE_ENV !== 'production' ? (
                  <MobxDevTools />
                ) : null}
                <ToastNotifications />

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
