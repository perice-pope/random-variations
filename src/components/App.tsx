import * as React from 'react'
import { Flipper, Flipped } from 'react-flip-toolkit'
import styled from 'react-emotion'
import { ThemeProvider } from 'emotion-theming'
import withProps from 'recompose/withProps'
import { sample } from 'lodash'
import Tone from 'tone'

import theme from '../styles/theme'
import globalStyles from '../styles/globalStyles'

import { Flex, Box, Button, TextInput, Label } from './ui'
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

const BpmInput = withProps({
  fontSize: 4,
  p: 2,
  px: 4,
  mx: 3,
})(TextInput)

type NoteCard = {
  id: string
  note: string
  text: string
}

type AppState = {
  bpm: number
  isPlaying: boolean
  noteCards: NoteCard[]
}

class App extends React.Component<{}, AppState> {
  synth: any
  scheduledEvents: any[] = []

  constructor(props) {
    super(props)
    this.state = {
      bpm: 120,
      isPlaying: false,
      // 12 random note cards
      noteCards: new Array(12)
        .fill(null)
        .map(() => sample(['A', 'B', 'C', 'D', 'E', 'F', 'G']))
        .map((noteName: string, index) => ({
          id: `${index}`,
          text: noteName,
          note: `${noteName}4`,
        })),
    }
    this.initSynth()
    this.scheduleNotes()
  }

  initSynth = () => {
    this.synth = new Tone.PolySynth(10, Tone.Synth, {
      oscillator: {
        partials: [0, 2, 3, 4],
      },
    }).toMaster()

    Tone.Transport.loopEnd = '3m'
    Tone.Transport.loop = true
  }

  handleShuffleClick = () => {
    this.setState(
      state => ({
        noteCards: shuffle([...state.noteCards]),
      }),
      () => {
        this.stopPlaying()
        this.scheduleNotes()
        this.startPlaying()
      },
    )
  }

  scheduleNote = (note: string, time: string, duration: string = '4n') => {
    console.log(`Scheduling note: ${note} ${time}`)
    return Tone.Transport.schedule(time => {
      this.synth.triggerAttackRelease(note, duration, time)
    }, Tone.Time(time))
  }

  scheduleNotes = () => {
    this.scheduledEvents.forEach(eventId => Tone.Transport.clear(eventId))

    this.state.noteCards.forEach(({ note }, index) => {
      this.scheduledEvents.push(
        this.scheduleNote(note, `${Math.floor(index / 4)}:${index % 4}`),
      )
    })
  }

  startPlaying = () => {
    Tone.Transport.start()
  }

  stopPlaying = () => {
    Tone.Transport.stop()
  }

  togglePlayback = () => {
    this.setState(
      state => ({ isPlaying: !state.isPlaying }),
      () => {
        if (this.state.isPlaying) {
          this.startPlaying()
        } else {
          this.stopPlaying()
        }
      },
    )
  }

  handleBpmChange = e => {
    let bpmValue = this.state.bpm
    try {
      if (!e.target.value) {
        bpmValue = 0
      } else {
        bpmValue = parseInt(e.target.value, 10)
        if (isNaN(bpmValue)) {
          bpmValue = 0
        }
      }
    } finally {
      Tone.Transport.bpm.value = bpmValue
      this.setState({
        bpm: bpmValue,
      })
    }
  }

  public render() {
    const { isPlaying } = this.state

    return (
      <ThemeProvider theme={theme}>
        <Flex flexDirection="column" mt={2}>
          <Flex flexDirection="row">
            <Button
              title="Shuffle note cards"
              m={2}
              onClick={this.handleShuffleClick}
            >
              shuffle!
            </Button>

            <Button
              width={120}
              title={isPlaying ? 'Stop' : 'Play'}
              bg={isPlaying ? 'red' : 'green'}
              m={2}
              onClick={this.togglePlayback}
            >
              {isPlaying ? 'Stop' : 'Play'}
            </Button>

            <Label>
              BPM:
              <BpmInput
                type="number"
                step="1"
                min="0"
                max="400"
                value={`${this.state.bpm}`}
                onChange={this.handleBpmChange}
              />
            </Label>
          </Flex>

          <FlipperStyled flipKey={this.state.noteCards}>
            {this.state.noteCards.map(({ id, text }) => (
              <Flipped key={id} flipId={id}>
                <Box p={2} width={1 / 4}>
                  <NoteCard width={1}>{text}</NoteCard>
                </Box>
              </Flipped>
            ))}
          </FlipperStyled>
        </Flex>
      </ThemeProvider>
    )
  }
}

export default App
