import * as React from 'react'
import { ThemeProvider } from 'emotion-theming'
import { css, cx } from 'react-emotion'
import _ from 'lodash'
import * as tonal from 'tonal'
import { RouteComponentProps } from 'react-router'
import uuid from 'uuid/v4'
import smoothscroll from 'smoothscroll-polyfill'

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

import ZoomInIcon from '@material-ui/icons/ZoomIn'
import ZoomOutIcon from '@material-ui/icons/ZoomOut'
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
import FullscreenIcon from '@material-ui/icons/Fullscreen'
import FullscreenExitIcon from '@material-ui/icons/FullscreenExit'
import ArrowsIcon from '@material-ui/icons/Cached'
import TimerIcon from '@material-ui/icons/Timer'
import MetronomeIcon from 'mdi-material-ui/Metronome'
import TextField from '@material-ui/core/TextField'
import InputAdornment from '@material-ui/core/InputAdornment'

import Chip from '@material-ui/core/Chip'

import { Flex, Box, Button } from './ui'
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
import PianoKeyboard, {
  pianoNoteRangeWide,
  pianoNoteRangeNarrow,
  pianoNoteRangeMiddle,
} from './PianoKeyboard'

import SettingsModal, { SettingsFormValues } from './SettingsModal'
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
  ListItemAvatar,
} from '@material-ui/core'
import { WithWidth } from '@material-ui/core/withWidth'
import memoize from 'memoize-one'
import { observable } from 'mobx'
import ToastNotifications, { notificationsStore } from './ToastNotifications'
import ButtonWithMenu from './ButtonWithMenu'
import ShareSessionModal from './ShareSessionModal'
import settingsStore from '../services/settingsStore'
import ToneRowModal from './ToneRowModal'

globalStyles()
smoothscroll.polyfill()

// @ts-ignore
window.notificationsStore = notificationsStore

console.log('All supported audio fonts: ', _.map(AudioFontsConfig, 'title'))

const uiState = observable({
  isFullScreen: false,
  isControlsShown: false,
})

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

  noteCardWithMouseOver?: NoteCardType

  staffTicks: StaffTick[]
  tickLabels: { [tickIndex: number]: string }
  staffTicksPerCard: { [noteCardId: string]: StaffTick[] }
  activeNoteCardId?: string
  activeStaffTickIndex: number

  height: number
  width: number
  contentWidth: number
  modifersContentWidth: number
  notesStaffWidth: number

  signInModalIsOpen: boolean
  settingsModalIsOpen: boolean
  shareSessionModalIsOpen: boolean
  shareSessionModalSession?: Session

  // Modifier dialogs
  chromaticApproachesModalIsOpen: boolean
  chordsModalIsOpen: boolean
  scalesModalIsOpen: boolean
  intervalsModalIsOpen: boolean

  noteAddingModalIsOpen: boolean
  toneRowAddingModalIsOpen: boolean
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

const MaxNoteCards = 12
const MaxLayoutWidth = 1100
const MenuWidth = 280

const styles = theme => ({
  root: {
    display: 'flex',
    height: '100%',
    width: '100%',
    overflowX: 'hidden',
  },
  appBar: {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    width: `calc(100% - ${MenuWidth}px)`,
    marginLeft: MenuWidth,
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
    width: MenuWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: MenuWidth,
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
    marginLeft: -MenuWidth,
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  },
})

function toggleFullScreen() {
  var doc = window.document as any
  var docEl = doc.documentElement as any

  if (!docEl) {
    return
  }

  var requestFullScreen =
    docEl.requestFullscreen ||
    docEl.mozRequestFullScreen ||
    docEl.webkitRequestFullScreen ||
    docEl.msRequestFullscreen
  var cancelFullScreen =
    doc.exitFullscreen ||
    doc.mozCancelFullScreen ||
    doc.webkitExitFullscreen ||
    doc.msExitFullscreen

  if (
    !doc.fullscreenElement &&
    !doc.mozFullScreenElement &&
    !doc.webkitFullscreenElement &&
    !doc.msFullscreenElement
  ) {
    requestFullScreen.call(docEl)
    uiState.isFullScreen = true
  } else {
    cancelFullScreen.call(doc)
    uiState.isFullScreen = false
  }
}

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

      // Screen size
      height: 0,
      width: 0,
      notesStaffWidth: 0,
      contentWidth: 0,
      modifersContentWidth: 0,

      isPlaying: false,
      staffTicks: [],
      tickLabels: {},
      staffTicksPerCard: {},
      activeStaffTickIndex: 0,

      signInModalIsOpen: false,
      isSignedIn: false,

      chromaticApproachesModalIsOpen: false,
      chordsModalIsOpen: false,
      scalesModalIsOpen: false,
      intervalsModalIsOpen: false,
      noteAddingModalIsOpen: false,
      toneRowAddingModalIsOpen: false,

      settingsModalIsOpen: false,
      shareSessionModalIsOpen: false,
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

        this.setState({ isInitialized: true })
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

  private init = async () => {
    settingsStore.loadSettingsLocally()
    await this.initAudioEngine()
    if (this.state.isInitialized) {
      return
    }

    this.unregisterAuthObserver = firebase
      .auth()
      .onAuthStateChanged(this.onAuthStateChanged)
  }

  private initAudioEngine = async () => {
    console.log('initAudioEngine', sessionStore.activeSession)
    audioEngine.setAnimationCallback(this.drawAnimation)

    if (sessionStore.activeSession) {
      audioEngine.setBpm(sessionStore.activeSession.bpm)
      audioEngine.setCountIn(
        sessionStore.activeSession.countInEnabled
          ? sessionStore.activeSession.countInCounts
          : 0,
      )
      audioEngine.setMetronomeEnabled(
        sessionStore.activeSession.metronomeEnabled,
      )
    }

    await this.loadAndSetAudioFont(settingsStore.audioFontId)
  }

  private loadAndSetAudioFont = async (audioFontId: AudioFontId) => {
    this.setState({ isLoadingAudioFont: true })
    await audioEngine.setAudioFont(audioFontId)
    settingsStore.audioFontId = audioFontId
    this.setState({ isLoadingAudioFont: false })
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

  private getPianoNoteRange = () =>
    this._getPianoNoteRange(this.state.width, this.state.staffTicks)

  private _getPianoNoteRange = memoize(
    (width: number, staffTicks: StaffTick[]) => {
      let baseNoteRange = pianoNoteRangeNarrow

      if (width > 1000) {
        baseNoteRange = pianoNoteRangeWide
      } else if (width > 400) {
        baseNoteRange = pianoNoteRangeMiddle
      }

      const noteRange = { ...baseNoteRange }
      if (staffTicks && staffTicks.length > 0) {
        const allMidiNotes: number[] = _.flatten(
          staffTicks.map(st => st.notes.map(n => n.midi)),
        )
        if (allMidiNotes.length > 0) {
          const maxMidiNote = _.max(allMidiNotes) as number
          const minMidiNote = _.min(allMidiNotes) as number
          if (maxMidiNote! > noteRange.last - 3) {
            noteRange.last = maxMidiNote! + 3
          }
          if (noteRange.first + 3 > minMidiNote!) {
            noteRange.first = Math.max(1, minMidiNote! - 3)
          }
        }
      }
      return noteRange
    },
  )

  private getPianoHeight = () => {
    const { height, width } = this.state
    const pianoNoteRange = this.getPianoNoteRange()
    const keysCount = pianoNoteRange.last - pianoNoteRange.first + 1

    const keyWidth = width / keysCount

    if (height <= 360) {
      return 30
    }
    if (height <= 500) {
      return 40
    }
    if (height > 600) {
      return 60
    }
    if (height > 500) {
      return 50
    }

    if (keyWidth > 20) {
      return 120
    }
    if (keyWidth > 15) {
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

  private handleRemoveAllNotes = () => {
    if (confirm('Do you really want to remove all notes from the session?')) {
      if (sessionStore.activeSession) {
        sessionStore.activeSession.noteCards = []
      }
    }
  }

  private saveAppState = () => {
    console.log('saveAppState')
    settingsStore.saveSettingsLocally()
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
      if (nextStaffTickIndex == null) {
        return null
      }
      // (state.activeStaffTickIndex + 1) % this.state.staffTicks.length
      const nextStaffTick = this.state.staffTicks[nextStaffTickIndex]
      if (!nextStaffTick) {
        return null
      }

      return {
        activeStaffTickIndex: nextStaffTickIndex,
        activeNoteCardId: nextStaffTick.noteCardId,
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
      {
        isPlaying: false,
        activeNoteCardId: undefined,
        activeStaffTickIndex: 0,
      },
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
    const value = parseIntEnsureInBounds(e.target.value, 0, 500)
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

  private handleMouseOverNoteCard = (index: number) => {
    const { noteCards } = this.getNoteCards()
    const noteCard = noteCards[index]
    this.setState({ noteCardWithMouseOver: noteCard })
  }

  private handleMouseLeaveNoteCard = () => {
    this.setState({ noteCardWithMouseOver: undefined })
  }

  private handleChangeNoteCardToEnharmonicClick = (index: number) => {
    const { noteCards } = this.getNoteCards()
    const noteCard = noteCards[index]
    this.updateNoteCard({
      noteCardId: noteCard.id,
      noteName: tonal.Note.enharmonic(noteCard.noteName),
    })
  }

  private handleDeleteCard = (index: number) => this.deleteNoteCard(index)

  private deleteNoteCard = (index: number) => {
    if (sessionStore.activeSession) {
      sessionStore.activeSession.noteCards = sessionStore.activeSession.noteCards.filter(
        (nc, i) => i !== index,
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
    if (contentElement) {
      const contentWidth = (contentElement as HTMLElement).getBoundingClientRect()
        .width
      this.setState({ contentWidth })
    }

    const modifiersContentElement = document.getElementById(
      'modifiers-container',
    ) as HTMLElement
    if (modifiersContentElement) {
      const modifersContentWidth = (modifiersContentElement as HTMLElement).getBoundingClientRect()
        .width
      this.setState({ modifersContentWidth })
    }
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

  private openSignInModal = () => this.setState({ signInModalIsOpen: true })
  private closeSignInModal = () => this.setState({ signInModalIsOpen: false })

  private openSettingsModal = () => this.setState({ settingsModalIsOpen: true })
  private closeSettingsModal = () =>
    this.setState({ settingsModalIsOpen: false })

  private submitSettingsModal = ({
    values,
  }: {
    values: SettingsFormValues
  }) => {
    Object.keys(values).forEach(key => {
      settingsStore[key] = values[key]
    })

    this.onNotesUpdated()
    this.saveAppState()

    this.closeSettingsModal()
    notificationsStore.showNotification({
      autohide: 5000,
      level: 'success',
      message: 'Settings saved',
    })
  }

  private closeShareSessionModal = () => {
    this.setState({
      shareSessionModalIsOpen: false,
      shareSessionModalSession: undefined,
    })
  }

  private closeNoteAddingModal = () =>
    this.setState({ noteAddingModalIsOpen: false })
  private openNoteAddingModal = () =>
    this.setState({ noteAddingModalIsOpen: true })

  private closeToneRowAddingModal = () =>
    this.setState({ toneRowAddingModalIsOpen: false })
  private openToneRowAddingModal = () =>
    this.setState({ toneRowAddingModalIsOpen: true })

  private openArpeggioAddingModal = () =>
    this.setState({ chordsModalIsOpen: true })
  private closeArpeggioAddingModal = () =>
    this.setState({ chordsModalIsOpen: false })

  private openScalesModal = () => this.setState({ scalesModalIsOpen: true })
  private closeScalesModal = () => this.setState({ scalesModalIsOpen: false })

  private openIntervalsModal = () =>
    this.setState({ intervalsModalIsOpen: true })
  private closeIntervalsModal = () =>
    this.setState({ intervalsModalIsOpen: false })

  private openChromaticApproachesModal = () =>
    this.setState({ chromaticApproachesModalIsOpen: true })
  private closeChromaticApproachesModal = () =>
    this.setState({ chromaticApproachesModalIsOpen: false })

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

  private handleEditNote = (index: number, { noteName }) => {
    const { noteCards } = this.getNoteCards()
    const noteCard = noteCards[index]

    this.updateNoteCard({
      noteCardId: noteCard.id,
      noteName,
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
      autohide: 6000,
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
      autohide: 6000,
    })
  }

  private handleAddNoteModalSubmit = ({ noteName }) => {
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

  private handleAddToneRowModalSubmit = ({ noteNames }) => {
    if (sessionStore.activeSession) {
      sessionStore.activeSession.noteCards = [
        ...sessionStore.activeSession.noteCards,
        ...noteNames.map(
          noteName =>
            ({
              noteName,
              id: uuid(),
            } as SessionNoteCard),
        ),
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
      autohide: 6000,
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
      autohide: 6000,
    })
  }

  private handleShareSession = async session => {
    await sessionStore.shareMySessionByKey(session.key)
    this.setState({
      shareSessionModalIsOpen: true,
      shareSessionModalSession: session,
    })
  }

  private handleDecreaseZoomFactor = () => {
    settingsStore.scaleZoomFactor = Math.max(
      settingsStore.scaleZoomFactor - 0.25,
      0.25,
    )
    settingsStore.saveSettingsLocally()
    window.dispatchEvent(new Event('resize'))
  }

  private handleIncreaseZoomFactor = () => {
    settingsStore.scaleZoomFactor = Math.min(
      settingsStore.scaleZoomFactor + 0.25,
      3,
    )
    settingsStore.saveSettingsLocally()
    window.dispatchEvent(new Event('resize'))
  }

  private renderApp = () => {
    if (!sessionStore.activeSession) {
      return
    }

    const { classes } = this.props
    const {
      isSignedIn,
      staffTicks,
      staffTicksPerCard,
      isPlaying,
      activeStaffTickIndex,
      activeNoteCardId,
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

    const { noteCards, noteCardsById } = this.getNoteCards()

    const isMobile = this.props.width === 'xs' || this.props.width === 'sm'
    const shouldShowDesktopSessionControls =
      this.state.height > 600 && this.state.width > 600

    const activeNoteCard =
      isPlaying && activeNoteCardId != null
        ? noteCardsById[activeNoteCardId]
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

    const ShuffleButton =  noteCards.length > 0 && (
      <Tooltip
        title="Reshuffle cards"
        open={noteCards.length < 3 ? false : undefined}
      >
        <Button
          disabled={noteCards.length < 3}
          m={[1, 2]}
          color="primary"
          variant="extendedFab"
          onClick={this.handleShuffleClick}
        >
          <ArrowsIcon className={css({ margin: '0 0.5rem' })} />
          <Hidden smDown>Randomize</Hidden>
        </Button>
      </Tooltip>
    )

    const ClearAllButton = noteCards.length > 0 && (
      <Tooltip
        title="Clear all notes"
        variant="gray"
        open={noteCards.length === 0 ? false : undefined}
      >
        <MuiButton
          disabled={noteCards.length === 0}
          color="secondary"
          className={css(`margin: 0.5rem;`)}
          onClick={this.handleRemoveAllNotes}
        >
          <DeleteIcon className={css({ margin: '0 0.5rem' })} />
          <Hidden xsDown>Clear all</Hidden>
        </MuiButton>
      </Tooltip>
    )

    const ToggleCountInButton = (
      <Tooltip
        title={countInEnabled ? 'Turn off count in' : 'Turn on count in'}
      >
        <IconButton
          color={countInEnabled ? 'primary' : 'default'}
          className={css(`margin: 0.5rem; margin-right: 0;`)}
          onClick={this.handleCountInToggle}
        >
          <TimerIcon />
        </IconButton>
      </Tooltip>
    )
    const ToggleMetronomeButton = (
      <Tooltip
        title={metronomeEnabled ? 'Turn metronome off' : 'Turn metronome on'}
      >
        <IconButton
          color={metronomeEnabled ? 'primary' : 'default'}
          className={css(`margin: 0.5rem; margin-left: 1rem;`)}
          onClick={this.handleMetronomeToggle}
        >
          <MetronomeIcon />
        </IconButton>
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
        {ToggleCountInButton}
        {RestsTextInput}
        {CountInTextInput}
        {ToggleMetronomeButton}
        {TempoTextInput}
      </Box>
    )

    const TogglePlaybackButton =  noteCards.length > 0 && (
      <Button
        disabled={noteCards.length < 1}
        title={isPlaying ? 'Stop' : 'Play'}
        bg={isPlaying ? 'red' : '#00c200'}
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
            css(`margin-left: 0 !important; margin-right: 10px !important;`),
            classes.menuButton,
            !isMobile && this.state.isMenuOpen && classes.hide,
          )}
        >
          <MenuIcon />
        </IconButton>

        <Flex flex={1} justifyContent="center">
          <Flex maxWidth={MaxLayoutWidth} width={1}>
            {TogglePlaybackButton}

            {isSignedIn &&
              sessionStore.activeSessionType === 'shared' && (
                <Button
                  m={[1, 2]}
                  bg="#f50057"
                  onClick={this.saveSharedSessionToMySessions}
                >
                  <SaveIcon className={css({ margin: '0 0.5rem' })} />
                  <Hidden xsDown mdUp>
                    Save
                  </Hidden>
                  <Hidden smDown>Save to my sessions</Hidden>
                </Button>
              )}

            <Box className={css({ flexGrow: 1 })} />

            {!shouldShowDesktopSessionControls ? (
              <IconButton
                color="inherit"
                aria-label={
                  uiState.isControlsShown
                    ? 'Hide session controls'
                    : 'Show session controls'
                }
                onClick={() => {
                  uiState.isControlsShown = !uiState.isControlsShown
                }}
                className={cx(classes.menuButton)}
              >
                <SettingsIcon />
              </IconButton>
            ) : null}

            {!isSignedIn ? (
              <Button m={[1, 2]} bg="#f50057" onClick={this.openSignInModal}>
                <span className={css(`white-space: nowrap;`)}>Sign in</span>
              </Button>
            ) : null}
          </Flex>
        </Flex>
      </>
    )

    const chipsStyles = css(`
    margin-right: 0.5rem;
    margin-bottom: 0.25rem;
    margin-top: 0.25rem;
    @media screen and (max-width: 768px) {
      font-size: 0.8rem;
      height: 24px;
    }
  `)
    const chipsProps = {
      clickable: true,
      color: 'secondary' as
        | 'inherit'
        | 'primary'
        | 'secondary'
        | 'default'
        | undefined,
      variant: 'outlined' as 'outlined',
      classes: { root: chipsStyles },
    }
    const ModifierChips = (
      <>
        {modifiers.chords.enabled && (
          <Tooltip title="Change chords settings" disableFocusListener>
            <Chip
              {...chipsProps}
              label={`Chords: ${modifiers.chords.chordType}`}
              onClick={this.openArpeggioAddingModal}
              onDelete={this.handleRemoveArpeggioClick}
              deleteIcon={
                <Tooltip variant="gray" title="Remove chords" placement="top">
                  <DeleteIcon />
                </Tooltip>
              }
            />
          </Tooltip>
        )}
        {modifiers.scales.enabled && (
          <Tooltip title="Change scales settings" disableFocusListener>
            <Chip
              {...chipsProps}
              label={`Scale: ${
                (scaleByScaleType[modifiers.scales.scaleType] as Scale).title
              }`}
              onClick={this.openScalesModal}
              onDelete={this.handleRemoveScalesClick}
              deleteIcon={
                <Tooltip variant="gray" title="Remove scales" placement="top">
                  <DeleteIcon />
                </Tooltip>
              }
            />
          </Tooltip>
        )}

        {modifiers.intervals.enabled && (
          <Tooltip title="Change intervals settings" disableFocusListener>
            <Chip
              {...chipsProps}
              label={`Intervals: ${
                SemitonesToIntervalShortNameMap[modifiers.intervals.interval]
              }`}
              onClick={this.openIntervalsModal}
              onDelete={this.handleRemoveIntervalsClick}
              deleteIcon={
                <Tooltip
                  variant="gray"
                  title="Remove intervals"
                  placement="top"
                >
                  <DeleteIcon />
                </Tooltip>
              }
            />
          </Tooltip>
        )}

        {modifiers.chromaticApproaches.enabled && (
          <Tooltip title="Change enclosures settings" disableFocusListener>
            <Chip
              {...chipsProps}
              label={`Enclosure: ${modifiers.chromaticApproaches.type}`}
              deleteIcon={
                <Tooltip
                  title="Remove enclosures"
                  variant="gray"
                  placement="top"
                >
                  <DeleteIcon />
                </Tooltip>
              }
              onClick={this.openChromaticApproachesModal}
              onDelete={this.handleRemoveChromaticApproachesClick}
            />
          </Tooltip>
        )}
      </>
    )

    const notesStaffMaxLines = this.getMaxNotesStaffLines()
    const notesStaffScaleFactor = this.getNotesStaffScaleFactor(isMobile)

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
          {isSignedIn ? (
            <ButtonWithMenu
              renderButton={props => (
                <ListItem button {...props}>
                  <ListItemAvatar>
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
                    />
                  </ListItemAvatar>
                  <ListItemText>
                    {currentUser && currentUser.displayName}
                  </ListItemText>
                </ListItem>
              )}
              renderMenu={props => (
                <Menu id="account-menu" {...props}>
                  <MenuItem
                    onClick={() => {
                      this.signOut()
                    }}
                  >
                    Log out
                  </MenuItem>
                </Menu>
              )}
            />
          ) : null}

          <ListItem button onClick={toggleFullScreen}>
            <ListItemIcon>
              {uiState.isFullScreen ? (
                <FullscreenExitIcon />
              ) : (
                <FullscreenIcon />
              )}
            </ListItemIcon>
            <ListItemText
              primary={
                uiState.isFullScreen ? 'Exit full-screen' : 'Enter full-screen'
              }
            />
          </ListItem>

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

    const activeNoteCardIndex = noteCards.findIndex(
      nc => nc.id === this.state.activeNoteCardId,
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
                className={cx(
                  classes.content,
                  !isMobile && classes.contentShifted,
                  !isMobile && this.state.isMenuOpen && classes.contentShift,
                )}
              >
                <Flex
                  pt={[3, 3, 4]}
                  flexDirection="column"
                  flex={1}
                  px={[3, 4, 4]}
                  maxWidth={MaxLayoutWidth}
                  width={1}
                  id="app-content"
                >
                  {uiState.isControlsShown ||
                  shouldShowDesktopSessionControls ? (
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
                        {ShuffleButton}
                        {ClearAllButton}
                      </Box>

                      {SessionControls}
                    </Flex>
                  ) : null}

                  <Flex
                    alignItems="center"
                    justifyContent="center"
                    flexDirection="column"
                    maxHeight={400}
                    width={1}
                  >
                    <Grow
                      in={this.state.isInitialized}
                      timeout={{ enter: 5000 }}
                      appear
                    >
                      <NoteCards
                        notes={noteCards}
                        perLineCount={this.state.height > 568 ? 6 : 12}
                        activeNoteCardIndex={activeNoteCardIndex}
                        onChangeToEnharmonicClick={
                          this.handleChangeNoteCardToEnharmonicClick
                        }
                        onMouseOver={this.handleMouseOverNoteCard}
                        onMouseLeave={this.handleMouseLeaveNoteCard}
                        onEditNote={this.handleEditNote}
                        onDeleteClick={this.handleDeleteCard}
                        onCardsReorder={this.handleCardsReorder}
                        onCardDraggedOut={this.handleDeleteCard}
                      />
                    </Grow>

                    <Box px={[1, 2, 2]} width={1}>
                      <Flex
                        id="modifiers-container"
                        flexDirection="row"
                        alignItems="center"
                        justifyContent="center"
                        width={1}
                        mt={[2, 2, 2]}
                        mb={[2, 2, 2]}
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
                              onAddToneRowClick={this.openToneRowAddingModal}
                              onAddArpeggioClick={this.openArpeggioAddingModal}
                              onAddScaleClick={this.openScalesModal}
                              onAddChromaticApproachesClick={
                                this.openChromaticApproachesModal
                              }
                              onAddIntervalsClick={this.openIntervalsModal}
                              disableSingleNote={
                                noteCards.length >= MaxNoteCards
                              }
                              disableToneRow={noteCards.length >= MaxNoteCards}
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
                                className: cx(
                                  css({
                                    marginRight: '10px',
                                  }),
                                ),
                                classes: {
                                  fab: css(
                                    `height: 50px;
                                    @media screen and (max-height: 400px) {
                                      height: 30px;
                                    }
                                    `,
                                  ),
                                },
                              }}
                            />
                          </div>
                        </Fade>
                        <Flex
                          flex-direction="row"
                          alignItems="center"
                          flexWrap="wrap"
                        >
                          {ModifierChips}
                        </Flex>
                      </Flex>
                    </Box>
                  </Flex>

                  <div
                    className={css(`
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    @media screen and (max-height: 600px) and (min-width: 500px) {
                      flex-direction: row-reverse;
                    }
                  `)}
                  >
                    <div
                      className={css(`
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    text-align: right;
                    color: #aaa;
                    font-size: 13px;
                    user-select: none;

                    button {
                      padding: 8px !important;
                    }

                    @media screen and (min-width: 768px) {
                      font-size: 15px;
                    }

                    @media screen and (max-height: 600px) and (min-width: 500px) {
                      flex-direction: column-reverse;
                      margin-left: 0.5rem;
                    }
                  `)}
                    >
                      <span>{`x ${settingsStore.scaleZoomFactor}`}</span>
                      <Tooltip title="Smaller font">
                        <IconButton
                          color="inherit"
                          aria-label="Decrease font size"
                          onClick={this.handleDecreaseZoomFactor}
                        >
                          <ZoomOutIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Larger font">
                        <IconButton
                          color="inherit"
                          aria-label="Increase font size"
                          onClick={this.handleIncreaseZoomFactor}
                        >
                          <ZoomInIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Notes staff settings">
                        <IconButton
                          color="inherit"
                          aria-label="Change notes staff settings"
                          onClick={() => {
                            this.openSettingsModal()
                          }}
                        >
                          <SettingsIcon />
                        </IconButton>
                      </Tooltip>
                    </div>

                    <NotesStaff
                      containerProps={{
                        className: css(
                          `width: 100%; flex: 1; overflow-y: auto; min-height: 100px`,
                        ),
                      }}
                      scale={notesStaffScaleFactor}
                      clef={settingsStore.clefType}
                      maxLines={notesStaffMaxLines}
                      isPlaying={isPlaying}
                      key={this.state.contentWidth}
                      showEnd
                      id="notation"
                      ticks={this.state.staffTicks}
                      tickLabels={
                        settingsStore.showNoteNamesAboveStaff
                          ? this.state.tickLabels
                          : undefined
                      }
                      activeTickIndex={
                        isPlaying ? activeStaffTickIndex : undefined
                      }
                    />
                  </div>
                </Flex>

                <Box mt={[2, 3, 3]}>
                  <PianoKeyboard
                    width={
                      this.state.width -
                      (!isMobile && this.state.isMenuOpen ? MenuWidth : 0)
                    }
                    noteRange={this.getPianoNoteRange()}
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
              audioFontId: settingsStore.audioFontId,
              clefType: settingsStore.clefType,
              showNoteNamesAboveStaff: settingsStore.showNoteNamesAboveStaff,
            }}
            onSubmit={this.submitSettingsModal}
            onAudioFontChanged={this.handleAudioFontChanged}
          />

          <ShareSessionModal
            isOpen={this.state.shareSessionModalIsOpen}
            session={this.state.shareSessionModalSession!}
            onClose={this.closeShareSessionModal}
          />

          <ArpeggioModifierModal
            isOpen={this.state.chordsModalIsOpen}
            onClose={this.closeArpeggioAddingModal}
            onSubmit={this.handleArpeggioModifierModalConfirm}
            initialValues={modifiers.chords}
            baseNote={
              noteCards && noteCards[0] ? noteCards[0].noteName : undefined
            }
          />

          <IntervalModifierModal
            isOpen={this.state.intervalsModalIsOpen}
            onClose={this.closeIntervalsModal}
            onSubmit={this.handleIntervalsModifierModalConfirm}
            initialValues={modifiers.intervals}
            baseNote={
              noteCards && noteCards[0] ? noteCards[0].noteName : undefined
            }
          />

          <ScaleModifierModal
            isOpen={this.state.scalesModalIsOpen}
            onClose={this.closeScalesModal}
            onSubmit={this.handleScaleModifierModalConfirm}
            initialValues={modifiers.scales}
            baseNote={
              noteCards && noteCards[0] ? noteCards[0].noteName : undefined
            }
          />

          <ChromaticApproachesModifierModal
            isOpen={this.state.chromaticApproachesModalIsOpen}
            onClose={this.closeChromaticApproachesModal}
            onSubmit={this.handleChromaticApproachModifierModalConfirm}
            defaultType={modifiers.chromaticApproaches.type}
          />

          <ToneRowModal
            defaultNotesCount={Math.min(4, MaxNoteCards - noteCards.length)}
            maxNotesCount={MaxNoteCards - noteCards.length}
            isOpen={this.state.toneRowAddingModalIsOpen}
            onClose={this.closeToneRowAddingModal}
            onSubmit={this.handleAddToneRowModalSubmit}
          />

          <PickNoteModal
            isOpen={this.state.noteAddingModalIsOpen}
            onClose={this.closeNoteAddingModal}
            onSubmit={this.handleAddNoteModalSubmit}
          />
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

  private getMaxNotesStaffLines() {
    return 16
  }

  private getNotesStaffScaleFactor(isMobile: boolean) {
    let scale = 1.0
    if (isMobile) {
      scale = 0.7
    } else if (this.props.width === 'md') {
      scale = 0.85
    }

    if (this.state.staffTicks.length > 96) {
      scale *= 0.7
    } else if (this.state.staffTicks.length > 64) {
      scale *= 0.75
    } else if (this.state.staffTicks.length > 32) {
      scale *= 0.8
    } else if (this.state.staffTicks.length > 16) {
      scale *= 0.9
    }

    return scale * settingsStore.scaleZoomFactor
  }

  public render() {
    return (
      <ThemeProvider theme={theme}>
        <AudioEngineContext.Provider
          value={{ audioEngine, audioFontId: settingsStore.audioFontId }}
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
                  css="overflowX: hidden;"
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
