import * as React from 'react'
import * as _ from 'lodash'
import * as tonal from 'tonal'
import * as Vex from 'vexflow'
import { css } from 'react-emotion'
import { darken, getLuminance } from 'polished'

import { Box, BoxProps } from './ui'
import { StaffTick } from '../types'
import MeasureScreenSize from './MeasureScreenSize'

const activeNoteClasses = {
  base: css({
    transition: '0.2s transform, 0.5s opacity',
  }),
  hidden: css({
    opacity: 0,
  }),
}

type NotesStaffProps = {
  id: string
  lines: number
  ticks: StaffTick[]
  clef: string
  isPlaying: boolean
  showBreaks?: boolean
  showEnd?: boolean
  activeTickIndex?: number
  staveHeight: number
  height: number
  containerProps?: BoxProps
}

type NotesStaffState = {
  boxWidth: number
}

class NotesStaff extends React.Component<NotesStaffProps, NotesStaffState> {
  static defaultProps: Partial<NotesStaffProps> = {
    lines: 1,
    staveHeight: 100,
    clef: 'treble',
  }

  state: NotesStaffState = {
    boxWidth: 0,
  }

  // @ts-ignore
  private root: HTMLElement
  // @ts-ignore
  private renderer: Vex.Flow.Renderer
  // @ts-ignore
  private renderContext: Vex.IRenderContext

  private boxRef: React.RefObject<any> = React.createRef()

  private notesPerTick: Vex.Flow.Note[][] = []
  private tickToLine: { [k: number]: number } = {}
  private staves: Vex.Flow.Stave[] = []
  private activeLineEl?: SVGElement

  componentDidMount() {
    this.initRenderer()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.height !== this.props.height) {
      this.redraw()
      return
    }

    if (prevProps.ticks.length !== this.props.ticks.length) {
      this.redraw()
      return
    }

    if (prevProps.ticks !== this.props.ticks) {
      this.drawNotes()
    }
    if (
      prevProps.activeTickIndex !== this.props.activeTickIndex &&
      this.props.activeTickIndex != null
    ) {
      this.updateActiveNoteLine()
    }

    if (prevProps.isPlaying !== this.props.isPlaying) {
      if (this.props.isPlaying === false) {
        this.hideActiveNoteLine()
      } else {
        this.showActiveNoteLine()
      }
    }
  }

  private initRenderer = () => {
    this.root = document.getElementById(this.props.id) as HTMLElement
    this.renderer = new Vex.Flow.Renderer(
      this.root,
      Vex.Flow.Renderer.Backends.SVG,
    )
    this.redraw()
  }

  private redraw = () => {
    console.log('NotesStaff -> redraw')
    const { height } = this.props
    const width = this.state.boxWidth

    // Configure the rendering context
    this.renderer.resize(width, height)

    this.renderContext = this.renderer.getContext()
    this.renderContext.clear()
    this.renderContext
      .setFont('Arial', 14)
      .setBackgroundFillStyle('white')
      .setFillStyle('black')
      .setStrokeStyle('black')
    this.renderContext.save()

    this.drawStaveAndClef()
    this.drawActiveNoteLine()

    this.drawNotes()
    this.updateActiveNoteLine()
  }

  private drawActiveNoteLine = () => {
    console.log('NotesStaff -> drawActiveNoteLine')
    const { staves } = this

    if (this.activeLineEl) {
      this.activeLineEl.remove()
      this.activeLineEl = undefined
    }

    this.renderContext.save()
    this.renderContext.setLineWidth(2)
    this.renderContext.setStrokeStyle('salmon')

    // @ts-ignore
    this.activeLineEl = this.renderContext.openGroup() as SVGElement

    this.renderContext
      .beginPath()
      // @ts-ignore
      .moveTo(0, staves[0].getBoundingBox().getY() + 20)
      .lineTo(
        0,
        // @ts-ignore
        staves[0].getBoundingBox().getY() +
          // @ts-ignore
          staves[0].getBoundingBox().getH() -
          20,
      )
      .stroke()
    this.renderContext.restore()

    this.activeLineEl.classList.add('vf-active-line', activeNoteClasses.base)

    if (!this.props.isPlaying) {
      this.activeLineEl.classList.add(activeNoteClasses.hidden)
    }

    // @ts-ignore
    this.renderContext.closeGroup()
  }

  private hideActiveNoteLine = () => {
    if (this.activeLineEl) {
      this.activeLineEl.classList.add(activeNoteClasses.hidden)

      // Reset the transition transform
      setTimeout(() => {
        if (this.activeLineEl) {
          // @ts-ignore
          this.activeLineEl.style = ''
        }
      }, 400)
    }
  }

  private showActiveNoteLine = () => {
    if (this.activeLineEl) {
      this.activeLineEl.classList.remove(activeNoteClasses.hidden)
    }
  }

  private drawStaveAndClef = () => {
    console.log('NotesStaff -> drawStaveAndClef')
    const width = this.state.boxWidth
    const { staveHeight } = this.props

    // Create a stave of at position 0, 0 on the canvas.
    this.staves = []
    for (let i = 0; i < this.props.lines; ++i) {
      this.staves[i] = new Vex.Flow.Stave(0, staveHeight * i, width)
      if (i === 0) {
        // Add a clef and time signature.
        this.staves[i].addClef(this.props.clef)
      }

      if (this.props.showEnd && i === this.props.lines - 1) {
        this.staves[i].setEndBarType(Vex.Flow.Barline.type.END)
      }

      // Connect it to the rendering context and draw!
      this.staves[i].setContext(this.renderContext).draw()
    }
  }

  private drawNotes = () => {
    console.log('NotesStaff -> drawNotes')
    const { ticks, lines } = this.props
    const { staves, renderContext } = this

    // Clear the old notes
    renderContext.clear()
    this.drawStaveAndClef()
    this.drawActiveNoteLine()
    // @ts-ignore
    renderContext.svg.querySelectorAll('.vf-stavenote').forEach(n => n.remove())
    // @ts-ignore
    // renderContext.svg.querySelectorAll('.rect').forEach(n => n.remove())

    if (!staves || !ticks || ticks.length === 0) {
      return
    }

    let tickIndexToCardId = {}

    const tickToNotes = ticks.map((tick, index) => {
      const shouldAddMeasureLine =
        index < ticks.length - 1 &&
        ticks[index + 1].noteCardId !== ticks[index].noteCardId

      tickIndexToCardId[index] = ticks[index].noteCardId

      const tickNoteKeys = tick.notes.map(noteConfig => {
        const [letter, accidental, octave] = tonal.Note.tokenize(
          noteConfig.noteName,
        )

        const noteFullName = `${letter}${accidental}/${octave}`
        return noteFullName
      })

      let vexFlowTickConfig
      if (tick.notes.length === 0) {
        if (this.props.showBreaks) {
          vexFlowTickConfig = {
            keys: ['b/4'],
            duration: 'qr',
          }
        }
      } else {
        vexFlowTickConfig = {
          keys: tickNoteKeys,
          duration: 'q',
        }
      }

      if (!vexFlowTickConfig) {
        return []
      }

      const vexFlowNote = new Vex.Flow.StaveNote(vexFlowTickConfig)

      tick.notes.forEach((noteConfig, index) => {
        const [, accidental] = tonal.Note.tokenize(noteConfig.noteName)

        if (accidental) {
          vexFlowNote.addAccidental(index, new Vex.Flow.Accidental(accidental))
        }

        const cardColorLuminance = getLuminance(noteConfig.color)
        const noteColor =
          cardColorLuminance > 0.6
            ? darken(0.2, noteConfig.color)
            : noteConfig.color

        vexFlowNote.setKeyStyle(index, {
          fillStyle: noteColor,
          strokeStyle: noteColor,
        })

        // Hide the stems
        vexFlowNote
          .getStem()
          .setStyle({ fillStyle: 'transparent', strokeStyle: 'transparent' })
      })

      let notes: Vex.Flow.Note[] = [vexFlowNote]

      if (shouldAddMeasureLine) {
        const measureLineNote = new Vex.Flow.BarNote().setType(
          Vex.Flow.Barline.type.SINGLE,
        )
        notes = [...notes, measureLineNote]
      }

      return notes
    })

    const tickIndexes = _.range(0, ticks.length)
    const cardIdToTickIndexes = _.groupBy(tickIndexes, i => ticks[i].noteCardId)

    const cardIdToLine = {}
    const cardIds = _.keys(cardIdToTickIndexes)
    const cardsPerLine = Math.ceil(cardIds.length / lines)

    cardIds.forEach((cardId, index) => {
      cardIdToLine[cardId] = Math.floor(index / cardsPerLine)
    })
    const lineToCardIds = _.groupBy(cardIds, cardId => cardIdToLine[cardId])

    this.tickToLine = {}
    tickToNotes.forEach((tick, tickIndex) => {
      this.tickToLine[tickIndex] = cardIdToLine[tickIndexToCardId[tickIndex]]
    })

    const lineToTickNotes = {}
    for (let i = 0; i < lines; ++i) {
      lineToTickNotes[i] = []
      lineToCardIds[i].forEach(cardId => {
        // @ts-ignore
        const tickIndexes = cardIdToTickIndexes[cardId]
        tickIndexes.forEach(tickIndex => {
          lineToTickNotes[i].push(tickToNotes[tickIndex])
        })
      })
    }

    console.log('lineToTickNotes', lineToTickNotes)

    for (let i = 0; i < lines; ++i) {
      Vex.Flow.Formatter.FormatAndDraw(
        this.renderContext,
        staves[i],
        _.flatten(lineToTickNotes[i]),
      )
    }

    this.notesPerTick = tickToNotes
  }

  updateActiveNoteLine = () => {
    if (!this.activeLineEl) {
      this.drawActiveNoteLine()
    }

    const { activeTickIndex } = this.props
    const { ticks, staveHeight } = this.props
    const { notesPerTick } = this

    if (
      activeTickIndex != null &&
      activeTickIndex >= 0 &&
      activeTickIndex < ticks.length
    ) {
      const notesPerActiveTick = notesPerTick[activeTickIndex]
      const activeNote = notesPerActiveTick.find(
        n => n instanceof Vex.Flow.StaveNote,
      ) as Vex.Flow.StaveNote | undefined

      if (activeNote) {
        const noteHeadX =
          activeNote.getNoteHeadBeginX() +
          (activeNote.getNoteHeadEndX() - activeNote.getNoteHeadBeginX()) / 2

        const activeLineXNew = noteHeadX
        const activeLineYNew = this.tickToLine[activeTickIndex] * staveHeight

        // @ts-ignore
        this.activeLineEl.style = `transform: translateX(${activeLineXNew}px) translateY(${activeLineYNew}px);`

        activeNote.draw()
      }
    }
  }

  private handleScreenSizeUpdate = () => {
    if (this.boxRef && this.boxRef.current) {
      const { width: boxWidth } = this.boxRef.current.getBoundingClientRect()
      this.setState({ boxWidth }, this.redraw)
    }
  }

  public render() {
    const { id, height, containerProps } = this.props

    const content = (
      // @ts-ignore
      <Box
        width={1}
        {...containerProps}
        // @ts-ignore
        innerRef={this.boxRef}
      >
        <Box height={height} width={1} id={id} />
      </Box>
    )

    return (
      <MeasureScreenSize onUpdate={this.handleScreenSizeUpdate} fireOnMount>
        {content}
      </MeasureScreenSize>
    )
  }
}

export default NotesStaff
