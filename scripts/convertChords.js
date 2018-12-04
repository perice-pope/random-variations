const _ = require('lodash')
const tonal = require('tonal')

const getRawData = () => {
  return `Power Chord	5	C G	1 5	DYAD
  Major Triad	maj	C E G	1 3 5	TRIADS
  Augmented Triad	+	C E G#	1 3 #5	TRIADS
  Major (b5) Triad	maj (b5)	C E Gb	1 3 b5	TRIADS
  Suspended 4 Triad	sus	C F G	1 4 5	TRIADS
  Suspended 2 Triad	sus2	C D G	1 2 5	TRIADS
  Minor Triad	-	C Eb G	1 b3 5	TRIADS
  Minor (#5) Triad	- (#5)	C Eb G#	1 b3 #5	TRIADS
  Diminished Triad	°	C Eb Gb	1 b3 b5	TRIADS
  Perfect Perfect Quartal Triad	Q (P4,P4)	C F Bb	1 4 b7	TRIADS
  Perfect Augmented Quartal Triad	Q (P4,A4)	C F B	1 4 7	TRIADS
  Augmented Perfect Quartal Triad	Q (A4,P4)	C F# B	1 #4 7	TRIADS
  Major Triad add 2	maj2	C D E G	1 2 3 5	TRIAD ADD 2
  Augemented Triad add 2	+2	C D E G#	1 2 3 #5	TRIAD ADD 2
  Suspended 4 Triad add 2	sus2/4	C D F G	1 2 4 5	TRIAD ADD 2
  Minor Triad add 2	-2	C D Eb G	1 2 b3 5	TRIAD ADD 2
  Diminished Triad add 2	°2	C D Eb Gb	1 2 b3 b5	TRIAD ADD 2
  Major (b5) Triad add 2	maj2 (b5)	C D E Gb	1 2 3 b5	TRIAD ADD 2
  Major Triad add b2	maj (b2)	C Db E G	1 b2 3 5	TRIAD ADD 2
  Augemented add b2	+ (b2)	C Db E G#	1 b2 3 #5	TRIAD ADD 2
  Suspended 4 Triad add b2	sus (b2)	C Db F G	1 b2 4 5	TRIAD ADD 2
  Minor Triad add b2	- (b2)	C Db Eb G	1 b2 b3 5	TRIAD ADD 2
  Diminished Triad add b2	° (b2)	C Db Eb Gb	1 b2 b3 b5	TRIAD ADD 2
  Major (b5) Triad add b2	maj (b5,b2)	C Db E Gb	1 b2 3 b5	TRIAD ADD 2
  Major Triad add #2	maj (#2)	C D# E G	1 #2 3 5	TRIAD ADD 2
  Augemented Triad add #2	+ (#2)	C D# E G#	1 #2 3 #5	TRIAD ADD 2
  Major (b5) Triad add #2	maj (b5,#2)	C D# E Gb	1 #2 3 b5	TRIAD ADD 2
  Major 6	6	C E G A	1 3 5 6	7th
  Major 7	∆7	C E G B	1 3 5 7	7th
  Major 7 add 6	∆6/7	C E G A B	1 3 5 6 7	7th
  Major 7 #5	∆7(#5)	C E G# B	1 3 #5 7	7th
  Major 7 b5	∆7(b5)	C E Gb B	1 3 b5 7	7th
  Major 7 suspended 4	∆7(sus4)	C F G B	1 4 5 7	7th
  Dominant 7	7	C E G Bb	1 3 5 b7	7th
  Dominant 7 add 6	7/6	C E G A Bb	1 3 5 6 b7	7th
  Dominant 7(#5)	+7 or 7(#5)	C E G# Bb	1 3 #5 b7	7th
  Dominant 7(b5)	7(b5)	C E Gb Bb	1 3 b5 b7	7th
  Dominant 7 (#5,b5)	7 (#5,b5)	C E Gb G# Bb	1 3 b5 #5 b7	7th
  Dominant 7 suspended 4	7sus	C F G Bb	1 4 5 b7	7th
  Minor 6	-6	C Eb G A	1 b3 5 6	7th
  Minor 7	-7	C Eb G Bb	1 b3 5 b7	7th
  Minor 7  add 6	-6/7	C Eb G A Bb	1 b3 5 6 b7	7th
  Minor 7 (#5)	-7 (#5)	C Eb G# Bb	1 b3 #5 b7	7th
  Minor 7 (b5) or Half-Diminished	-7 (b5) or ø7	C Eb Gb Bb	1 b3 b5 b7	7th
  Minor (major7)	- (∆7)	C Eb G B	1 b3 5 7	7th
  Minor  6 (major7)	- 6 (∆7)	C Eb G A B	1 b3 5 6 7	7th
  Minor (major7,#5)	- (∆7,#5)	C Eb G# B	1 b3 #5 7	7th
  Diminished (major7)	° (∆7)	C Eb Gb B	1 b3 b5 7	7th
  Diminished 7	°7	C Eb Gb Bbb	1 b3 b5 bb7	7th
  Diminished  (major7,diminished7)	° (∆7,bb7)	C Eb Gb Bbb B	1 b3 b5 bb7 7	7th
  Quartal up to b10	Q (P4,P4,P4)	C F Bb Eb	1 4 b7 b10	7th
  Major 6 add 9	6/9	C E G A D	1 3 5 6 9	9th
  Major 6 (b9)	6 (b9)	C E G A Db	1 3 5 6 b9	9th
  Major 6 (#9)	6 (#9)	C E G A D#	1 3 5 6 #9	9th
  Major 9	∆9	C E G B D	1 3 5 7 9	9th
  Major 9 (#5)	∆9 (#5)	C E G# B D	1 3 #5 7 9	9th
  Major 9 (b5)	∆9 (b5)	C E Gb B D	1 3 b5 7 9	9th
  Major 7 (b9)	∆7 (b9)	C E G B Db	1 3 5 7 b9	9th
  Major 7 (#9)	∆7 (#9)	C E G B D#	1 3 5 7 #9	9th
  Major 7 (b9,#5)	∆7 (b9,#5)	C E G# B Db	1 3 #5 7 b9	9th
  Major 7 (b5,9)	∆7 (b5,9)	C E Gb B Db	1 3 b5 7 b9	9th
  Major 7 (#9,#5)	∆7 (#9,#5)	C E G# B D#	1 3 #5 7 #9	9th
  Major 7 (#9, b9)	∆7 (#9, b9)	C E Gb B D#	1 3 b5 7 #9	9th
  Dominant 9	9	C E G Bb D	1 3 5 b7 9	9th
  Dominant 9 suspended 4	9sus	C F G Bb D	1 4 5 b7 9	9th
  Dominant 9 (#5)	9 (#5)	C E G# Bb D	1 3 #5 b7 9	9th
  Dominant 9 (b5)	9 (b5)	C E Gb Bb D	1 3 b5 b7 9	9th
  Dominant 9 (#5,b5)	9 (#5,b5)	C E Gb G# Bb D	1 3 b5 #5 b7 9	9th
  Dominant 7 (b9)	7 (b9)	C E G Bb Db	1 3 5 b7 b9	9th
  Dominant 7 suspended 4 (b9)	7sus (b9)	C F G Bb Db	1 4 5 b7 b9	9th
  Dominant 7 (b9,#5)	7 (b9,#5)	C E G# Bb Db	1 3 #5 b7 b9	9th
  Dominant 7 (b9,b5)	7 (b9,b5)	C E Gb Bb Db	1 3 b5 b7 b9	9th
  Dominant 7 (b9,#5,b9)	7 (b9,#5,b9)	C E Gb G# Bb Db	1 3 b5 #5 b7 b9	9th
  Dominant 7 (#9)	7 (#9)	C E G Bb D#	1 3 5 b7 #9	9th
  Dominant 7 (#9,#5)	7 (#9,#5)	C E G# Bb D#	1 3 #5 b7 #9	9th
  Dominant 7 (#9,b5)	7 (#9,b5)	C E Gb Bb D#	1 3 b5 b7 #9	9th
  Dominant 7 (#9,#5,b9)	7 (#9,#5,b9)	C E Gb G# Bb D#	1 3 b5 #5 b7 #9	9th
  Dominant 7 (#9,b9)	7 (#9,b9)	C E G Bb Db D#	1 3 5 b7 b9 #9	9th
  Dominant 7 (#9,b9,#5)	7 (#9,b9,#5)	C E G# Bb Db D#	1 3 #5 b7 b9 #9	9th
  Dominant 7 (#9,b9,b5)	7 (#9,b9,b5)	C E Gb Bb Db D#	1 3 b5 b7 b9 #9	9th
  Dominant 7 (#9,b9,#5,b5) or "Dominant 7 altered"	7 (#9,b9,#5,b5) or "7alt"	C E Gb G# Bb Db D#	1 3 b5 #5 b7 b9 #9	9th
  Minor 6 add 9	-6/9	C Eb G A D	1 b3 5 6 9	9th
  Minor 9 (major7)	-9 (∆7)	C Eb G B D	1 b3 5 7 9	9th
  Minor 6 add 9 (major7)	-6/9 (∆7)	C Eb G A B D	1 b3 5 6 7 9	9th
  Minor 9 (major7,#5)	-9 (∆7,#5)	C Eb G# B D	1 b3 #5 7 9	9th
  Minor 6 (b9)	-6 (b9)	C Eb G A Db	1 b3 5 6 b9	9th
  Minor  (b9,major7)	- (b9,∆7)	C Eb G B Db	1 b3 5 7 b9	9th
  Minor (b9,major7,#5)	- (b9,∆7,#5)	C Eb G# B Db	1 b3 #5 7 b9	9th
  Minor 9	-9	C Eb G Bb D	1 b3 5 b7 9	9th
  Minor 9 (#5) or "church"	-9 (#5) or "church"	C Eb G# Bb D	1 b3 #5 b7 9	9th
  Minor 9 (b5)	-9 (b5)	C Eb Gb Bb D	1 b3 b5 b7 9	9th
  Minor 7 (b9)	-7 (b9)	C Eb G Bb Db	1 b3 5 b7 b9	9th
  Minor 7 (b9,#5)	-7 (b9,#5)	C Eb G# Bb Db	1 b3 #5 b7 b9	9th
  Minor 7 (b9,b5)	-7 (b9,b5)	C Eb Gb Bb Db	1 b3 b5 b7 b9	9th
  Diminished 9	°9	C Eb Gb Bbb D	1 b3 b5 bb7 9	9th
  Diminished 9 (major7,diminished7)	°9 (∆7,bb7)	C Eb Gb Bbb B D	1 b3 b5 bb7 7 9	9th
  Diminished 9 (major7)	°9 (∆7)	C Eb Gb B D	1 3 b5 7 9	9th
  Diminished 7 (b9)	°7 (b9)	C Eb Gb Bbb Db	1 b3 b5 bb7 b9	9th
  Diminished (b9,major7)	° (b9,∆7)	C Eb Gb B Db	1 3 b5 7 b9	9th
  Diminished  (b9,major7,diminished7)	° (b9,∆7,bb7)	C Eb Gb Bbb B Db	1 3 b5 bb7 7 b9	9th
  Major 9 (#11)	∆9 (#11)	C E G B D F#	1 3 5 7 9 #11	11th
  Major 9 (#11,#5)	∆9 (#11,#5)	C E G# B D F#	1 3 #5 7 9 #11	11th
  Major 7 (#11,b9)	∆7 (#11,b9)	C E G B Db F#	1 3 5 7 b9 #11	11th
  Major 7 (#11,#9)	∆7 (#11,#9)	C E G B D# F#	1 3 5 7 #9 #11	11th
  Major 7 (#11,#9,b9)	∆7 (#11,#9,b9)	C E G B Db D# F#	1 3 5 7 b9 #9 #11	11th
  Major 7 (#11,b9,#5)	∆7 (#11,b9,#5)	C E G# B Db F#	1 3 #5 7 b9 #11	11th
  Major 7 (#11,#9,#5)	∆7 (#11,#9,#5)	C E G# B D# F#	1 3 #5 7 #9 #11	11th
  Major 7 (#11,#9,b9,#5)	∆7 (#11,#9,b9,#5)	C E G# B Db D# F#	1 3 #5 7 b9 #9 #11	11th
  Dominant 11	11	C E G Bb D F	1 3 5 b7 9 11	11th
  Dominant 11 (#5)	11 (#5)	C E G# Bb D F	1 3 #5 b7 9 11	11th
  Dominant 11 (b5)	11 (b5)	C E Gb Bb D F	1 3 b5 b7 9 11	11th
  Dominant 11 (#5,b5)	11 (#5,b5)	C E Gb G# Bb D F	1 3 b5 #5 b7 9 11	11th
  Dominant 11 (b9)	11 (b9)	C E G Bb Db F	1 3 5 b7 b9 11	11th
  Dominant 11 (#9)	11 (#9)	C E G Bb D# F	1 3 5 b7 #9 11	11th
  Dominant 11 (#9,b9)	11 (#9,b9)	C E G Bb Db D# F	1 3 5 b7 b9 #9 11	11th
  Dominant 11 (b9,b5)	11 (b9,b5)	C E Gb Bb Db F	1 3 b5 b7 b9 11	11th
  Dominant 11 (b9.#5)	11 (b9.#5)	C E G# Bb Db F	1 3 #5 b7 b9 11	11th
  Dominant 11 (#9,b5)	11 (#9,b5)	C E Gb Bb D# F	1 3 b5 b7 #9 11	11th
  Dominant 11 (#9,#5)	11 (#9,#5)	C E G# Bb D# F	1 3 #5 b7 #9 11	11th
  Dominant 11 (#9,b9,b5)	11 (#9,b9,b5)	C E Gb Bb Db D# F	1 3 b5 b7 b9 #9 11	11th
  Dominant 11 (#9,b9,#5)	11 (#9,b9,#5)	C E G# Bb Db D# F	1 3 #5 b7 b9 #9 11	11th
  Dominant 9 (#11)	9 (#11)	C E G Bb D F#	1 3 5 b7 9 #11	11th
  Dominant 9 (#11,#5)	9 (#11,#5)	C E G# Bb D F#	1 3 #5 b7 9 #11	11th
  Dominant 7 (#11,b9)	7 (#11,b9)	C E G Bb Db F#	1 3 5 b7 b9 #11	11th
  Dominant 7 (#11,#9)	7 (#11,#9)	C E G Bb D# F#	1 3 5 b7 #9 #11	11th
  Dominant 7 (#11,#9,b9)	7 (#11,#9,b9)	C E G Bb Db D# F#	1 3 5 b7 b9 #9 #11	11th
  Dominant 7 (#11,b9,#5)	7 (#11,b9,#5)	C E G# Bb Db F#	1 3 #5 b7 b9 #11	11th
  Dominant 7 (#11,#9,#5)	7 (#11,#9,#5)	C E G# Bb D# F#	1 3 #5 b7 #9 #11	11th
  Dominant 7 (#11,#9,b9,#5)	7 (#11,#9,b9,#5)	C E G# Bb Db D# F#	1 3 #5 b7 b9 #9 #11	11th
  Minor 11 (major7)	-11 (∆7)	C Eb G B D F	1 b3 5 7 9 11	11th
  Minor 11 (major7,#5)	-11 (∆7,#5)	C Eb G# B D F	1 b3 #5 7 9 11	11th
  Minor 11 (b9,major7)	-11 (b9,∆7)	C Eb G B Db F	1 b3 5 7 b9 11	11th
  Minor 11 (b9,major7,#5)	-11 (b9,∆7,#5)	C Eb G# B Db F	1 b3 #5 7 b9 11	11th
  Minor 9 (#11,major7)	-9 (#11,∆7)	C Eb G B D F#	1 b3 5 7 9 #11	11th
  Minor 9 (#11,major7,#5)	-9 (#11,∆7,#5)	C Eb G# B D F#	1 b3 #5 7 9 #11	11th
  Minor  (#11,b9,major7)	- (#11,b9,∆7)	C Eb G B Db F#	1 b3 5 7 b9 #11	11th
  Minor  (#11,b9,#5)	- (#11,b9,#5)	C Eb G# B Db F#	1 b3 #5 7 b9 #11	11th
  Minor 11	-11	C Eb G Bb D F	1 b3 5 b7 9 11	11th
  Minor 11 (#5)	-11 (#5)	C Eb G# Bb D F	1 b3 #5 b7 9 11	11th
  Minor 11 (b5)	-11 (b5)	C Eb Gb Bb D F	1 b3 b5 b7 9 11	11th
  Minor 11 (b9)	-11 (b9)	C Eb G Bb Db F	1 b3 5 b7 b9 11	11th
  Minor 11 (b9,b5)	-11 (b9,b5)	C Eb Gb Bb Db F	1 b3 b5 b7 b9 11	11th
  Minor 11 (b9,#5)	-11 (b9,#5)	C Eb G# Bb Db F	1 b3 #5 b7 b9 11	11th
  Minor 9 (#11)	-9 (#11)	C Eb G Bb D F#	1 b3 5 b7 9 #11	11th
  Minor 9 (#11,#5)	-9 (#11,#5)	C Eb G# Bb D F#	1 b3 #5 b7 9 #11	11th
  Minor 7 (#11,b9)	-7 (#11,b9)	C Eb G Bb Db F#	1 b3 5 b7 b9 #11	11th
  Minor 7 (#11,b9,#5)	-7 (#11,b9,#5)	C Eb G# Bb Db F#	1 b3 #5 b7 b9 #11	11th
  Diminished 11	°11	C Eb Gb Bbb D F	1 b3 b5 bb7 9 11	11th
  Diminished 11 (major7)	°11 (∆7)	C Eb Gb B D F	1 b3 b5 7 9 11	11th
  Diminished 11 (b9,major7)	°11 (b9,∆7)	C Eb Gb B Db F	1 b3 b5 7 b9 11	11th
  Diminished 11 (major7,diminished7)	°11 (∆7,bb7)	C Eb Gb Bbb B D F	1 b3 b5 bb7 7 9 11	11th
  Diminished 11 (b9)	°11 (b9)	C Eb Gb Bbb Db F	1 b3 b5 bb7 b9 11	
  Diminished 11 (b9,major7,diminished7)	°11 (b9,∆7,bb7)	C Eb Gb Bbb B Db F	1 b3 b5 bb7 7 b9 11	
  Major 13	∆13	C E G B D A	1 3 5 7 9 13	13th
  Major 13 (b9)	∆13 (b9)	C E G B Db A	1 3 5 7 b9 13	13th
  Major 13 (#9)	∆13 (#9)	C E G B D# A	1 3 5 7 #9 13	13th
  Major 13 (#9,b9)	∆13 (#9,b9)	C E G B Db D# A	1 3 5 7 b9 #9 13	13th
  Major 13 (#11)	∆13 (#11)	C E G B D F# A	1 3 5 7 9 #11 13	13th
  Major 13 (#11,b9)	∆13 (#11,b9)	C E G B Db F# A	1 3 5 7 b9 #11 13	13th
  Major 13 (#11,#9)	∆13 (#11,#9)	C E G B D# F# A	1 3 5 7 #9 #11 13	13th
  Major 13 (#11,#9,b9)	∆13 (#11,#9,b9)	C E G B Db D# F# A	1 3 5 7 b9 #9 #11 13	13th
  Major 9 (b13)	∆9 (b13)	C E G B D Ab	1 3 5 7 9 b13	13th
  Major 7 (b13,b9)	∆7 (b13,b9)	C E G B Db Ab	1 3 5 7 b9 b13	13th
  Major 11 (b13,b9)	∆11 (b13,b9)	C E G B Db F Ab		
  Major 7 (b13,#9)	∆7 (b13,#9)	C E G B D# Ab	1 3 5 7 #9 b13	13th
  Major 7 (b13,#9,b9)	∆7 (b13,#9,b9)	C E G B Db D# Ab	1 3 5 7 b9 #9 b13	13th
  Major 9 (b13,#11)	∆9 (b13,#11)	C E G B D F# Ab	1 3 5 7 9 #11 b13	13th
  Major 7 (b13,#11,b9)	∆7 (b13,#11,b9)	C E G B Db F# Ab	1 3 5 7 b9 #11 13	13th
  Major 7 (b13,#11,#9)	∆7 (b13,#11,#9)	C E G B D# F# Ab	1 3 5 7 #9 #11 13	13th
  Major 7 (b13,#11,#9,b9)	∆7 (b13,#11,#9,b9)	C E G B Db D# F# Ab	1 3 5 7 b9 #9 #11 13	13th
  Dominant 13	13	C E G Bb D F A	1 3 5 b7 9 13	13th
  Dominant 13 (b9)	13 (b9)	C E G Bb Db F A	1 3 5 b7 b9 13	13th
  Dominant 13 (#9)	13 (#9)	C E G Bb D# F A	1 3 5 b7 #9 13	13th
  Dominant 13 (#9,b9)	13 (#9,b9)	C E G Bb Db D# F A	1 3 5 b7 b9 #9 13	13th
  Dominant 13 (#11)	13 (#11)	C E G Bb D F# A	1 3 5 b7 9 #11 13	13th
  Dominant 13 (#11,b9)	13 (#11,b9)	C E G Bb Db F# A	1 3 5 b7 b9 #11 13	13th
  Dominant 13 (#11,#9)	13 (#11,#9)	C E G Bb D# F# A	1 3 5 b7 #9 #11 13	13th
  Dominant 13 (#11,#9,b9)	13 (#11,#9,b9)	C E G Bb Db D# F# A	1 3 5 b7 b9 #9 #11 13	13th
  Dominant 13 suspended 4	13sus	C F G Bb D A	1 4 5 b7 9 13	13th
  Dominant 13 suspended 4 (b9)	13sus (b9)	C E F Bb Db A	1 4 5 b7 b9 13	13th
  Dominant 9 (b13)	9 (b13)	C E G Bb D F Ab	1 3 5 b7 9 (11) b13	13th
  Dominant 9 (b13,b5)	9 (b13,b5)	C E Gb Bb D F Ab	1 3 b5 b7 9 (11) b13	13th
  Dominant 7 (b13,b9)	7 (b13,b9)	C E G Bb Db F Ab	1 3 5 b7 b9 (11) b13	13th
  Dominant 7 (b13,#9)	7 (b13,#9)	C E G Bb D# F Ab	1 3 5 b7 #9 (11) b13	13th
  Dominant 7 (b13,#9,b9)	7 (b13,#9,b9)	C E G Bb Db D# F Ab	1 3 5 b7 b9 #9 (11) b13	13th
  Dominant 7 (b13,b9,b5)	7 (b13,b9,b5)	C E Gb Bb Db F Ab	1 3 b5 b7 b9 (11) b13	13th
  Dominant 7 (b13,#9,b5)	7 (b13,#9,b5)	C E Gb Bb D# F Ab	1 3 b5 b7 #9 (11) b13	13th
  Dominant 7 (b13,#9,b9,b5)	7 (b13,#9,b9,b5)	C E Gb Bb Db D# F Ab	1 3 b5 b7 b9 #9 (11) b13	13th
  Dominant 9 (b13,#11)	9 (b13,#11)	C E G Bb D F# Ab	1 3 5 b7 9 #11 b13	13th
  Dominant 7 (b13,#11,b9)	7 (b13,#11,b9)	C E G Bb Db F# Ab	1 3 5 b7 b9 #11 b13	13th
  Dominant 7 (b13,#11,#9)	7 (b13,#11,#9)	C E G Bb D# F# Ab	1 3 5 b7 #9 #11 b13	13th
  Dominant 7 (b13,#11,#9,b9)	7 (b13,#11,#9,b9)	C E G Bb Db D# F# Ab	1 3 5 b7 b9 #9 #11 b13	13th
  Minor 13 (major7)	-13 (∆7)	C Eb G B D F A	1 b3 5 7 9 11 13	13th
  Minor 13 (major7,b5)	-13 (∆7,b5)	C Eb Gb B D F A	1 b3 b5 7 9 11 13	13th
  Minor 13 (b9,major7)	-13 (b9,∆7)	C Eb G B Db F A	1 b3 5 7 b9 11 13	13th
  Minor 13 (b9,major7,b5)	-13 (b9,∆7,b5)	C Eb Gb B Db F A	1 b3 b5 7 b9 11 13	13th
  Minor 13 (#11,major7)	-13 (#11,∆7)	C Eb G B D F# A	1 b3 5 7 9 #11 13	13th
  Minor 13 (#11,b9,major7)	-13 (#11,b9,∆7)	C Eb G B Db F# A	1 b3 5 7 b9 #11 13	13th
  Minor 13	-13	C Eb G Bb D F A	1 b3 5 b7 9 11 13	13th
  Minor 13 (b5)	-13 (b5)	C Eb Gb Bb D F A	1 b3 b5 b7 9 11 13	13th
  Minor 13 (b9)	-13 (b9)	C Eb G Bb Db F A	1 b3 5 b7 b9 11 13	13th
  Minor 13 (b9,b5)	-13 (b9,b5)	C Eb Gb Bb Db F A	1 b3 b5 b7 b9 11 13	13th
  Minor 13 (#11)	-13 (#11)	C Eb G Bb D F# A	1 b3 5 b7 9 #11 13	13th
  Minor 13 (#11,b9)	-13 (#11,b9)	C Eb G Bb Db F# A	1 b3 5 b7 b9 #11 13	13th
  Minor 11 (b13,major7)	-11 (b13,∆7)	C Eb G B D F Ab	1 b3 5 7 9 11 b13	13th
  Minor 11 (b13,b9,major7)	-11 (b13,b9,∆7)	C Eb G B Db F Ab	1 b3 5 7 b9 11 b13	13th
  Minor 11 (b13,b9,b5)	-11 (b13,b9,b5)	C Eb Gb B Db F Ab	1 b3 b5 7 b9 11 b13	13th
  Minor 9 (b13,#11,major7)	-9 (b13,#11,∆7)	C Eb G B D F# Ab	1 b3 5 7 9 #11 b13	13th
  Minor  (b13,#11,b9,major7)	- (b13,#11,b9,∆7)	C Eb G B Db F# Ab	1 b3 5 7 b9 #11 b13	13th
  Minor 11 (b13)	-11 (b13)	C Eb G Bb D F Ab	1 b3 5 b7 9 11 b13	13th
  Minor 11 (b13,b5)	-11 (b13,b5)	C Eb Gb Bb D F Ab	1 b3 b5 b7 9 11 b13	13th
  Minor 11 (b13,b9)	-11 (b13,b9)	C Eb G Bb Db F Ab	1 b3 5 b7 b9 11 b13	13th
  Minor 11 (b13,b9,b5)	-11 (b13,b9,b5)	C Eb Gb Bb Db F Ab	1 b3 b5 b7 b9 11 b13	13th
  Minor 9 (b13,#11)	-9 (b13,#11)	C Eb G Bb D F# Ab	1 b3 5 b7 9 #11 b13	13th
  Minor  (b13,#11,b9)	- (b13,#11,b9)	C Eb G Bb Db F# Ab	1 b3 5 b7 b9 #11 b13	13th
  Diminished 11 (b13)	°11 (b13)	C Eb Gb Bbb D F Ab	1 b3 b5 bb7 9 11 b13	13th
  Diminished 11 (b13,b9)	°11 (b13,b9)	C Eb Gb Bbb Db F Ab	1 b3 b5 bb7 b9 11 b13	13th
  Diminished 11 (b13,major7,bb7)	°11 (b13,∆7,bb7)	C Eb Gb Bbb B D F Ab	1 b3 b5 bb7 7 9 11 b13	13th
  Diminished 11 (b13,major7)	°11 (b13,∆7)	C Eb Gb B D F Ab	1 b3 b5 7 9 11 b13	13th
  Diminished 11 (b13,b9,major7)	°11 (b13,b9,∆7)	C Eb Gb B Db F Ab	1 b3 b5 7 b9 11 b13	13th
  Diminished 11 (b13,major7,bb7)	°11 (b13,∆7,bb7)	C Eb Gb Bbb B D F Ab	1 b3 b5 bb7 7 9 11 b13	13th
  Diminished 11 (b13,b9,major7,bb7)	°11 (b13,b9,∆7,bb7)	C Eb Gb Bbb B Db F Ab	1 b3 b5 bb7 7 b9 11 b13	13th
  `
}

const td = require('tonal-distance')

const getSemitones = str => {
  const notes = str
    .split(' ')
    .map(n => n.trim())
    .filter(x => x)

  let semitones = []
  let prev = null
  notes.map(n => td.semitones('C', n)).forEach(cur => {
    if (prev != null && cur < prev) {
      semitones.push(cur + 12)
    } else {
      semitones.push(cur)
    }
    prev = cur
  })

  return semitones
}

const getIntervals = str => {
  const notes = str
    .split(' ')
    .map(n => n.trim())
    .filter(x => x)

  let intervals = []
  let prevSemitiones = null
  let octave = 1
  const baseNote = `C${octave}`
  notes.forEach(curNote => {
    let curNoteWithOctave = `${curNote}${octave}`
    let curSemitones = td.semitones(baseNote, curNoteWithOctave)
    if (prevSemitiones != null && curSemitones < prevSemitiones) {
      octave += 1
      curNoteWithOctave = `${curNote}${octave}`
      curSemitones = td.semitones(baseNote, curNoteWithOctave)
    }
    const interval = tonal.Distance.interval(baseNote, curNoteWithOctave)
    intervals.push(interval)
    prevSemitiones = curSemitones

    // console.log(baseNote, curNoteWithOctave, curSemitones, interval)
  })

  return intervals
}

const getData = () => {
  const raw = getRawData()
  return raw
    .split('\n')
    .map(row => {
      const [name, symbol, notes, , category] = row
        .split('\t')
        .map(s => s.trim())
      if (!name || !notes) {
        return null
      }
      return {
        name: _.lowerCase(name),
        symbol,
        notes,
        semitones: getSemitones(notes),
        intervals: getIntervals(notes),
        category: _.lowerCase(category),
      }
    })
    .filter(x => x)
}

const data = getData()
console.log(JSON.stringify(data, null, 2))
// console.log(JSON.stringify([data[0], data[10], data[54]], null, 2))
