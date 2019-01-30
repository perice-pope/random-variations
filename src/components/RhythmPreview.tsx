import * as React from 'react'
import * as _ from 'lodash'
import * as Vex from 'vexflow'
import { css, cx } from 'react-emotion'

import { Box } from './ui'
import MeasureScreenSize from './MeasureScreenSize'

type RhythmPreviewProps = {
  beats: number
  divisions: number
  offset?: number

  id: string
  scale?: number
  staveHeight: number
  containerProps?: any
  innerContainerClassName?: string
}

type RhythmPreviewState = {
  boxWidth: number
}

class RhythmPreview extends React.Component<
  RhythmPreviewProps,
  RhythmPreviewState
> {
  static defaultProps: Partial<RhythmPreviewProps> = {
    beats: 3,
    divisions: 2,
    offset: 0,

    scale: 1,
    staveHeight: 130,
  }

  state: RhythmPreviewState = {
    boxWidth: 0,
  }

  // @ts-ignore
  private root: HTMLElement
  // @ts-ignore
  private renderer: Vex.Flow.Renderer
  // @ts-ignore
  private renderContext: Vex.IRenderContext

  private boxRef: React.RefObject<any> = React.createRef()

  private staves: Vex.Flow.Stave[] = []

  componentDidMount() {
    this.initRenderer()
  }

  private initRenderer = () => {
    this.root = document.getElementById(this.props.id) as HTMLElement
    this.renderer = new Vex.Flow.Renderer(
      this.root,
      Vex.Flow.Renderer.Backends.SVG,
    )
    this.redraw()
  }

  private getHeight = () => this.props.staveHeight * 2 + 30

  private getWidth = () => {
    const { boxWidth } = this.state
    const notesCount = this.props.beats * this.props.divisions
    const minWidth = notesCount * 22
    const maxWidth = notesCount * 100

    return Math.max(280, Math.min(maxWidth, Math.max(minWidth, boxWidth - 100)))
  }

  private redraw = () => {
    console.log('RhythmPreview -> redraw')
    const height = this.getHeight()
    const width = this.getWidth()

    this.renderer.resize(width, height)
    this.renderContext = this.renderer.getContext()
    this.renderContext.scale(this.props.scale || 1, this.props.scale || 1)
    this.renderContext.clear()

    this.drawStaveAndClef()
  }

  private getSubdivisionNotesLength = () => {
    const { divisions } = this.props
    switch (divisions) {
      case 1:
        return 'q'
      case 2:
      case 3:
      case 5:
      case 7:
      case 6:
      case 9:
      case 10:
      case 11:
      case 12:
      case 13:
      case 14:
      case 15:
        return '8'
      case 4:
        return '16'
      case 8:
        return '32'
      case 16:
        return '64'
      default:
        return '64'
    }
  }

  private configureRhythmStave = () => {
    const { beats, divisions } = this.props

    const rhythmKey = `${beats}:${divisions}`
    const rhythmConfigs = {
      '8:1': {
        noteDurations: ['1/2'],
        rhythmName: 'Double Whole Note',
      },
      '6:1': {
        noteDurations: ['1d'],
        rhythmName: 'Dotted Whole Note',
      },
      '4:1': {
        noteDurations: ['1'],
        rhythmName: 'Whole Note',
      },
      '7:2': {
        noteDurations: ['2dd', '2dd'],
        rhythmName: 'Double Dotted Half Note',
      },
      '3:1': {
        noteDurations: ['2d'],
        rhythmName: 'Dotted Half Note',
      },
      '2:1': {
        noteDurations: ['2'],
        rhythmName: 'Half Note',
      },
      '7:4': {
        noteDurations: ['4dd', '4dd', '4dd', '4dd'],
        rhythmName: 'Double Dotted Quarter Note',
      },
      '8:5': {
        noteDurations: ['2', '2', '2', '2', '2'],
        rhythmName: 'Half Note Quintuplet',
        tupleOptions: {
          num_notes: 5,
          notes_occupied: 4,
        },
      },
      '3:2': {
        noteDurations: ['4d', '4d'],
        rhythmName: 'Dotted Quarter Note',
      },
      '4:3': {
        noteDurations: ['2', '2', '2'],
        rhythmName: 'Half Note Triplet',
        tupleOptions: {
          num_notes: 3,
          notes_occupied: 2,
        },
      },
      '8:7': {
        noteDurations: ['2', '2', '2', '2', '2', '2', '2'],
        rhythmName: 'Half Note Septuplet',
        tupleOptions: {
          num_notes: 7,
          notes_occupied: 2,
        },
      },
      '1:1': {
        noteDurations: ['4'],
        rhythmName: 'Quarter Note',
      },
      '4:5': {
        noteDurations: ['4', '4', '4', '4', '4'],
        rhythmName: 'Quarter Note Quintuplet',
        tupleOptions: {
          num_notes: 5,
          notes_occupied: 4,
        },
      },
      '3:4': {
        noteDurations: ['8d', '8d', '8d', '8d'],
        rhythmName: 'Dotted 8th',
      },
      '2:3': {
        noteDurations: ['4', '4', '4'],
        rhythmName: 'Quarter Note Triplet',
        tupleOptions: {
          num_notes: 3,
          notes_occupied: 2,
        },
      },
      '1:2': {
        noteDurations: ['8', '8'],
        rhythmName: '8th Note',
      },
      '4:9': {
        noteDurations: ['8', '8', '8', '8', '8', '8', '8', '8', '8'],
        rhythmName: '8th Note Nontuplet',
        tupleOptions: {
          num_notes: 9,
          notes_occupied: 8,
        },
      },
      '2:5': {
        noteDurations: ['8', '8', '8', '8', '8'],
        rhythmName: '8th Note Quintuplet',
        tupleOptions: {
          num_notes: 5,
          notes_occupied: 4,
        },
      },
      '3:8': {
        noteDurations: ['16d', '16d', '16d', '16d', '16d', '16d', '16d', '16d'],
        rhythmName: 'Dotted 16th Note',
      },
      '1:3': {
        noteDurations: ['8', '8', '8'],
        rhythmName: '8th Note Triplet',
        tupleOptions: {
          num_notes: 3,
          notes_occupied: 2,
        },
      },
      '2:7': {
        noteDurations: ['8', '8', '8', '8', '8', '8', '8'],
        rhythmName: '8th Note Septuplet',
        tupleOptions: {
          num_notes: 7,
          notes_occupied: 4,
        },
      },
      '1:4': {
        noteDurations: ['16', '16', '16', '16'],
        rhythmName: '16th Note',
      },
      '2:9': {
        noteDurations: ['16', '16', '16', '16', '16', '16', '16', '16', '16'],
        rhythmName: '16th Note Nontuplet',
        tupleOptions: {
          num_notes: 9,
          notes_occupied: 8,
        },
      },
      '1:5': {
        noteDurations: ['16', '16', '16', '16', '16'],
        rhythmName: '16th Note Quintuplet',
        tupleOptions: {
          num_notes: 5,
          notes_occupied: 4,
        },
      },
      '1:6': {
        noteDurations: ['16', '16', '16', '16', '16', '16'],
        rhythmName: '16th Note Sextuplet',
        tupleOptions: {
          num_notes: 6,
          notes_occupied: 4,
        },
      },
      '1:7': {
        noteDurations: ['16', '16', '16', '16', '16', '16', '16'],
        rhythmName: '16th Note Septuplet',
        tupleOptions: {
          num_notes: 7,
          notes_occupied: 4,
        },
      },
      '1:8': {
        noteDurations: ['32', '32', '32', '32', '32', '32', '32', '32'],
        rhythmName: '32th Note',
      },
      '1:9': {
        noteDurations: ['32', '32', '32', '32', '32', '32', '32', '32', '32'],
        rhythmName: '32th Note Nontuplet',
        tupleOptions: {
          num_notes: 9,
          notes_occupied: 8,
        },
      },
      '1:10': {
        noteDurations: [
          '32',
          '32',
          '32',
          '32',
          '32',
          '32',
          '32',
          '32',
          '32',
          '32',
        ],
        enableBeams: true,
        rhythmName: '32th Note Dectuplet',
        tupleOptions: {
          num_notes: 10,
          notes_occupied: 8,
        },
      },
      '1:16': {
        noteDurations: [
          '64',
          '64',
          '64',
          '64',
          '64',
          '64',
          '64',
          '64',
          '64',
          '64',
          '64',
          '64',
          '64',
          '64',
          '64',
          '64',
        ],
        rhythmName: '64th Note',
      },
    }

    const {
      enableBeams = false,
      rhythmName = '',
      noteDurations = [],
      tupleOptions = undefined,
    } = rhythmConfigs[rhythmKey] || {}

    const notes = noteDurations.map(duration => {
      const note = new Vex.Flow.StaveNote({
        duration,
        keys: ['B/4'],
        stem_direction: -1,
      })

      if (duration.endsWith('dd')) {
        note.addDot(0).addDot(0)
      } else if (duration.endsWith('d')) {
        note.addDot(0)
      }

      return note
    })

    const beams = enableBeams ? [new Vex.Flow.Beam(notes)] : []

    const tuplets: Vex.Flow.Tuplet[] = []
    if (tupleOptions) {
      let currentNoteIndex = 0
      while (currentNoteIndex < notes.length) {
        // @ts-ignore
        const tuplet = new Vex.Flow.Tuplet(
          notes.slice(
            currentNoteIndex,
            currentNoteIndex + tupleOptions.num_notes,
          ),
          {
            location: -1,
            bracketed: true,
            // @ts-ignore
            ratioed: false,
            ...tupleOptions,
          },
        )
        // @ts-ignore
        // Workaround for bug in VexFlow: glyphs are shown in the wrong order
        tuplet.num_glyphs = _.reverse(tuplet.num_glyphs)

        tuplets.push(tuplet)
        currentNoteIndex += tupleOptions.num_notes
      }
    }

    const voice = new Vex.Flow.Voice({
      num_beats: this.props.beats,
      beat_value: 4,
    })
      .setMode(Vex.Flow.Voice.Mode.SOFT)
      .addTickables([
        ...new Array(this.props.offset).fill(null).map(
          () =>
            new Vex.Flow.StaveNote({
              keys: ['B/4'],
              duration: 'qr',
              stem_direction: -1,
            }),
        ),
        new Vex.Flow.BarNote().setType(Vex.Flow.Barline.type.REPEAT_BEGIN),
        ...notes,
        new Vex.Flow.BarNote().setType(Vex.Flow.Barline.type.REPEAT_END),
      ])

    return {
      rhythmName,
      notes,
      beams,
      voice,
      tuplets,
      shouldShowRhythmsStave: notes.length > 0,
    }
  }

  private drawStaveAndClef = (staveYs?: number[]) => {
    console.log('RhythmPreview -> drawStaveAndClef')
    const { staveHeight, scale, beats } = this.props

    // Configure "Rhythm" stave for some of the rhythms
    const {
      rhythmName,
      shouldShowRhythmsStave,
      voice: rhythmVoice,
      beams: rhythmBeams,
      tuplets: rhythmTuplets,
    } = this.configureRhythmStave()

    const linesCount = shouldShowRhythmsStave ? 3 : 2
    const width = this.getWidth() / (scale || 1.0)

    // Create a stave of at position 0, 0 on the canvas.
    this.staves = []
    for (let i = 0; i < linesCount; ++i) {
      this.staves[i] = new Vex.Flow.Stave(
        20,
        staveYs && !!staveYs[i] ? staveYs[i] : 15 + staveHeight * i,
        width - 10,
      )
        .setConfigForLines(
          [false, false, true, false, false].map(function(visible) {
            return { visible: visible }
          }),
        )
        .setBegBarType(Vex.Flow.Barline.type.NONE)
        .addClef('percussion')
        // Connect it to the rendering context and draw!
        .addTimeSignature(`${beats}/4`)
        // @ts-ignore
        .setContext(this.renderContext)
    }

    if (shouldShowRhythmsStave) {
      this.staves[0].setText(
        ` Rhythm - ${rhythmName}`,
        Vex.Flow.Modifier.Position.ABOVE,
        {
          shift_x: 20,
          justification: Vex.Flow.TextNote.Justification.LEFT,
        },
      )
      this.staves[1].setText(' Subdivision', Vex.Flow.Modifier.Position.ABOVE, {
        shift_x: 20,
        justification: Vex.Flow.TextNote.Justification.LEFT,
      })
      this.staves[2].setText(' Metronome', Vex.Flow.Modifier.Position.ABOVE, {
        shift_x: 20,
        justification: Vex.Flow.TextNote.Justification.LEFT,
      })
    } else {
      this.staves[0].setText(' Subdivision', Vex.Flow.Modifier.Position.ABOVE, {
        shift_x: 20,
        justification: Vex.Flow.TextNote.Justification.LEFT,
      })
      this.staves[1].setText(' Metronome', Vex.Flow.Modifier.Position.ABOVE, {
        shift_x: 20,
        justification: Vex.Flow.TextNote.Justification.LEFT,
      })
    }

    this.staves.forEach(s => s.draw())

    // @ts-ignore
    const connector = new Vex.Flow.StaveConnector(
      this.staves[0],
      this.staves[this.staves.length - 1],
    )
    connector.setType(Vex.Flow.StaveConnector.type.BRACKET)
    connector.setContext(this.renderContext)

    connector.draw()

    // Configure "Metronome" stave
    const meterNoteDuration = '4'
    const meterNotesCount = this.props.beats
    const meterNotes = _.range(0, meterNotesCount).map(
      () =>
        new Vex.Flow.StaveNote({
          keys: ['B/4'],
          duration: meterNoteDuration,
          stem_direction: -1,
        }),
    )

    meterNotes[0].addArticulation(
      0,
      new Vex.Flow.Articulation('a>').setPosition(3),
    )

    const meterVoice = new Vex.Flow.Voice({
      num_beats: this.props.beats,
      beat_value: 4,
    })
      .setMode(Vex.Flow.Voice.Mode.SOFT)
      .addTickables([
        ...new Array(this.props.offset).fill(null).map(
          () =>
            new Vex.Flow.StaveNote({
              keys: ['B/4'],
              duration: 'qr',
              stem_direction: -1,
            }),
        ),
        new Vex.Flow.BarNote().setType(Vex.Flow.Barline.type.REPEAT_BEGIN),
        ...meterNotes,
        new Vex.Flow.BarNote().setType(Vex.Flow.Barline.type.REPEAT_END),
      ])

    // Configure "Subdivision" stave

    const subdivisionNoteLength = this.getSubdivisionNotesLength()
    const subdivisionNotesCount = this.props.beats * this.props.divisions

    const subdivisionNotes = _.range(0, subdivisionNotesCount).map(index => {
      const note = new Vex.Flow.StaveNote({
        keys: ['B/4'],
        duration: subdivisionNoteLength,
        stem_direction: -1,
      })
      if (index % this.props.beats === 0) {
        note.addArticulation(0, new Vex.Flow.Articulation('a>').setPosition(3))
      } else {
        // @ts-ignore
        note.setKeyStyle(0, {
          fillStyle: 'transparent',
          strokeStyle: 'transparent',
        })
      }

      return note
    })

    // Add subdivision tuplets
    const subdivisionTuplets: Vex.Flow.Tuplet[] = []
    if (!_.includes([1, 2, 4, 8, 16], this.props.divisions)) {
      let currentNoteIndex = 0
      while (currentNoteIndex < subdivisionNotes.length) {
        // @ts-ignore
        const tuplet = new Vex.Flow.Tuplet(
          subdivisionNotes.slice(
            currentNoteIndex,
            currentNoteIndex + this.props.divisions,
          ),
          {
            // @ts-ignore
            ratioed: false,
            num_notes: this.props.divisions,
          },
        )
        // @ts-ignore
        // Workaround for bug in VexFlow: glyphs are shown in the wrong order
        tuplet.num_glyphs = _.reverse(tuplet.num_glyphs)

        subdivisionTuplets.push(tuplet)
        currentNoteIndex += this.props.divisions
      }
    }

    const subdivisionVoice = new Vex.Flow.Voice({
      num_beats: this.props.beats,
      beat_value: 4,
    })
      .setMode(Vex.Flow.Voice.Mode.SOFT)
      .addTickables([
        ...new Array(this.props.offset).fill(null).map(
          () =>
            new Vex.Flow.StaveNote({
              keys: ['B/4'],
              duration: 'qr',
              stem_direction: -1,
            }),
        ),
        new Vex.Flow.BarNote().setType(Vex.Flow.Barline.type.REPEAT_BEGIN),
        ...subdivisionNotes,
        new Vex.Flow.BarNote().setType(Vex.Flow.Barline.type.REPEAT_END),
      ])

    const subdivisionBeams = Vex.Flow.Beam.generateBeams(subdivisionNotes, {
      stem_direction: -1,
      // @ts-ignore
      secondary_breaks: '4',
    })

    const formatter = new Vex.Flow.Formatter()

    if (shouldShowRhythmsStave) {
      formatter.joinVoices([rhythmVoice])
    }
    formatter.joinVoices([meterVoice])
    formatter.joinVoices([subdivisionVoice])
    formatter.formatToStave(
      [
        ...(shouldShowRhythmsStave ? [rhythmVoice] : []),
        meterVoice,
        subdivisionVoice,
      ],
      this.staves[0],
    )

    if (shouldShowRhythmsStave) {
      rhythmVoice.draw(this.renderContext, this.staves[0])
      rhythmBeams.forEach(b => b.setContext(this.renderContext).draw())
      rhythmTuplets.forEach(b => b.setContext(this.renderContext).draw())
    }

    subdivisionVoice.draw(
      this.renderContext,
      this.staves[shouldShowRhythmsStave ? 1 : 0],
    )
    subdivisionBeams.forEach(b => b.setContext(this.renderContext).draw())
    subdivisionTuplets.forEach(b => b.setContext(this.renderContext).draw())

    meterVoice.draw(
      this.renderContext,
      this.staves[shouldShowRhythmsStave ? 2 : 1],
    )
  }

  private handleScreenSizeUpdate = () => {
    if (this.boxRef && this.boxRef.current) {
      const { width: boxWidth } = this.boxRef.current.getBoundingClientRect()
      this.setState({ boxWidth }, () => {
        this.redraw()
      })
    }
  }

  public render() {
    const { id, containerProps, innerContainerClassName } = this.props
    const height = this.getHeight()
    const width = this.getWidth()

    // @ts-ignore
    window.preview = this

    const content = (
      // @ts-ignore
      <div
        {...containerProps}
        className={cx(
          css(`
          width: 100%; 
          overflow-x: auto; 
          overflow-y: hidden; 
          `),
          (containerProps || {}).className,
        )}
        // @ts-ignore
        ref={this.boxRef}
      >
        <Box
          height={height}
          width={width}
          id={id}
          className={cx(
            css(`
            svg {
              * {
                user-select: none;
              }
            }
          `),
            innerContainerClassName,
          )}
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

export default RhythmPreview
