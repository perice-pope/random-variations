import AudioFontsConfig, { AudioFontId } from '../audioFontsConfig'
import { observable } from 'mobx'
import { ClefType, EnharmonicFlatsMap } from '../types'

interface SettingsStoreData {
  audioFontId: AudioFontId
  clefType: ClefType
  enharmonicFlatsMap: EnharmonicFlatsMap
  scaleZoomFactor: number
  showNoteOctaves: boolean
  showNoteNamesAboveStaff: boolean
}

class SettingsStore {
  @observable
  public audioFontId: AudioFontId = AudioFontsConfig[1].id
  @observable
  public clefType: ClefType = 'treble'
  @observable
  public enharmonicFlatsMap: EnharmonicFlatsMap = {}

  @observable
  public scaleZoomFactor = 1.0

  @observable
  public showNoteNamesAboveStaff = true

  @observable
  public showNoteOctaves = false

  public saveSettingsLocally = () => {
    const savedState: SettingsStoreData = {
      audioFontId: this.audioFontId,
      enharmonicFlatsMap: this.enharmonicFlatsMap,
      clefType: this.clefType,
      scaleZoomFactor: this.scaleZoomFactor,
      showNoteNamesAboveStaff: this.showNoteNamesAboveStaff,
      showNoteOctaves: this.showNoteOctaves,
    }
    console.log('SettingsStore > saveSettingsLocally: ', savedState)
    window.localStorage.setItem('appState', JSON.stringify(savedState))
  }

  public loadSettingsLocally = () => {
    let restoredState: Partial<SettingsStoreData> = {}

    const savedState = window.localStorage.getItem('appState')
    if (savedState) {
      try {
        restoredState = JSON.parse(savedState) as Partial<SettingsStoreData>
        console.log('SettingsStore > loadSettingsLocally: ', restoredState)
      } catch (error) {
        console.error(error)
        window.localStorage.removeItem('appState')
      }
    }

    if (restoredState) {
      Object.keys(restoredState).forEach(key => {
        this[key] = restoredState[key]
      })
    }
  }
}

const settingsStore = new SettingsStore()

// @ts-ignore
window.settingsStore = settingsStore

export default settingsStore
