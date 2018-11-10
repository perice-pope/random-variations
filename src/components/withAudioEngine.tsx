import * as React from 'react'
import AudioEngine from '../services/audioEngine'
import { AudioFontId } from '../audioFontsConfig'

type ContextType = {
  audioEngine?: AudioEngine
  audioFontId?: AudioFontId
}
export const AudioEngineContext = React.createContext<ContextType>({})

// This function takes a component...
export function withAudioEngine(Component) {
  // ...and returns another component...
  return function ComponentWithAudioEngine(props) {
    // ... and renders the wrapped component with the context theme!
    // Notice that we pass through any additional props as well
    return (
      <AudioEngineContext.Consumer>
        {({ audioEngine, audioFontId }) => (
          <Component
            {...props}
            audioEngine={audioEngine}
            audioFontId={audioFontId}
          />
        )}
      </AudioEngineContext.Consumer>
    )
  }
}
