import * as React from 'react'
import AudioEngine from '../services/audioEngine'

export const AudioEngineContext = React.createContext<AudioEngine | null>(null)

// This function takes a component...
export function withAudioEngine(Component) {
  // ...and returns another component...
  return function ComponentWithAudioEngine(props) {
    // ... and renders the wrapped component with the context theme!
    // Notice that we pass through any additional props as well
    return (
      <AudioEngineContext.Consumer>
        {audioEngine => <Component {...props} audioEngine={audioEngine} />}
      </AudioEngineContext.Consumer>
    )
  }
}
