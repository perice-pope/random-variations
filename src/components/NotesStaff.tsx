import * as React from 'react'
import * as _ from 'lodash'
import * as tonal from 'tonal'
import * as Vex from 'vexflow'
import { darken, getLuminance } from 'polished'

import { Box, BoxProps } from './ui'
import { StaffTick } from '../types'

type NotesStaffProps = {
  id: string
  ticks: StaffTick[]
  activeTickIndex?: number
  width: number
  height: number
  containerProps?: BoxProps
}

class NotesStaff extends React.Component<NotesStaffProps, {}> {
  private root: HTMLElement
  private renderer: Vex.Flow.Renderer
  private renderContext: Vex.IRenderContext

  private notesPerTick: Vex.Flow.StaveNote[][] = []
  private stave?: Vex.Flow.Stave

  componentDidMount() {
    this.initRenderer()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.ticks.length !== this.props.ticks.length) {
      this.redraw()
    } else if (prevProps.ticks !== this.props.ticks) {
      this.drawNotes()
    } else if (prevProps.activeTickIndex !== this.props.activeTickIndex) {
      this.drawActiveNoteLine()
    } else if (
      prevProps.width !== this.props.width ||
      prevProps.height !== this.props.height
    ) {
      this.redraw()
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

  public redraw = () => {
    console.log('redraw')
    const { width, height } = this.props

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
    this.drawNotes()
    this.drawActiveNoteLine()
  }

  private drawStaveAndClef = () => {
    console.log('drawStaveAndClef')
    const { width } = this.props

    // Create a stave of at position 10, 40 on the canvas.
    const stave = new Vex.Flow.Stave(10, 0, width)
    this.stave = stave

    // Add a clef and time signature.
    stave.addClef('treble')

    // Connect it to the rendering context and draw!
    stave.setContext(this.renderContext).draw()
  }

  private drawNotes = () => {
    console.log('drawNotes')
    const { ticks } = this.props
    const { stave, renderContext } = this

    if (!stave) {
      console.log('fish')
      return
    }

    // Clear the old notes
    // @ts-ignore
    renderContext.svg.querySelectorAll('.vf-stavenote').forEach(n => n.remove())

    const notesPerTick = ticks.map(tick => {
      const tickNotes = tick.notes.map(noteConfig => {
        const [letter, accidental, octave] = tonal.Note.tokenize(
          noteConfig.noteName,
        )

        const vexFlowNoteConfig = {
          keys: [`${letter}${accidental}/${octave}`],
          duration: '4',
        }

        const note = new Vex.Flow.StaveNote(vexFlowNoteConfig)
        if (accidental) {
          note.addAccidental(0, new Vex.Flow.Accidental(accidental))
        }

        const cardColorLuminance = getLuminance(noteConfig.color)
        const noteColor =
          cardColorLuminance > 0.6
            ? darken(0.2, noteConfig.color)
            : noteConfig.color

        note.setStyle({
          fillStyle: noteColor,
          strokeStyle: noteColor,
        })

        // Hide the stems
        note
          .getStem()
          .setStyle({ fillStyle: 'transparent', strokeStyle: 'transparent' })

        return note
      })

      return tickNotes
    })

    Vex.Flow.Formatter.FormatAndDraw(
      this.renderContext,
      stave,
      _.flatten(notesPerTick),
    )
    this.notesPerTick = notesPerTick
    this.renderContext.restore()
  }

  drawActiveNoteLine = () => {
    console.log('drawActiveNoteLine')
    if (!this.stave) {
      return
    }

    this.renderContext.save()
    const { activeTickIndex } = this.props
    const { ticks } = this.props
    const { stave, notesPerTick } = this

    if (
      activeTickIndex != null &&
      activeTickIndex >= 0 &&
      activeTickIndex < ticks.length
    ) {
      const notesPerActiveTick = notesPerTick[activeTickIndex]
      const activeNote = notesPerActiveTick[0]

      if (activeNote) {
        const noteHeadX =
          activeNote.getNoteHeadBeginX() +
          (activeNote.getNoteHeadEndX() - activeNote.getNoteHeadBeginX()) / 2

        this.renderContext.save()
        this.renderContext.setLineWidth(1)
        this.renderContext.setStrokeStyle('salmon')

        this.renderContext
          .beginPath()
          // @ts-ignore
          .moveTo(noteHeadX, this.stave.getBoundingBox().getY() + 20)
          .lineTo(
            noteHeadX,
            // @ts-ignore
            stave.getBoundingBox().getY() + stave.getBoundingBox().getH() - 20,
          )
          .stroke()

        this.renderContext.restore()

        activeNote.draw()
      }
    }
  }

  public render() {
    const { id, height, containerProps } = this.props

    return (
      // @ts-ignore
      <Box width={1} id={id} height={height} {...containerProps} />
    )
  }
}

export default NotesStaff
