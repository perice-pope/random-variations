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
  ticks: StaffTick[]
  isPlaying: boolean
  showBreaks?: boolean
  activeTickIndex?: number
  height: number
  containerProps?: BoxProps
}

type NotesStaffState = {
  boxWidth: number
}

class NotesStaff extends React.Component<NotesStaffProps, NotesStaffState> {
  state: NotesStaffState = {
    boxWidth: 0,
  }

  private root: HTMLElement
  private renderer: Vex.Flow.Renderer
  private renderContext: Vex.IRenderContext

  private boxRef: React.RefObject<any> = React.createRef()

  private notesPerTick: Vex.Flow.StaveNote[][] = []
  private stave?: Vex.Flow.Stave
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
    const { stave } = this
    if (!stave) {
      return
    }

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
      .moveTo(0, this.stave.getBoundingBox().getY() + 20)
      .lineTo(
        0,
        // @ts-ignore
        stave.getBoundingBox().getY() +
          // @ts-ignore
          stave.getBoundingBox().getH() -
          20,
      )
      .stroke()

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

    // Create a stave of at position 10, 40 on the canvas.
    const stave = new Vex.Flow.Stave(10, 0, width)
    this.stave = stave

    // Add a clef and time signature.
    stave.addClef('treble')

    // Connect it to the rendering context and draw!
    stave.setContext(this.renderContext).draw()
  }

  private drawNotes = () => {
    console.log('NotesStaff -> drawNotes')
    const { ticks } = this.props
    const { stave, renderContext } = this

    if (!stave) {
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

      if (tickNotes.length === 0 && this.props.showBreaks) {
        // Add a break symbol
        const pause = new Vex.Flow.StaveNote({ keys: ['b/4'], duration: 'qr' })
        tickNotes.push(pause)
      }

      return tickNotes
    })

    Vex.Flow.Formatter.FormatAndDraw(
      this.renderContext,
      stave,
      _.flatten(notesPerTick),
    )
    this.notesPerTick = notesPerTick
  }

  updateActiveNoteLine = () => {
    if (!this.stave) {
      return
    }

    if (!this.activeLineEl) {
      this.drawActiveNoteLine()
    }

    const { activeTickIndex } = this.props
    const { ticks } = this.props
    const { notesPerTick } = this

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

        const activeLineXNew = noteHeadX

        // @ts-ignore
        this.activeLineEl.style = `transform: translateX(${activeLineXNew}px);`

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
