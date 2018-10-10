import * as React from 'react'
import { Flipper, Flipped } from 'react-flip-toolkit'
import styled, { css } from 'react-emotion'
import { ThemeProvider } from 'emotion-theming'
import { withProps } from 'recompose'
import * as _ from 'lodash'
import Tone from 'tone'
import * as ReactPiano from 'react-piano'
import * as tonal from 'tonal'
import * as TonalRange from 'tonal-range'
import * as Vex from 'vexflow'
import { darken } from 'polished'

import { Flex, Box, Button, TextInput, Label } from './ui'
import NoteCard from './NoteCard'
import MeasureScreenSize from './MeasureScreenSize'

import theme from '../styles/theme'
import globalStyles from '../styles/globalStyles'

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
  p: [2, 2, 2],
  fontSize: [2, 3, 3],
  mx: [2, 2, 2],
  px: [2, 3, 3],
})(TextInput)

type NoteCard = {
  id: string
  note: string
  text: string
  midi: number
}

type AppState = {
  bpm: number
  isPlaying: boolean
  noteCards: NoteCard[]
  currentNoteCardPlaying: number
  height: number
  width: number
  notationRootWidth: number
}

const chromaticNotes = TonalRange.chromatic(['C4', 'B4'], true)

const pianoNoteRangeWide = {
  first: tonal.Note.midi('C3'),
  last: tonal.Note.midi('B5'),
}

const pianoNoteRangeMiddle = {
  first: tonal.Note.midi('G3'),
  last: tonal.Note.midi('E5'),
}

const pianoNoteRangeNarrow = {
  first: tonal.Note.midi('C4'),
  last: tonal.Note.midi('B4'),
}

const keyboardShortcuts = ReactPiano.KeyboardShortcuts.create({
  first: pianoNoteRangeNarrow.first,
  last: pianoNoteRangeNarrow.last,
  keyboardConfig: ReactPiano.KeyboardShortcuts.QWERTY_ROW,
})

const layoutMinWidth = 320

const ContentContainer = withProps({
  mx: 'auto',
  maxWidth: '960px',
  width: 1,
  px: 4,
  // @ts-ignore
})(Box)

class App extends React.Component<{}, AppState> {
  private synth: any
  private scheduledEvents: any[] = []
  private notationRoot: HTMLElement
  private renderer: Vex.Flow.Renderer
  private renderContext: Vex.IRenderContext

  constructor(props) {
    super(props)

    this.state = {
      // Screen size
      height: 0,
      width: 0,
      notationRootWidth: 0,

      bpm: 120,
      isPlaying: false,
      // 12 random note cards
      noteCards: _.sampleSize(chromaticNotes, 12).map(
        (noteName: string, index) => ({
          id: `${index}`,
          text: tonal.Note.pc(noteName),
          note: noteName,
          midi: tonal.Note.midi(noteName),
        }),
      ),
      currentNoteCardPlaying: 0,
    }
  }

  componentDidMount() {
    this.initNotationRenderer()
    this.initSynth()
    this.scheduleNotes()
  }

  componentWillUnmount() {
    this.cleanUp()
  }

  private initNotationRenderer = () => {
    this.notationRoot = document.getElementById('notation') as HTMLElement
    this.renderer = new Vex.Flow.Renderer(
      this.notationRoot,
      Vex.Flow.Renderer.Backends.SVG,
    )
  }

  private initSynth = () => {
    this.cleanUp()

    this.synth = new Tone.PolySynth(10, Tone.Synth, {
      oscillator: {
        partials: [0, 2, 3, 4],
      },
    }).toMaster()

    Tone.Transport.loopEnd = '3m'
    Tone.Transport.loop = true

    Tone.Transport.bpm.value = this.state.bpm
  }

  private cleanUp = () => {
    if (this.synth) {
      this.synth.disconnect(Tone.Master)
      this.synth.dispose()
      this.synth = null
    }
  }

  private handleShuffleClick = () => {
    this.setState(
      state => ({
        noteCards: [
          state.noteCards[0],
          ...shuffle([...state.noteCards.slice(1)]),
        ],
      }),
      this.onNoteCardsUpdated,
    )
  }

  private onNoteCardsUpdated = () => {
    const hasBeenPlaying = this.state.isPlaying
    this.stopPlaying(() => {
      if (hasBeenPlaying) {
        setTimeout(this.startPlaying, 200)
      }
    })
  }

  scheduleNote = (
    note: string,
    time: string = '0:0',
    duration: string = '4n',
  ) => {
    console.log(`Scheduling note: ${note} ${time}`)

    return Tone.Transport.schedule(contextTime => {
      if (this.synth) {
        this.synth.triggerAttackRelease(note, duration, contextTime)
      }

      Tone.Draw.schedule(() => this.drawAnimation(time), contextTime)
    }, Tone.Time(time))
  }

  drawAnimation = time => {
    console.log('drawAnimation', time)
    if (time === '0:0' && this.state.currentNoteCardPlaying === 0) {
      this.renderNotation()
      return
    }

    this.setState(
      state => ({
        currentNoteCardPlaying: state.isPlaying
          ? (state.currentNoteCardPlaying + 1) % 12
          : state.currentNoteCardPlaying,
      }),
      this.renderNotation,
    )
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
    this.scheduleNotes()
    this.setState({ isPlaying: true }, () => {
      Tone.Master.mute = false
      Tone.Transport.start()
    })
  }

  stopPlaying = (cb?: () => any) => {
    this.setState({ isPlaying: false, currentNoteCardPlaying: 0 }, () => {
      Tone.Master.mute = true
      Tone.Transport.stop()

      this.renderNotation()

      if (cb) {
        cb()
      }
    })
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

  private handleNoteCardClick = (noteCard: NoteCard) => {
    this.setState(
      state => ({
        noteCards: [
          noteCard,
          ...this.state.noteCards.filter(nc => nc.id !== noteCard.id),
        ],
      }),
      this.onNoteCardsUpdated,
    )
  }

  private handleScreenSizeUpdate = ({ height, width }) => {
    const stateUpdate: Partial<AppState> = { height, width }
    if (this.notationRoot) {
      const {
        width: notationRootWidth,
      } = this.notationRoot.getBoundingClientRect()
      stateUpdate.notationRootWidth = notationRootWidth
    }
    this.setState(stateUpdate as any, this.renderNotation)
  }

  private renderNotation = () => {
    const width = this.state.notationRootWidth

    // Configure the rendering context
    this.renderer.resize(width, 300)

    this.renderContext = this.renderer.getContext()
    this.renderContext.clear()
    this.renderContext.setFont('Arial', 10).setBackgroundFillStyle('white')

    // Create a stave of at position 10, 40 on the canvas.
    const stave = new Vex.Flow.Stave(10, 40, width)

    // Add a clef and time signature.
    stave.addClef('treble').addTimeSignature('4/4')

    // Connect it to the rendering context and draw!
    stave.setContext(this.renderContext).draw()

    const noteConfigs = this.state.noteCards.map(noteCard => ({
      keys: [
        `${tonal.Note.pc(noteCard.note)}/${tonal.Note.oct(noteCard.note)}`,
      ],
      duration: '4',
    }))

    const notes = noteConfigs.map(nc => new Vex.Flow.StaveNote(nc))
    if (this.state.isPlaying) {
      notes[this.state.currentNoteCardPlaying].setStyle({
        fillStyle: darken(0.1, '#4de779'),
        strokeStyle: darken(0.1, '#4de779'),
      })
    }

    var beams = Vex.Flow.Beam.generateBeams(notes)
    Vex.Flow.Formatter.FormatAndDraw(this.renderContext, stave, notes)
    beams.forEach(b => {
      b.setContext(this.renderContext).draw()
    })

    if (this.state.isPlaying) {
      const notePosition = notes[
        this.state.currentNoteCardPlaying
      ].getBoundingBox()
      const x = notePosition.getX() + notePosition.getW() / 2

      this.renderContext.save()
      this.renderContext.setLineWidth(1)
      this.renderContext.setStrokeStyle('salmon')

      this.renderContext
        .beginPath()
        // @ts-ignore
        .moveTo(x, stave.getBoundingBox().getY())
        .lineTo(
          x,
          // @ts-ignore
          stave.getBoundingBox().getY() + stave.getBoundingBox().getH(),
        )
        .stroke()

      this.renderContext.restore()
    }
  }

  public render() {
    const { bpm, noteCards, isPlaying, currentNoteCardPlaying } = this.state

    const activeNoteCard = this.state.noteCards[currentNoteCardPlaying]

    return (
      <ThemeProvider theme={theme}>
        <>
          <MeasureScreenSize onUpdate={this.handleScreenSizeUpdate} fireOnMount>
            <Flex
              height="100vh"
              width="100vw"
              flexDirection="column"
              css="overflow: hidden;"
            >
              <ContentContainer flex="1">
                <Flex
                  py={4}
                  // height="100%"
                  flex="1"
                  justifyContent="center"
                  alignItems="center"
                  flexDirection="column"
                >
                  <Flex flexDirection="row" mb={3} width={1}>
                    <Box flex="1">
                      <Button
                        title={isPlaying ? 'Stop' : 'Play'}
                        bg={isPlaying ? 'red' : 'green'}
                        m={[1, 2]}
                        onClick={this.togglePlayback}
                      >
                        {isPlaying ? 'Stop' : 'Play'}
                      </Button>

                      <Button
                        title="Shuffle note cards"
                        m={[1, 2]}
                        onClick={this.handleShuffleClick}
                      >
                        Shuffle!
                      </Button>
                    </Box>

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
                    {noteCards.map((noteCard, index) => (
                      <Flipped key={noteCard.id} flipId={noteCard.id}>
                        <Box
                          p={2}
                          width={1 / 4}
                          position="relative"
                          zIndex={currentNoteCardPlaying === index ? 2 : 1}
                        >
                          <NoteCard
                            tabIndex={0}
                            onClick={() => this.handleNoteCardClick(noteCard)}
                            width={1}
                            playing={
                              isPlaying && currentNoteCardPlaying === index
                            }
                          >
                            {noteCard.text}
                          </NoteCard>
                        </Box>
                      </Flipped>
                    ))}
                  </FlipperStyled>

                  <Box width={1} height="200px" id="notation" />
                </Flex>
              </ContentContainer>

              <Box>
                <ReactPiano.Piano
                  noteRange={
                    this.state.width > 900
                      ? pianoNoteRangeWide
                      : this.state.width > 600
                        ? pianoNoteRangeMiddle
                        : pianoNoteRangeNarrow
                  }
                  className={`${css`
                    .ReactPiano__Key {
                      transition: background-color 300ms;
                    }
                    .ReactPiano__Key--active {
                      background-color: #4de779;
                    }
                  `}`}
                  playNote={midiNumber => {
                    // Play a given note - see notes below
                    console.log('Piano / play: ', midiNumber)
                  }}
                  stopNote={midiNumber => {
                    // Stop playing a given note - see notes below
                    console.log('Piano / stop: ', midiNumber)
                  }}
                  activeNotes={isPlaying ? [activeNoteCard.midi] : undefined}
                  width={Math.max(layoutMinWidth, this.state.width)}
                  keyboardShortcuts={keyboardShortcuts}
                />
              </Box>
            </Flex>
          </MeasureScreenSize>
        </>
      </ThemeProvider>
    )
  }
}

export default App
