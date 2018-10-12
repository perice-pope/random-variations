import * as React from 'react'
import * as _ from 'lodash'
import * as tonal from 'tonal'
import * as Vex from 'vexflow'
import { darken, lighten, getLuminance } from 'polished'

import { Box, BoxProps } from './ui'
import { StaffNoteType } from '../types'

type NotesStaffProps = {
  notes: StaffNoteType[]
  activeNote?: StaffNoteType
  width: number
  containerProps?: BoxProps
}

class NotesStaff extends React.Component<NotesStaffProps, {}> {
  private notationRoot: HTMLElement
  private renderer: Vex.Flow.Renderer
  private renderContext: Vex.IRenderContext

  componentDidMount() {
    this.initNotationRenderer()
  }

  private initNotationRenderer = () => {
    this.notationRoot = document.getElementById('notation') as HTMLElement
    this.renderer = new Vex.Flow.Renderer(
      this.notationRoot,
      Vex.Flow.Renderer.Backends.SVG,
    )
  }

  public getNotationRoot = () => this.notationRoot

  public draw = () => {
    this.renderStaffAndNotes()
  }

  private renderStaffAndNotes = () => {
    const { width, activeNote, notes: notesConfig } = this.props

    // Configure the rendering context
    this.renderer.resize(width, 300)

    this.renderContext = this.renderer.getContext()
    this.renderContext.clear()
    this.renderContext
      .setFont('Arial', 10)
      .setBackgroundFillStyle('white')
      .setFillStyle('black')
      .setStrokeStyle('black')
    this.renderContext.save()

    // Create a stave of at position 10, 40 on the canvas.
    const stave = new Vex.Flow.Stave(10, 40, width)

    // Add a clef and time signature.
    stave.addClef('treble')

    // Connect it to the rendering context and draw!
    stave.setContext(this.renderContext).draw()

    const notes = notesConfig.map(noteConfig => {
      const [letter, accidental, octave] = tonal.Note.tokenize(noteConfig.note)

      const vexFlowNoteConfig = {
        keys: [`${letter}${accidental}/${octave}`],
        duration: noteConfig.duration,
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

      if (noteConfig === activeNote) {
        note.setStyle({
          fillStyle: lighten(0.1, noteColor),
          strokeStyle: lighten(0.1, noteColor),
        })
      } else {
        note.setStyle({
          fillStyle: noteColor,
          strokeStyle: noteColor,
        })
      }

      // Hide the stems
      note
        .getStem()
        .setStyle({ fillStyle: 'transparent', strokeStyle: 'transparent' })

      return note
    })

    Vex.Flow.Formatter.FormatAndDraw(this.renderContext, stave, notes)

    const activeNoteIndex = notesConfig.findIndex(n => n === activeNote)
    if (activeNoteIndex !== -1) {
      const notePosition = notes[activeNoteIndex].getBoundingBox()
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

    this.renderContext.restore()
  }

  public render() {
    const { containerProps } = this.props

    // @ts-ignore
    return <Box width={1} id="notation" {...containerProps} />
  }
}

export default NotesStaff
