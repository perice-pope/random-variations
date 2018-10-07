import * as React from 'react'
import { Flipper, Flipped } from 'react-flip-toolkit'
import styled from 'react-emotion'
import { ThemeProvider } from 'emotion-theming'

import theme from '../styles/theme'
import globalStyles from '../styles/globalStyles'

import { Flex, Box, Button } from './ui'
import NoteCard from './NoteCard'

globalStyles()

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const FlipperStyled = styled(Flipper)`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
`

class App extends React.Component {
  state = {
    cards: new Array(12).fill(null).map((value, index) => ({
      text: `Card ${index}`,
      id: `${index}`,
    })),
  }

  handleShuffleClick = () => {
    this.setState(state => ({
      cards: shuffle([...this.state.cards]),
    }))
  }

  public render() {
    return (
      <>
        <ThemeProvider theme={theme}>
          <Flex flexDirection="column">
            <Box>
              <Button m={2} onClick={this.handleShuffleClick}>
                shuffle!
              </Button>
            </Box>

            <FlipperStyled flipKey={this.state.cards}>
              {this.state.cards.map(({ id, text }) => (
                <Flipped key={id} flipId={id}>
                  <Box p={2} width={1 / 4}>
                    <NoteCard width={1}>{text}</NoteCard>
                  </Box>
                </Flipped>
              ))}
            </FlipperStyled>
          </Flex>
        </ThemeProvider>
      </>
    )
  }
}

export default App
