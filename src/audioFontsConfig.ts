export type AudioFont = any

export type AudioFontId =
  | 'grand_piano_1'
  | 'electric_piano_1'
  | 'sax_soprano_1'
  | 'trumpet_soft_1'
  | 'acoustic_guitar_1'
  | 'metronome'

export type AudioFontConfig = {
  // Machine-friendly unique ID
  id: AudioFontId
  // Human-readable title to use in the UI
  title: string

  // Details of the implementation, see https://surikov.github.io/webaudiofont/
  url: string
  globalVarName: string
}

const audioFontsConfig: AudioFontConfig[] = ([
  {
    id: 'metronome',
    title: 'Metronome',
    name: '1130_SoundBlasterOld_sf2',
  },
  {
    id: 'grand_piano_1',
    title: 'Grand Piano',
    name: '0000_SoundBlasterOld_sf2',
  },
  {
    id: 'electric_piano_1',
    title: 'Electric Piano',
    name: '0050_SoundBlasterOld_sf2',
  },
  {
    id: 'acoustic_guitar_1',
    title: 'Acoustic Guitar (steel)',
    name: '0250_SoundBlasterOld_sf2',
  },
  {
    id: 'trumpet_soft_1',
    title: 'Trumpet',
    name: '0560_SoundBlasterOld_sf2',
  },
  {
    id: 'sax_soprano_1',
    title: 'Soprano Sax',
    name: '0640_SoundBlasterOld_sf2',
  },
  // TODO: add more sounds here
] as ({ id: AudioFontId; title: string; name: string })[]).map(afc => ({
  id: afc.id,
  title: afc.title,
  url: process.env.PUBLIC_URL + `/audiofonts/${afc.name}.js`,
  globalVarName: `_tone_${afc.name}`,
}))

export default audioFontsConfig
