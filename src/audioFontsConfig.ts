export type AudioFont = any

export type AudioFontId =
  | 'grand_piano_1'
  | 'electric_piano_1'
  | 'sax_soprano_1'
  | 'trumpet_soft_1'
  | 'acoustic_guitar_1'

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
    id: 'grand_piano_1',
    title: 'Grand Piano',
    name: '0000_Chaos_sf2_file',
  },
  {
    id: 'electric_piano_1',
    title: 'Electric Piano',
    name: '0040_JCLive_sf2_file',
  },
  {
    id: 'acoustic_guitar_1',
    title: 'Acoustic Guitar (steel)',
    name: '0250_Aspirin_sf2_file',
  },
  {
    id: 'trumpet_soft_1',
    title: 'Trumpet',
    name: '0560_Aspirin_sf2_file',
  },
  {
    id: 'sax_soprano_1',
    title: 'Soprano Sax',
    name: '0640_Aspirin_sf2_file',
  },
  // TODO: add more sounds here
] as ({ id: AudioFontId; title: string; name: string })[]).map(afc => ({
  id: afc.id,
  title: afc.title,
  url: process.env.PUBLIC_URL + `/audiofonts/${afc.name}.js`,
  globalVarName: `_tone_${afc.name}`,
}))

export default audioFontsConfig
