import * as React from 'react'
import FlipMove from 'react-flip-move'
import { ThemeProvider } from 'styled-components'

import theme from '../styles/theme'
import globalStyles from '../styles/globalStyles'

import { Flex, Box, Button } from './ui'
import NoteCard from './NoteCard'

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

class App extends React.Component {
  state = {
    cards: new Array(12).fill(null).map((value, index) => index),
  }

  handleShuffleClick = () => {
    this.setState(state => ({
      cards: shuffle([...this.state.cards]),
    }))
  }

  public render() {
    return (
      <ThemeProvider theme={theme}>
        <Flex flexDirection="column">
          <Box>
            <Button onClick={this.handleShuffleClick}>shuffle!</Button>
          </Box>

          <FlipMove>
            {this.state.cards.map(c => (
              <NoteCard key={c}>Card {c}</NoteCard>
            ))}
          </FlipMove>
        </Flex>
      </ThemeProvider>
    )
  }
}

globalStyles()

export default App
