import AudioFontsConfig, { AudioFontId } from '../audioFontsConfig'
import { observable } from 'mobx'
import { ClefType, EnharmonicFlatsMap } from '../types'

interface SettingsStoreData {
  audioFontId: AudioFontId
  clefType: ClefType
  enharmonicFlatsMap: EnharmonicFlatsMap
}

class SettingsStore {
  @observable
  public audioFontId: AudioFontId = AudioFontsConfig[0].id
  @observable
  public clefType: ClefType = 'treble'
  @observable
  public enharmonicFlatsMap: EnharmonicFlatsMap = {}

  public saveSettingsLocally = () => {
    const savedState: SettingsStoreData = {
      audioFontId: this.audioFontId,
      enharmonicFlatsMap: this.enharmonicFlatsMap,
      clefType: this.clefType,
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
      if (restoredState.enharmonicFlatsMap) {
        this.enharmonicFlatsMap = restoredState.enharmonicFlatsMap
      }
      if (restoredState.audioFontId) {
        this.audioFontId = restoredState.audioFontId
      }
      if (restoredState.clefType) {
        this.clefType = restoredState.clefType
      }
    }
  }
}

const settingsStore = new SettingsStore()

// @ts-ignore
window.settingsStore = settingsStore

export default settingsStore
