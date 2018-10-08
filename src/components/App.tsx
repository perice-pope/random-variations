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
  currentNoteCardPlaying: number
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
        .map(() =>
          sample([
            'Bb',
            'A',
            'A#',
            'Bb',
            'B',
            'B#',
            'Cb',
            'C',
            'C#',
            'Db',
            'D',
            'D#',
            'Eb',
            'E',
            'E#',
            'Fb',
            'F',
            'F#',
            'Gb',
            'G',
            'G#',
          ]),
        )
        .map((noteName: string, index) => ({
          id: `${index}`,
          text: noteName,
          note: `${noteName}4`,
        })),
      currentNoteCardPlaying: 0,
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

    Tone.Transport.bpm.value = this.state.bpm
  }

  handleShuffleClick = () => {
    this.setState(
      state => ({
        noteCards: shuffle([...state.noteCards]),
      }),
      () => {
        const hasBeenPlaying = this.state.isPlaying
        if (hasBeenPlaying) {
          this.stopPlaying()
        }

        this.scheduleNotes()

        if (hasBeenPlaying) {
          this.startPlaying()
        }
      },
    )
  }

  scheduleNote = (
    note: string,
    time: string = '0:0',
    duration: string = '4n',
  ) => {
    console.log(`Scheduling note: ${note} ${time}`)

    return Tone.Transport.schedule(contextTime => {
      this.synth.triggerAttackRelease(note, duration, contextTime)

      Tone.Draw.schedule(() => this.drawAnimation(time), contextTime)
    }, Tone.Time(time))
  }

  drawAnimation = time => {
    console.log('drawAnimation', time)
    if (time === '0:0' && this.state.currentNoteCardPlaying === 0) {
      return
    }

    this.setState(state => ({
      currentNoteCardPlaying: (state.currentNoteCardPlaying + 1) % 12,
    }))
  }

  scheduleNotes = () => {
    console.log('scheduleNotes is called\n---------\n')
    this.scheduledEvents.forEach(eventId => Tone.Transport.clear(eventId))

    this.state.noteCards.forEach(({ note }, index) => {
      this.scheduledEvents.push(
        this.scheduleNote(note, `${Math.floor(index / 4)}:${index % 4}`),
      )
    })
  }

  startPlaying = () => {
    this.setState({ isPlaying: true }, () => Tone.Transport.start())
  }

  stopPlaying = () => {
    this.setState({ isPlaying: false, currentNoteCardPlaying: 0 }, () =>
      Tone.Transport.stop(),
    )
  }

  togglePlayback = () => {
    if (this.state.isPlaying) {
      this.stopPlaying()
    } else {
      this.startPlaying()
    }
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
    const { bpm, noteCards, isPlaying, currentNoteCardPlaying } = this.state

    return (
      <ThemeProvider theme={theme}>
        <Flex
          height="100vh"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          maxWidth={960}
          mx="auto"
        >
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
                value={`${bpm}`}
                onChange={this.handleBpmChange}
              />
            </Label>
          </Flex>

          <FlipperStyled flipKey={noteCards}>
            {noteCards.map(({ id, text }, index) => (
              <Flipped key={id} flipId={id}>
                <Box
                  p={2}
                  width={1 / 4}
                  position="relative"
                  zIndex={currentNoteCardPlaying === index ? 2 : 1}
                >
                  <NoteCard
                    width={1}
                    playing={isPlaying && currentNoteCardPlaying === index}
                  >
                    {text}
                  </NoteCard>
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
