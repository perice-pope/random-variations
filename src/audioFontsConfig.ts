export type AudioFontConfig = {
  // Machine-friendly unique ID
  id: string
  // Human-readable title to use in the UI
  title: string

  // Details of the implementation, see https://surikov.github.io/webaudiofont/
  url: string
  globalVarName: string
}

const AUDIO_FONTS_CONFIG: AudioFontConfig[] = [
  {
    id: 'grand_piano_1',
    title: 'Grand Piano',
    url: process.env.PUBLIC_URL + '/audiofonts/0000_Chaos_sf2_file.js',
    globalVarName: '_tone_0000_Chaos_sf2_file',
  },
  {
    id: 'electric_piano_1',
    title: 'Electric Piano',
    url: process.env.PUBLIC_URL + '/audiofonts/0040_JCLive_sf2_file.js',
    globalVarName: '_tone_0040_JCLive_sf2_file',
  },
  // TODO: add more sounds here
]

export default AUDIO_FONTS_CONFIG
