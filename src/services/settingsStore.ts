import AudioFontsConfig, { AudioFontId } from '../audioFontsConfig'
import { observable } from 'mobx'
import firebase from './firebase'
import { ClefType, InstrumentTransposingType } from '../types'
import { merge } from 'lodash'

interface SettingsStoreData {
  audioFontId: AudioFontId
  clefType: ClefType
  instrumentTransposing: InstrumentTransposingType
  scaleZoomFactor: number
  showNoteOctaves: boolean
  showNoteNamesAboveStaff: boolean
}

const db = firebase.firestore()
const usersRef = db.collection('users')

class SettingsStore {
  @observable
  public instrumentTransposing: InstrumentTransposingType
  @observable
  public audioFontId: AudioFontId = AudioFontsConfig[2].id
  @observable
  public clefType: ClefType = 'treble'

  @observable
  public scaleZoomFactor = 1.0

  @observable
  public showNoteNamesAboveStaff = true

  @observable
  public showNoteOctaves = false

  public saveSettings = async () => {
    const savedState: SettingsStoreData = {
      audioFontId: this.audioFontId,
      clefType: this.clefType,
      scaleZoomFactor: this.scaleZoomFactor,
      showNoteNamesAboveStaff: this.showNoteNamesAboveStaff,
      showNoteOctaves: this.showNoteOctaves,
      instrumentTransposing: this.instrumentTransposing,
    }

    console.log('SettingsStore > saveSettings: saved locally: ', savedState)
    // Save settings locally
    window.localStorage.setItem('appState', JSON.stringify(savedState))

    // Save some settings on the server (if user is authenticated)
    const userSettingsRef = this.getUserSettingsRef()
    if (userSettingsRef) {
      const serverSavedState = {
        audioFontId: this.audioFontId,
        clefType: this.clefType,
        showNoteNamesAboveStaff: this.showNoteNamesAboveStaff,
        showNoteOctaves: this.showNoteOctaves,
        instrumentTransposing: this.instrumentTransposing,
      }
      await userSettingsRef.set(serverSavedState, { merge: true })
      console.log(
        'SettingsStore > saveSettings: saved on the server: ',
        serverSavedState,
      )
    }
  }

  public loadSettings = async () => {
    let restoredState: Partial<SettingsStoreData> = {}

    // Loading settings from the local storage
    const locallySavedState = window.localStorage.getItem('appState')
    if (locallySavedState) {
      try {
        restoredState = merge(restoredState, JSON.parse(
          locallySavedState,
        ) as Partial<SettingsStoreData>)
        console.log(
          'SettingsStore > loadSettings: loaded locally:',
          restoredState,
        )
      } catch (error) {
        console.error(error)
        window.localStorage.removeItem('appState')
      }
    }

    // Loading settings from the server (if user is authenticated)
    // They have higher priority and override the locally saved settings
    const userSettingsRef = this.getUserSettingsRef()
    if (userSettingsRef) {
      const serverSavedState = (await userSettingsRef.get()).data()
      console.log(
        'SettingsStore > loadSettings: loaded from the server: ',
        serverSavedState,
      )
      restoredState = merge(restoredState, serverSavedState)
    }

    if (restoredState) {
      Object.keys(restoredState).forEach(key => {
        this[key] = restoredState[key]
      })
    }
  }

  private getUserSettingsRef = () => {
    const user = firebase.auth().currentUser
    if (!user || user.isAnonymous) {
      return undefined
    }
    return usersRef.doc(user!.uid)
  }
}

const settingsStore = new SettingsStore()

// @ts-ignore
window.settingsStore = settingsStore

export default settingsStore
