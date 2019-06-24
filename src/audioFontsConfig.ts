import _ from 'lodash'

export type AudioFont = any

export type AudioFontType = 'percussion' | 'instrument'

export type AudioFontId =
  | 'grand_piano_1'
  | 'electric_piano_1'
  | 'sax_soprano_1'
  | 'trumpet_soft_1'
  | 'acoustic_guitar_1'
  // Percussion
  | 'bass_drum'
  | 'snare_drum'
  | 'woodblock_low'
  | 'cowbell'

export type AudioFontConfig = {
  // Machine-friendly unique ID
  id: AudioFontId
  // Human-readable title to use in the UI
  title: string
  type: AudioFontType

  // Details of the implementation, see https://surikov.github.io/webaudiofont/
  url: string
  globalVarName: string
}

// Percussion
// For list of sounds see https://surikov.github.io/webaudiofontdata/sound/drums_0_SBLive_sf2Standard.html
export const percussionAudioFontConfigs: AudioFontConfig[] = ([
  {
    id: 'bass_drum',
    title: 'Kick drum',
    name: '35_0_SBLive_sf2',
    type: 'percussion',
  },
  {
    id: 'snare_drum',
    title: 'Snare drum',
    name: '38_0_SBLive_sf2',
    type: 'percussion',
  },
  {
    id: 'woodblock_low',
    title: 'Woodblock',
    name: '77_0_SBLive_sf2',
    type: 'percussion',
  },
  {
    id: 'cowbell',
    title: 'Cowbell',
    name: '56_0_SBLive_sf2',
    type: 'percussion',
  },
] as ({
  id: AudioFontId
  title: string
  name: string
  type: AudioFontType
})[]).map(afc => ({
  id: afc.id,
  title: afc.title,
  url: process.env.PUBLIC_URL + `/audiofonts/128${afc.name}.js`,
  globalVarName: `_drum_${afc.name}`,
  type: afc.type,
}))

export const instrumentAudioFontConfigs: AudioFontConfig[] = ([
  // Instruments
  {
    id: 'grand_piano_1',
    title: 'Grand Piano',
    name: '0000_SoundBlasterOld_sf2',
    type: 'instrument',
  },
  {
    id: 'electric_piano_1',
    title: 'Electric Piano',
    name: '0050_SoundBlasterOld_sf2',
    type: 'instrument',
  },
  {
    id: 'acoustic_guitar_1',
    title: 'Acoustic Guitar (steel)',
    name: '0250_SoundBlasterOld_sf2',
    type: 'instrument',
  },
  {
    id: 'trumpet_soft_1',
    title: 'Trumpet',
    name: '0560_SoundBlasterOld_sf2',
    type: 'instrument',
  },
  {
    id: 'sax_soprano_1',
    title: 'Soprano Sax',
    name: '0640_SoundBlasterOld_sf2',
    type: 'instrument',
  },
  // TODO: add more sounds here
] as ({
  id: AudioFontId
  title: string
  name: string
  type: AudioFontType
})[]).map(afc => ({
  id: afc.id,
  title: afc.title,
  url: process.env.PUBLIC_URL + `/audiofonts/${afc.name}.js`,
  globalVarName: `_tone_${afc.name}`,
  type: afc.type,
}))

export const instrumentAudioFontConfigsById = _.keyBy(
  instrumentAudioFontConfigs,
  'id',
)

export const audioFontsConfig = [
  ...percussionAudioFontConfigs,
  ...instrumentAudioFontConfigs,
]
