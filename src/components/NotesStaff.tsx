import * as React from 'react'
import * as _ from 'lodash'
import * as tonal from 'tonal'
import * as Vex from 'vexflow'
import { css } from 'react-emotion'
import { darken, getLuminance } from 'polished'

import { Box } from './ui'
import { StaffTick, ClefType } from '../types'
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
  scale?: number
  maxLines: number
  ticks: StaffTick[]
  tickLabels?: { [tickIndex: number]: string }
  clef: ClefType
  isPlaying: boolean
  showBreaks?: boolean
  showEnd?: boolean
  activeTickIndex?: number
  staveHeight: number
  containerProps?: any
}

type NotesStaffState = {
  boxWidth: number
}

class NotesStaff extends React.Component<NotesStaffProps, NotesStaffState> {
  static defaultProps: Partial<NotesStaffProps> = {
    maxLines: 1,
    scale: 1,
    staveHeight: 140,
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
  private labelAnnotations: Vex.Flow.Modifier[] = []

  private notesPerTick: Vex.Flow.Note[][] = []
  private tickToLine: { [k: number]: number } = {}
  private staves: Vex.Flow.Stave[] = []
  private activeLineEl?: SVGElement

  componentDidMount() {
    this.initRenderer()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.ticks.length !== this.props.ticks.length) {
      this.redraw()
      return
    }

    if (prevProps.ticks !== this.props.ticks) {
      this.drawNotes()
    }
    if (
      prevProps.activeTickIndex !== this.props.activeTickIndex &&
      this.props.activeTickIndex != null &&
      this.props.isPlaying
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

  private getLinesCount = () => {
    const cardsToLines = this.getCardsToLinesMapping()
    return Math.max(1, _.uniq(_.values(cardsToLines)).length)
  }

  private getHeight = () => {
    return (
      (50 + this.getLinesCount() * this.props.staveHeight) * this.props.scale!
    )
  }

  private redraw = () => {
    console.log('NotesStaff -> redraw')
    const height = this.getHeight()
    const width = this.state.boxWidth

    // Configure the rendering context
    this.renderer.resize(width, height)
    this.renderContext = this.renderer.getContext()
    this.renderContext.scale(this.props.scale || 1, this.props.scale || 1)

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

    const { activeTickIndex, ticks } = this.props
    const { notesPerTick } = this
    let noteHeadX = 0
    if (
      notesPerTick &&
      activeTickIndex != null &&
      activeTickIndex >= 0 &&
      activeTickIndex < ticks.length &&
      notesPerTick[activeTickIndex]
    ) {
      const notesPerActiveTick = notesPerTick[activeTickIndex]
      const activeNote = notesPerActiveTick.find(
        n => n instanceof Vex.Flow.StaveNote,
      ) as Vex.Flow.StaveNote | undefined
      if (activeNote) {
        noteHeadX =
          activeNote.getNoteHeadBeginX() +
          (activeNote.getNoteHeadEndX() - activeNote.getNoteHeadBeginX()) / 2
      }
    }

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
    // @ts-ignore
    this.activeLineEl.style = `transform: translateX(${noteHeadX}px) translateY(${0}px);`

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
          const { notesPerTick } = this
          const notesPerActiveTick =
            notesPerTick.length > 0 ? notesPerTick[0] : []
          let noteHeadX = 0
          const activeNote = notesPerActiveTick.find(
            n => n instanceof Vex.Flow.StaveNote,
          ) as Vex.Flow.StaveNote | undefined
          if (activeNote) {
            noteHeadX =
              activeNote.getNoteHeadBeginX() +
              (activeNote.getNoteHeadEndX() - activeNote.getNoteHeadBeginX()) /
                2
          }

          // @ts-ignore
          this.activeLineEl.style = `transform: translateX(${noteHeadX}px) translateY(${0}px);`
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
    const { staveHeight, scale } = this.props
    const linesCount = this.getLinesCount()
    const width = this.state.boxWidth / (scale || 1.0)

    // Create a stave of at position 0, 0 on the canvas.
    this.staves = []
    for (let i = 0; i < linesCount; ++i) {
      this.staves[i] = new Vex.Flow.Stave(0, 40 + staveHeight * i, width)
      if (i === 0) {
        // Add a clef and time signature.
        this.staves[i].addClef(this.props.clef)
      }

      if (this.props.showEnd && i === linesCount - 1) {
        this.staves[i].setEndBarType(Vex.Flow.Barline.type.END)
      }

      // Connect it to the rendering context and draw!
      this.staves[i].setContext(this.renderContext).draw()
    }
  }

  private drawNotes = () => {
    console.log('NotesStaff -> drawNotes')
    const { ticks } = this.props
    const { staves, renderContext } = this
    const linesCount = this.getLinesCount()

    // Clear the old notes
    renderContext.clear()
    this.drawStaveAndClef()
    // @ts-ignore
    const svg = renderContext.svg as SVGElement

    svg.querySelectorAll('.vf-stavenote').forEach(n => n.remove())
    // @ts-ignore
    // renderContext.svg.querySelectorAll('.rect').forEach(n => n.remove())

    if (!staves || !ticks || ticks.length === 0) {
      return
    }

    let tickIndexToCardId = {}

    this.labelAnnotations = []
    const tickToNotes = ticks.map((tick, index) => {
      const shouldAddMeasureLine =
        index < ticks.length - 1 &&
        ticks[index + 1].noteCardId !== tick.noteCardId

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
            clef: this.props.clef,
            keys: ['b/4'],
            duration: 'qr',
          }
        }
      } else {
        vexFlowTickConfig = {
          clef: this.props.clef,
          keys: tickNoteKeys,
          duration: 'q',
        }
      }

      let notes: Vex.Flow.Note[] = []
      if (vexFlowTickConfig) {
        let vexFlowNote
        try {
          vexFlowNote = new Vex.Flow.StaveNote(vexFlowTickConfig)
        } catch (error) {
          console.error(error)
          return notes
        }

        tick.notes.forEach((noteConfig, index) => {
          const [, accidental] = tonal.Note.tokenize(noteConfig.noteName)

          if (accidental) {
            vexFlowNote.addAccidental(
              index,
              new Vex.Flow.Accidental(accidental),
            )
          }

          let noteColor = 'gray'
          try {
            const cardColorLuminance = getLuminance(noteConfig.color)
            noteColor =
              cardColorLuminance > 0.6
                ? darken(0.2, noteConfig.color)
                : noteConfig.color
          } catch (error) {
            console.error(error)
          }

          vexFlowNote.setKeyStyle(index, {
            fillStyle: noteColor,
            strokeStyle: noteColor,
          })

          // Hide the stems
          vexFlowNote
            .getStem()
            .setStyle({ fillStyle: 'transparent', strokeStyle: 'transparent' })
        })

        notes = [vexFlowNote]
      }

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
    const cardIds = _.keys(cardIdToTickIndexes)

    const cardIdToLine = this.getCardsToLinesMapping()
    const lineToCardIds = _.groupBy(cardIds, cardId => cardIdToLine[cardId])

    this.tickToLine = {}
    tickToNotes.forEach((tick, tickIndex) => {
      this.tickToLine[tickIndex] = cardIdToLine[tickIndexToCardId[tickIndex]]
    })

    const lineToTickNotes = {}
    for (let i = 0; i < linesCount; ++i) {
      lineToTickNotes[i] = []
      if (!lineToCardIds[i]) {
        continue
      }
      lineToCardIds[i].forEach(cardId => {
        // @ts-ignore
        const tickIndexes = cardIdToTickIndexes[cardId]
        if (!tickIndexes) {
          return
        }
        tickIndexes.forEach(tickIndex => {
          lineToTickNotes[i].push(tickToNotes[tickIndex])
        })
      })
    }

    for (let i = 0; i < linesCount; ++i) {
      Vex.Flow.Formatter.FormatAndDraw(
        this.renderContext,
        staves[i],
        _.flatten(lineToTickNotes[i]),
      )
    }

    tickToNotes.forEach((notes, tickIndex) => {
      if (
        notes.length === 0 ||
        !this.props.tickLabels ||
        !this.props.tickLabels[tickIndex]
      ) {
        return
      }

      const label = this.props.tickLabels[tickIndex]
      let fontSize = 17
      if (label.length > 2) {
        fontSize = 15
      }
      if (label.length > 4) {
        fontSize = 14
      }
      if (label.length > 6) {
        fontSize = 13
      }
      if (label.length > 8) {
        fontSize = 12
      }

      const firstNote = notes[0]
      const y = firstNote.getYForTopText(1)
      const x = firstNote.getAbsoluteX()

      this.renderContext
        .setFont('Sans-Serif', fontSize, 900)
        .fillText(label, x, y)
    })

    this.renderContext.setStrokeStyle('black')
    this.renderContext.setFillStyle('black')
    this.labelAnnotations.forEach(modifier => {
      modifier.draw()
    })

    this.notesPerTick = tickToNotes

    this.drawActiveNoteLine()
    this.updateActiveNoteLine()
  }

  updateActiveNoteLine = () => {
    // console.log('updateActiveNoteLine')
    if (!this.activeLineEl) {
      this.drawActiveNoteLine()
    }

    const { activeTickIndex, isPlaying } = this.props
    if (!isPlaying) {
      return
    }
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

        if (this.boxRef && this.boxRef.current) {
          this.boxRef.current.scrollTo({
            top: activeLineYNew * (this.props.scale || 1.0),
            behavior: 'smooth',
          })
        }

        // @ts-ignore
        this.activeLineEl.style = `transform: translateX(${activeLineXNew}px) translateY(${activeLineYNew}px);`

        activeNote.draw()

        this.renderContext.setStrokeStyle('black')
        this.renderContext.setFillStyle('black')
        this.labelAnnotations.forEach(modifier => {
          modifier.draw()
        })
      }
    }
  }

  private handleScreenSizeUpdate = () => {
    if (this.boxRef && this.boxRef.current) {
      const { width: boxWidth } = this.boxRef.current.getBoundingClientRect()
      this.setState({ boxWidth }, this.redraw)
    }
  }

  // TODO: memoize this function
  private getCardsToLinesMapping = () => {
    const { ticks, maxLines, scale } = this.props
    const { boxWidth } = this.state
    const tickIndexes = _.range(0, ticks.length)
    const cardIdToTickIndexes = _.groupBy(tickIndexes, i => ticks[i].noteCardId)
    const cardIds = _.keys(cardIdToTickIndexes)

    let cardIdToLine = {}
    for (let lines = 1; lines <= maxLines; ++lines) {
      let cardsPerLine = Math.ceil(cardIds.length / lines)

      const lineToCardIds = _.chunk(cardIds, cardsPerLine)

      cardIdToLine = {}
      let maxLineNotesCount = 0

      for (let line = 0; line < lineToCardIds.length; ++line) {
        let lineNotesCount = 0
        lineToCardIds[line].forEach(cardId => {
          cardIdToLine[cardId] = line
          lineNotesCount += cardIdToTickIndexes[cardId].length
        })

        maxLineNotesCount = Math.max(lineNotesCount, maxLineNotesCount)
      }

      const minWidthPerNote = boxWidth / maxLineNotesCount / (scale || 1)
      if (minWidthPerNote > 60 && maxLineNotesCount < 32) {
        break
      }
    }

    return cardIdToLine
  }

  public render() {
    const { id, containerProps } = this.props
    const height = this.getHeight()

    const content = (
      // @ts-ignore
      <div
        className={css(`width: 100%`)}
        {...containerProps}
        // @ts-ignore
        ref={this.boxRef}
      >
        <Box
          height={height}
          width={1}
          id={id}
          className={css(`
          svg {
            * {
              user-select: none;
            }
          }
        `)}
        />
      </div>
    )

    return (
      <MeasureScreenSize onUpdate={this.handleScreenSizeUpdate} fireOnMount>
        {content}
      </MeasureScreenSize>
    )
  }
}

export default NotesStaff
