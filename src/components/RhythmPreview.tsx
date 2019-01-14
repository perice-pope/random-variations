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

// interface NoteDescription {
//   duration:
//     | 'w'
//     | 'h'
//     | 'q'
//     | '8'
//     | '16'
//     | '32'
//     | '64'
//     | 'wd'
//     | 'hd'
//     | 'qd'
//     | '8d'
//     | '16d'
//     | '32d'
//     | '64d'
// }

// interface NoteGroupDescription {
//   notes: NoteDescription[]
//   tuplet?: boolean
//   tie?: boolean
// }

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
    const minWidth = notesCount * 25
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

  /**
   * Each inner list of NoteDescription represents notes that should be connected by note ties
   */
  // private getRhythmNotes: () => NoteGroupDescription[] = () => {
  //   const { divisions, beats } = this.props
  //   const rhythmAsString = `${beats}:${divisions}`

  //   switch (rhythmAsString) {
  //     case '10:1':
  //       return [
  //         {
  //           notes: ['w', 'w', 'h'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tie: true,
  //         },
  //       ]
  //     case '1:1':
  //       return [
  //         { notes: ['q'].map(duration => ({ duration })) as NoteDescription[] },
  //       ]
  //     case '1:2':
  //       return [
  //         {
  //           notes: ['8', '8'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //         },
  //       ]
  //     case '1:3':
  //       return [
  //         {
  //           notes: ['8', '8', '8'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tuplet: true,
  //         },
  //       ]
  //     case '1:4':
  //       return [
  //         {
  //           notes: ['16', '16', '16', '16'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //         },
  //       ]
  //     case '2:1':
  //       return [
  //         { notes: ['h'].map(duration => ({ duration })) as NoteDescription[] },
  //       ]
  //     case '1:5':
  //       return [
  //         {
  //           notes: new Array(5)
  //             .fill('8')
  //             .map(duration => ({ duration })) as NoteDescription[],
  //           tuplet: true,
  //         },
  //       ]
  //     case '3:1':
  //       return [
  //         {
  //           notes: ['hd'].map(duration => ({ duration })) as NoteDescription[],
  //         },
  //       ]
  //     case '4:1':
  //       return [
  //         { notes: ['w'].map(duration => ({ duration })) as NoteDescription[] },
  //       ]
  //     case '1:6':
  //       return [
  //         {
  //           notes: new Array(6)
  //             .fill('8')
  //             .map(duration => ({ duration })) as NoteDescription[],
  //           tuplet: true,
  //         },
  //       ]
  //     case '6:1':
  //       return [
  //         {
  //           notes: ['wd'].map(duration => ({ duration })) as NoteDescription[],
  //         },
  //       ]
  //     case '1:8':
  //       return [
  //         {
  //           notes: new Array(8)
  //             .fill('32')
  //             .map(duration => ({ duration })) as NoteDescription[],
  //         },
  //       ]
  //     case '1:7':
  //       return [
  //         {
  //           notes: new Array(7)
  //             .fill('8')
  //             .map(duration => ({ duration })) as NoteDescription[],
  //           tuplet: true,
  //         },
  //       ]
  //     case '1:9':
  //       return [
  //         {
  //           notes: new Array(9)
  //             .fill('8')
  //             .map(duration => ({ duration })) as NoteDescription[],
  //           tuplet: true,
  //         },
  //       ]
  //     case '3:2':
  //       return [
  //         {
  //           notes: ['qd', 'qd'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //         },
  //       ]
  //     case '1:10':
  //       return [
  //         {
  //           notes: new Array(10)
  //             .fill('8')
  //             .map(duration => ({ duration })) as NoteDescription[],
  //           tuplet: true,
  //         },
  //       ]
  //     case '8:1':
  //       return [
  //         {
  //           notes: ['w', 'w'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tie: true,
  //         },
  //       ]
  //     case '5:1':
  //       return [
  //         {
  //           notes: ['hd', 'h'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tie: true,
  //         },
  //       ]
  //     case '7:1':
  //       return [
  //         {
  //           notes: ['w', 'hd'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tie: true,
  //         },
  //       ]
  //     case '2:3':
  //       return [
  //         {
  //           notes: ['q', 'q', 'q'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tuplet: true,
  //         },
  //       ]
  //     case '9:1':
  //       return [
  //         {
  //           notes: ['hd', 'hd', 'hd'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tie: true,
  //         },
  //       ]
  //     case '7:2':
  //       return [
  //         {
  //           notes: ['hdd', 'hdd'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tie: true,
  //         },
  //       ]
  //     case '1:16':
  //       return [
  //         {
  //           notes: new Array(16).fill('64').map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //         },
  //       ]
  //     case '5:2':
  //       return [
  //         {
  //           notes: ['h', '8'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tie: true,
  //         },
  //         {
  //           notes: ['8', 'h'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tie: true,
  //         },
  //       ]
  //     case '4:3':
  //       return [
  //         {
  //           notes: new Array(3).fill('h').map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tuplet: true,
  //         },
  //       ]
  //     case '3:4':
  //       return [
  //         {
  //           notes: new Array(4).fill('8d').map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //         },
  //       ]
  //     case '2:5':
  //       return [
  //         {
  //           notes: new Array(5).fill('8').map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tuplet: true,
  //         },
  //       ]
  //     case '9:2':
  //       return [
  //         {
  //           notes: ['w', '8'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tie: true,
  //         },
  //         {
  //           notes: ['8', 'w'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tie: true,
  //         },
  //       ]
  //     case '4:5':
  //       return [
  //         {
  //           notes: new Array(5).fill('4').map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tuplet: true,
  //         },
  //       ]
  //     case '2:7':
  //       return [
  //         {
  //           notes: new Array(7).fill('8').map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tuplet: true,
  //         },
  //       ]
  //     case '5:3':
  //       // TODO: implement ties and tuples across note groups
  //       return []
  //     case '5:4':
  //       return [
  //         {
  //           notes: ['q', '16'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tie: true,
  //         },
  //         {
  //           notes: ['8d', '8'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tie: true,
  //         },
  //         {
  //           notes: ['8', '8d'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tie: true,
  //         },
  //         {
  //           notes: ['16', 'q'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tie: true,
  //         },
  //       ]
  //     case '3:5':
  //       // TODO: hide some of the note heads
  //       return new Array(3).fill({
  //         notes: new Array(5).fill('8').map(duration => ({
  //           duration,
  //         })) as NoteDescription[],
  //         tuplet: true,
  //       })
  //     case '7:4':
  //       return [
  //         {
  //           notes: new Array(4).fill('qdd').map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //         },
  //       ]
  //     case '2:9':
  //       // TODO: check that it works
  //       return [
  //         {
  //           notes: new Array(9).fill('8').map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tuplet: true,
  //         },
  //       ]
  //     case '3:8':
  //       return [
  //         {
  //           notes: new Array(8).fill('16d').map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //         },
  //       ]
  //     case '7:3':
  //       // TODO: ties & tumples across groups
  //       return []
  //     case '3:7':
  //       // TODO: hide some of the note heads
  //       return new Array(3).fill({
  //         notes: new Array(7).fill('8').map(duration => ({
  //           duration,
  //         })) as NoteDescription[],
  //         tuplet: true,
  //       })
  //     case '8:5':
  //       // TODO: ties & tumples across groups
  //       return []
  //     case '8:3':
  //       // TODO: ties & tumples across groups
  //       return []
  //     case '4:9':
  //       return [
  //         {
  //           notes: new Array(9).fill('8').map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //         },
  //       ]
  //     case '6:5':
  //       // TODO: hide some of the note heads
  //       return new Array(6).fill({
  //         notes: new Array(5).fill('8').map(duration => ({
  //           duration,
  //         })) as NoteDescription[],
  //         tuplet: true,
  //       })
  //     case '9:4':
  //       // TODO: hide some of the note heads
  //       return [
  //         {
  //           notes: ['h', '16'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tie: true,
  //         },
  //         {
  //           notes: ['8d', 'q', '8'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tie: true,
  //         },
  //         {
  //           notes: ['8', 'q', '8d'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tie: true,
  //         },
  //         {
  //           notes: ['16', 'h'].map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //           tie: true,
  //         },
  //       ]
  //     case '10:3':
  //       // TODO: ties & tumples across groups
  //       return []
  //     case '4:7':
  //       // TODO: hide some of the note heads
  //       return new Array(4).fill({
  //         notes: new Array(7).fill('8').map(duration => ({
  //           duration,
  //         })) as NoteDescription[],
  //         tuplet: true,
  //       })
  //     case '5:7':
  //       // TODO: hide some of the note heads
  //       return new Array(5).fill({
  //         notes: new Array(7).fill('8').map(duration => ({
  //           duration,
  //         })) as NoteDescription[],
  //         tuplet: true,
  //       })
  //     case '5:6':
  //       // TODO: hide some of the note heads
  //       return new Array(5).fill({
  //         notes: new Array(6).fill('8').map(duration => ({
  //           duration,
  //         })) as NoteDescription[],
  //         tuplet: true,
  //       })
  //     case '3:10':
  //       // TODO: hide some of the note heads
  //       return new Array(3).fill({
  //         notes: new Array(10).fill('8').map(duration => ({
  //           duration,
  //         })) as NoteDescription[],
  //         tuplet: true,
  //       })
  //     case '7:5':
  //       // TODO: hide some of the note heads
  //       return new Array(7).fill({
  //         notes: new Array(5).fill('8').map(duration => ({
  //           duration,
  //         })) as NoteDescription[],
  //         tuplet: true,
  //       })
  //     case '8:7':
  //       return [
  //         {
  //           notes: new Array(7).fill('h').map(duration => ({
  //             duration,
  //           })) as NoteDescription[],
  //         },
  //       ]
  //     case '5:8':
  //       // TODO: hide some of the note heads
  //       return new Array(5).fill({
  //         notes: new Array(8).fill('16').map(duration => ({
  //           duration,
  //         })) as NoteDescription[],
  //       })
  //     case '9:5':
  //       // TODO: hide some of the note heads
  //       return new Array(9).fill({
  //         notes: new Array(5).fill('8').map(duration => ({
  //           duration,
  //         })) as NoteDescription[],
  //       })
  //     case '7:6':
  //       // TODO: hide some of the note heads
  //       return new Array(9).fill({
  //         notes: new Array(5).fill('8').map(duration => ({
  //           duration,
  //         })) as NoteDescription[],
  //       })
  //     default:
  //       return []
  //   }
  // }

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

  private drawStaveAndClef = (staveYs?: number[]) => {
    console.log('RhythmPreview -> drawStaveAndClef')
    const { staveHeight, scale, beats } = this.props
    const linesCount = 2
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

    // this.staves[0].setText('Rhythm', Vex.Flow.Modifier.Position.LEFT)
    // this.staves[1].setText('Subdivision', Vex.Flow.Modifier.Position.LEFT)
    // this.staves[2].setText('Metronome', Vex.Flow.Modifier.Position.LEFT)
    this.staves[0].setText(' Rhythm', Vex.Flow.Modifier.Position.ABOVE, {
      shift_x: 20,
      justification: Vex.Flow.TextNote.Justification.LEFT,
    })
    this.staves[1].setText(' Metronome', Vex.Flow.Modifier.Position.ABOVE, {
      shift_x: 20,
      justification: Vex.Flow.TextNote.Justification.LEFT,
    })

    this.staves.forEach(s => s.draw())

    // @ts-ignore
    const connector = new Vex.Flow.StaveConnector(
      this.staves[0],
      this.staves[1],
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
        ...new Array(this.props.offset)
          .fill(null)
          .map(
            () =>
              new Vex.Flow.StaveNote({ keys: ['B/4'], duration: 'qr', stem_direction: -1 }),
          ),
        new Vex.Flow.BarNote().setType(Vex.Flow.Barline.type.REPEAT_BEGIN),
        ...meterNotes,
        new Vex.Flow.BarNote().setType(Vex.Flow.Barline.type.REPEAT_END),
      ])

    // Configure "Rhythm" stave
    // const rhythmNoteGroupsDescriptions = this.getRhythmNotes()

    // let rhythmTies: Vex.Flow.StaveTie[] = []
    // let rhythmNotes: Vex.Flow.StaveNote[] = []
    // let rhythmTuplets: Vex.Flow.Tuplet[] = []

    // let currentNoteIndex = 0
    // rhythmNoteGroupsDescriptions.forEach(noteGroup => {
    //   const firstNoteIndex = currentNoteIndex
    //   noteGroup.notes.forEach(noteDescription => {
    //     const note = new Vex.Flow.StaveNote({
    //       keys: ['B/4'],
    //       duration: noteDescription.duration,
    //       stem_direction: -1,
    //     })

    //     if (noteDescription.duration.includes('d')) {
    //       note.addDotToAll()
    //     }

    //     rhythmNotes.push(note)
    //     currentNoteIndex += 1
    //   })
    //   const lastNoteIndex = currentNoteIndex - 1

    //   if (noteGroup.tie) {
    //     for (
    //       let noteIndex = firstNoteIndex;
    //       noteIndex < lastNoteIndex;
    //       ++noteIndex
    //     ) {
    //       rhythmTies.push(
    //         new Vex.Flow.StaveTie({
    //           first_note: rhythmNotes[noteIndex],
    //           last_note: rhythmNotes[noteIndex + 1],
    //           first_indices: [0],
    //           last_indices: [0],
    //         }),
    //       )
    //     }
    //   }

    //   if (noteGroup.tuplet) {
    //     rhythmTuplets.push(
    //       new Vex.Flow.Tuplet(
    //         rhythmNotes.slice(firstNoteIndex, lastNoteIndex + 1),
    //         {
    //           // @ts-ignore
    //           ratioed: false,
    //           num_notes: noteGroup.notes.length,
    //         },
    //       ),
    //     )
    //   }
    // })

    // const rhythmVoice = new Vex.Flow.Voice({
    //   num_beats: this.props.beats,
    //   beat_value: 4,
    // })
    //   .setMode(Vex.Flow.Voice.Mode.SOFT)
    //   .addTickables(rhythmNotes)

    // const rhythmBeams = Vex.Flow.Beam.generateBeams(rhythmNotes, {
    //   stem_direction: -1,
    //   // @ts-ignore
    //   secondary_breaks: '4',
    // })

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
        // TODO: hide the note heads
        // @ts-ignore
        note.setKeyStyle(0, {
          fillStyle: 'transparent',
          strokeStyle: 'transparent',
        })
        // note.setStyle({ fillStyle: 'transparent', strokeStyle: 'transparent' })
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
        ...new Array(this.props.offset)
          .fill(null)
          .map(
            () =>
              new Vex.Flow.StaveNote({ keys: ['B/4'], duration: 'qr', stem_direction: -1 }),
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

    // formatter.joinVoices([rhythmVoice])
    formatter.joinVoices([meterVoice])
    formatter.joinVoices([subdivisionVoice])
    // formatter.formatToStave([rhythmVoice], this.staves[0])
    formatter.formatToStave([meterVoice, subdivisionVoice], this.staves[0])

    // rhythmVoice.draw(this.renderContext, this.staves[0])
    // rhythmBeams.forEach(b => b.setContext(this.renderContext).draw())
    // rhythmTuplets.forEach(b => b.setContext(this.renderContext).draw())
    // rhythmTies.forEach(t => {
    //   t.setContext(this.renderContext).draw()
    // })

    subdivisionVoice.draw(this.renderContext, this.staves[0])
    subdivisionBeams.forEach(b => b.setContext(this.renderContext).draw())
    subdivisionTuplets.forEach(b => b.setContext(this.renderContext).draw())

    // subdivisionNotes.forEach(note => {
    //   // @ts-ignore
    //   if (note.__shouldHideNoteHead) {
    //     note.getLineNumber
    //   }
    // })

    meterVoice.draw(this.renderContext, this.staves[1])
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

          &::scrollbar{
            display: none;
          }
          &::-webkit-scrollbar{
            display: none;
          }
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
