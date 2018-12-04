const _ = require('lodash')

const getRawData = () => {
  return `IONIAN	C D E F G A B C	Major - mode 1
  DORIAN	C D Eb F G A Bb C	Major - mode 2
  PHRYGIAN	C Db Eb F G Ab Bb C	Major - mode 3
  LYDIAN	C D E F# G A B C	Major - mode 4
  MIXOLYDIAN	C D E F G A Bb C	Major - mode 5
  AEOLIAN, NATURAL MINOR	C D Eb F G Ab Bb C	Major - mode 6
  LOCRIAN	C Db Eb F Gb Ab Bb C	Major - mode 7
  HARMONIC MAJOR	C D E F G Ab B C	Harmonic Major - mode 1
  DORIAN b5, ZANGULA	C D Eb F Gb A Bb C	Harmonic Major - mode 2
  PHRYGIAN b4	C Db Eb Fb G Ab Bb C	Harmonic Major - mode 3
  LYDIAN b3	C D Eb F# G A B C	Harmonic Major - mode 4
  MIXOLYDIAN b2	C Db E F G A Bb C	Harmonic Major - mode 5
  LYDIAN #2 #5	C D# E F# G# A B C	Harmonic Major - mode 6
  LOCRIAN b7	C Db Eb F Gb Ab Bbb C	Harmonic Major - mode 7
  MELODIC MINOR	C D Eb F G A B C	Melodic Minor - mode 1
  DORIAN b2	C Db Eb F G A Bb C	Melodic Minor - mode 2
  LYDIAN AUGMENTED	C D E F# G# A B C	Melodic Minor - mode 3
  LYDIAN DOMINANT	C D E F# G A Bb C	Melodic Minor - mode 4
  MIXOLYDIAN b6, HINDU	C D E F G Ab Bb C	Melodic Minor - mode 5
  LOCRIAN #2	C D Eb F Gb Ab Bb C	Melodic Minor - mode 6
  SUPER LOCRIAN, ALTERED SCALE	C Db Eb Fb Gb Ab Bb C	Melodic Minor - mode 7
  HARMONIC MINOR	C D Eb F G Ab B C	Harmonic Minor - mode 1
  LOCRIAN #6, HIJAZI	C Db Eb F Gb A Bb C	Harmonic Minor - mode 2
  IONIAN #5	C D E F G# A B C	Harmonic Minor - mode 3
  DORIAN #4, UKRAINIAN, HUNGARIAN	C D Eb F# G A Bb C	Harmonic Minor - mode 4
  PHRYGIAN #3, PHYRGIAN DOMINANT, SPANISH GYPSY, HEBREW	C Db E F G Ab Bb C	Harmonic Minor - mode 5
  LYDIAN #2, MAQAM MUSTAR	C D# E F# G A B C	Harmonic Minor - mode 6
  LOCRIAN b4 b7	C Db Eb Fb Gb Ab Bbb C	Harmonic Minor - mode 7
  DOUBLE HARMONIC, BYZANTINE, PERSIAN	C Db E F G Ab B C	Double Harmonic - mode 1
  YUSEF SYNTHETIC 2	C D# E F# G A# B C	Double Harmonic - mode 2
  DOUBLE HARMONIC - mode 3	C Db Eb Fb G Ab Abb C	Double Harmonic - mode 3
  LYDIAN b3 b6, HUNGARIAN GYPSY, EGYPTIAN	C D Eb F# G Ab B C	Double Harmonic - mode 4
  DOUBLE HARMONIC - mode 5	C Db E F Gb A Bb C	Double Harmonic - mode 5
  DOUBLE HARMONIC - mode 6	C D# E F G# A B C	Double Harmonic - mode 6
  DOUBLE HARMONIC - mode 7	C Db Ebb F Gb Ab Bbb C	Double Harmonic - mode 7
  CHROMATIC	C C# D D# E F F# G G# A A# B C	
  CHINESE TWELVE TONE SCALE	C G D A E B F# C# Ab Eb Bb F C	
  ALGERIAN	C D Eb F F# G Ab B C	Alerigan - mode 1
  ALGERIAN - mode 2	C Db Eb E F Gb A Bb C	Alerigan - mode 2
  ALGERIAN - mode 3	C D Eb E F G# A B C	Alerigan - mode 3
  ALGERIAN - mode 4	C C# D Eb F# G A Bb C	Alerigan - mode 4
  ALGERIAN - mode 5	C C# D F F# G# A B C	Alerigan - mode 5
  ALGERIAN - mode 6	C C# E F G Ab Bb B C	Alerigan - mode 6
  ALGERIAN - mode 7	C D# E F# G A Bb B C	Alerigan - mode 7
  ALGERIAN - mode 8	C Db Eb Fb Gb G Ab A C	Alerigan - mode 8
  ASYMMETRICALLY EXPANDED IONIAN SCALE	C D E F# G# A Bb B C	Asymmetrically Expanded Ionian Scale - mode 1
  ASYMMETRICALLY EXPANDED IONIAN SCALE - mode 2	C D E F# G G# A Bb C	Asymmetrically Expanded Ionian Scale - mode 2
  ASYMMETRICALLY EXPANDED IONIAN SCALE - mode 3	C D E F F# G Ab Bb C	Asymmetrically Expanded Ionian Scale - mode 3
  ASYMMETRICALLY EXPANDED IONIAN SCALE - mode 4	C D Eb E F F# Ab Bb C	Asymmetrically Expanded Ionian Scale - mode 4
  ASYMMETRICALLY EXPANDED IONIAN SCALE - mode 5	C C# D Eb E F# G# Bb C	Asymmetrically Expanded Ionian Scale - mode 5
  ASYMMETRICALLY EXPANDED IONIAN SCALE - mode 6	C C# D Eb F G A B C	Asymmetrically Expanded Ionian Scale - mode 6
  ASYMMETRICALLY EXPANDED IONIAN SCALE - mode 7	C C# D E F# G# Bb B C	Asymmetrically Expanded Ionian Scale - mode 7
  ASYMMETRICALLY EXPANDED IONIAN SCALE - mode 8	C Db Eb F G A Bb B C	Asymmetrically Expanded Ionian Scale - mode 8
  BUZURG	C Db E F F# G Ab B C	Buzurg - mode 1
  BUZURG - mode 2	C D# E F F# G A# B C	Buzurg - mode 2
  BUZURG - mode 3	C Db D Eb Fb G Ab A C	Buzurg - mode 3
  YUSEF SYNTHETIC 7	C C# D Eb F# G Ab B C	Buzurg - mode 4
  BUZURG - mode 5	C C# D F F# G A# B C	Buzurg - mode 5
  BUZURG - mode 6	C Db E F Gb A Bb B C	Buzurg - mode 6
  BUZURG - mode 7	C D# E F G# A A# B C	Buzurg - mode 7
  BUZURG - mode 8	C C# E F F# G G# A C	Buzurg - mode 8
  EIGHT TONE SPANISH	C Db Eb E F Gb Ab Bb C	Eight Tone Spanish - mode 1
  EIGHT TONE SPANISH - mode 2	C D Eb E F G A B C	Eight Tone Spanish - mode 2
  EIGHT TONE SPANISH - mode 3	C C# D Eb F G A Bb C	Eight Tone Spanish - mode 3
  EIGHT TONE SPANISH - mode 4	C C# D E F# G# A B C	Eight Tone Spanish - mode 4
  BEBOP PHRYGIAN	C Db Eb F G Ab Bb B C	Eight Tone Spanish - mode 5
  BEBOP LYDIAN DOMINANT	C D E F# G A Bb B C	Eight Tone Spanish - mode 6
  EIGHT TONE SPANISH - mode 7	C D E F G Ab A Bb C	Eight Tone Spanish - mode 7
  EIGHT TONE SPANISH - mode 8	C D Eb F Gb G Ab Bb C	Eight Tone Spanish - mode 8
  BEBOP MAJOR	C D E F G G# A B C	Bebop Major - mode 1
  BEBOP MAJOR - mode 2	C D Eb F F# G A Bb C	Bebop Major - mode 2
  BEBOP MAJOR - mode 3	C Db Eb E F G Ab Bb C	Bebop Major - mode 3
  BEBOP MAJOR - mode 4	C D D# E F# G A B C	Bebop Major - mode 4
  BEBOP MAJOR - mode 5	C C# D E F G A Bb C	Bebop Major - mode 5
  BEBOP MAJOR - mode 6	C C# D# E F# G# A B C	Bebop Major - mode 6
  BEBOP NATURAL MINOR, ISFAHAN 2	C D Eb F G Ab Bb B C	Bebop Major - mode 7
  BEBOP MAJOR - mode 8	C Db Eb F Gb Ab A Bb C	Bebop Major - mode 8
  BEBOP DOMINANT	C D E F G A Bb B C	Bebop Dominant - mode 1
  BEBOP DOMINANT - mode 2	C D Eb F G Ab A Bb C	Bebop Dominant - mode 2
  BEBOP DOMINANT - mode 3	C Db Eb F Gb G Ab Bb C	Bebop Dominant - mode 3
  BEBOP DOMINANT - mode 4	C D E F F# G A B C	Bebop Dominant - mode 4
  BEBOP DOMINANT - mode 5	C D Eb E F G A Bb C	Bebop Dominant - mode 5
  BEBOP DOMINANT - mode 6	C Db D Eb F G Ab Bb C	Bebop Dominant - mode 6
  BEBOP DOMINANT - mode 7	C C# D E F# G A B C	Bebop Dominant - mode 7
  BEBOP LOCRIAN, IRAQ	C Db Eb F Gb Ab Bb B C	Bebop Dominant - mode 8
  BEBOP DORIAN - ISFAHAN 1	C D Eb F G A Bb B C	Bebop Dorian - mode 1
  BEBOP DORIAN - mode 2	C Db Eb F G Ab A Bb C	Bebop Dorian - mode 2
  BEBOP LYDIAN	C D E F# G G# A B C	Bebop Dorian - mode 3
  BEBOP DORIAN - mode 4	C D E F F# G A Bb C	Bebop Dorian - mode 4
  BEBOP DORIAN - mode 5	C D Eb E F G Ab Bb C	Bebop Dorian - mode 5
  BEBOP DORIAN - mode 6	C Db D Eb F Gb Ab Bb C	Bebop Dorian - mode 6
  BEBOP DORIAN - mode 7	C C# D E F G A B C	Bebop Dorian - mode 7
  BEBOP ALTERED	C C# D# E F# G# A# B C	Bebop Dorian - mode 8
  BEBOP MELODIC MINOR	C D Eb F G G# A B C	Bebop Melodic Minor - mode 1
  BEBOP MELODIC MINOR - mode 2	C Db Eb F F# G A Bb C	Bebop Melodic Minor - mode 2
  BEBOP MELODIC MINOR - mode 3	C D E F F# G# A B C	Bebop Melodic Minor - mode 3
  BEBOP MELODIC MINOR - mode 4	C D D# E F# G A Bb C	Bebop Melodic Minor - mode 4
  BEBOP MELODIC MINOR - mode 5	C C# D E F G Ab Bb C	Bebop Melodic Minor - mode 5
  BEBOP MELODIC MINOR - mode 6	C C# D# E F# G A B C	Bebop Melodic Minor - mode 6
  BEBOP HALF DIMINISHED	C D Eb F Gb Ab Bb B C	Bebop Melodic Minor - mode 7
  BEBOP MELODIC MINOR - mode 8	C C# D# E F# G# A Bb C	Bebop Melodic Minor - mode 8
  HUNGARIAN BLUE SCALE	C D Eb F F# G# A C	Hungarian Blue Scale - mode 1
  HUNGARIAN BLUE SCALE - mode 2	C C# D# E F# G Bb C	Hungarian Blue Scale - mode 2
  HUNGARIAN BLUE SCALE - mode 3	C D Eb F F# A Bb C	Hungarian Blue Scale - mode 3
  HUNGARIAN BLUE SCALE - mode 4	C C# D# E G A Bb C	Hungarian Blue Scale - mode 4
  HUNGARIAN BLUE SCALE - mode 5	C D Eb F# G# A B C	Hungarian Blue Scale - mode 5
  HUNGARIAN BLUE SCALE - mode 6	C C# E F# G A Bb C	Hungarian Blue Scale - mode 6
  HUNGARIAN BLUE SCALE - mode 7	C Eb F F# G# A B C	Hungarian Blue Scale - mode 7
  ZIRAFKAND, LOCRIAN HARMONIC	C Db Eb F Gb Ab B C	Zirafkand - mode 1
  ZIRAFKAND - mode 2	C D E F G A# B C	Zirafkand - mode 2
  ZIRAFKAND - mode 3	C D Eb F G# A Bb C	Zirafkand - mode 3
  ZIRAFKAND - mode 4	C Db Eb F# G Ab Bb C	Zirafkand - mode 4
  ZIRAFKAND - mode 5	C D F F# G A B C	Zirafkand - mode 5
  ZIRAFKAND - mode 6	C D# E F G A Bb C	Zirafkand - mode 6
  ZIRAFKAND - mode 7	C C# D E F# G A C	Zirafkand - mode 7
  WHOLE TONE BEBOP, LEADING WHOLE TONE	C D E F# G# A# B C	Leading Whole Tone - mode 1
  WHOLE TONE BEBOP - mode 2	C D E F# G# A Bb C	Leading Whole Tone - mode 2
  LYDIAN MINOR	C D E F# G Ab Bb C	Leading Whole Tone - mode 3
  MAJOR LOCRIAN, ARABIC	C D E F Gb Ab Bb C	Leading Whole Tone - mode 4
  WHOLE TONE BEBOP - mode 5	C D Eb Fb Gb Ab Bb C	Leading Whole Tone - mode 5
  WHOLE TONE BEBOP - mode 6	C C# D E F# Ab Bb C	Leading Whole Tone - mode 6
  NEAPOLITAN MAJOR	C Db Eb F G A B C	Leading Whole Tone - mode 7
  NEAPOLITAN MINOR, HARMONIC PHRYGIAN	C Db Eb F G Ab B C	Harmonic Phyrgian - mode 1
  HARMONIC PHRYGIAN - mode 2	C D E F# G A# B C	Harmonic Phyrgian - mode 2
  YUSEF SYNTHETIC 4	C D E F G# A Bb C	Harmonic Phyrgian - mode 3
  HARMONIC PHRYGIAN - mode 4	C D Eb F# G Ab Bb C	Harmonic Phyrgian - mode 4
  RAHAWI	C Db E F Gb Ab Bb C	Harmonic Phyrgian - mode 5
  HARMONIC PHRYGIAN - mode 6	C D# E F G A B C	Harmonic Phyrgian - mode 6
  HARMONIC PHRYGIAN - mode 7	C C# D E F# G# A C	Harmonic Phyrgian - mode 7
  LYDIAN HARMONIC	C D E F# G Ab B C	Lydian Harmonic - mode 1
  DOMINANT b5	C D E F Gb A Bb C	Lydian Harmonic - mode 2
  AEOLIAN DIMINISHED 4	C D Eb Fb G Ab Bb C	Lydian Harmonic - mode 3
  LOCRIAN b3	C C# D F Gb Ab Bb	Lydian Harmonic - mode 4
  MAJOR b2	C Db E F G A B C	Lydian Harmonic - mode 5
  LYDIAN #2 #5 #6	C D# E F# G# A# B C	Lydian Harmonic - mode 6
  PHRYGIAN b7	C Db Eb F G Ab A C	Lydian Harmonic - mode 7
  NOH	C D F G G# A B C	Noh - mode 1
  NOH - mode 2	C Eb F F# G A Bb C	Noh - mode 2
  NOH - mode 3	C D D# E F# G A C	Noh - mode 3
  NOH - mode 4	C C# D E F G Bb C	Noh - mode 4
  NOH - mode 5	C C# D# E F# A B C	Noh - mode 5
  NOH - mode 6	C D Eb F Ab Bb B C	Noh - mode 6
  NOH - mode 7	C Db Eb Gb Ab A Bb C	Noh - mode 7
  SRI, PURVI	C Db E F# G Ab B C	Sri - mode 1
  SRI - mode 2	C Eb F F# G A# B C	Sri - mode 2
  SRI - mode 3	C D Eb Fb G Ab A C	Sri - mode 3
  SRI - mode 4	C C# D F F# G Bb C	Sri - mode 4
  SRI - mode 5	C Db E F Gb A B C	Sri - mode 5
  SRI - mode 6	C D# E F G# A# B C	Sri - mode 6
  SRI - mode 7	C C# D F G Ab A C	Sri - mode 7
  TODI	C Db Eb F# G Ab B C	Todi - mode 1
  TODI - mode 2	C D F F# G A# B C	Todi - mode 2
  TODI - mode 3	C D# E F G# A Bb	Todi - mode 3
  TODI - mode 4	C C# D E# F# G A C	Todi - mode 4
  TODI - mode 5	C Db E F Gb Ab B C	Todi - mode 5
  TODI - mode 6	C D# E F G A# B C	Todi - mode 6
  TODI - mode 7	C C# D E G G# A C	Todi - mode 7
  ENIGMATIC 1	C Db E Gb Ab Bb B C	Enigmatic 1 - mode 1
  ENIGMATIC 1 - mode 2	C Eb F G A A# B C	Enigmatic 1 - mode 2
  ENIGMATIC 1 - mode 3	C D E F# G G# A C	Enigmatic 1 - mode 3
  ENIGMATIC 1 - mode 4	C D E F F# G Bb C	Enigmatic 1 - mode 4
  ENIGMATIC 1 - mode 5	C D D# E F Ab Bb C	Enigmatic 1 - mode 5
  ENIGMATIC 1 - mode 6	C C# D Eb Gb Ab Bb C	Enigmatic 1 - mode 6
  ENIGMATIC 1 - mode 7	C C# D F G A B C	Enigmatic 1 - mode 7
  ENIGMATIC 2	C Db E F Ab Bb B C	Enigmatic 2 - mode 1
  ENIGMATIC 2 - mode 2	C D# E G A A# B C	Enigmatic 2 - mode 2
  ENIGMATIC 2 - mode 3	C C# E F# G G# A C	Enigmatic 2 - mode 3
  ENIGMATIC 2 - mode 4	C Eb F F# G Ab B C	Enigmatic 2 - mode 4
  ENIGMATIC 2 - mode 5	C D D# E F G# A C	Enigmatic 2 - mode 5
  ENIGMATIC 2 - mode 6	C C# D Eb F# G Bb C	Enigmatic 2 - mode 6
  ENIGMATIC 2 - mode 7	C C# D F F# A B C	Enigmatic 2 - mode 7
  BLUES SCALE	C Eb F F# G Bb C	Blues Scale - mode 1
  MAJOR BLUES SCALE	C D Eb E G A C	Blues Scale - mode 2
  BLUES SCALE - mode 3	C C# D F G Bb C	Blues Scale - mode 3
  MARWA	C C# E F# A B C	Blues Scale - mode 4
  BLUES SCALE - mode 5	C Eb F Ab Bb B C	Blues Scale - mode 5
  BLUES SCALE - mode 6	C D F G G# A C	Blues Scale - mode 6
  1 PROMETHEUS	C D E F# A Bb C	Prometheus - mode 1
  2 PROMETHEUS - mode 2	C D E G Ab Bb C	Prometheus - mode 2
  3 PROMETHEUS - mode 3	C D F Gb Ab Bb C	Prometheus - mode 3
  4 PROMETHEUS - mode 4	C D# E F# Ab Bb C	Prometheus - mode 4
  5 PROMETHEUS - mode 5	C Db Eb F G A C	Prometheus - mode 5
  6 PROMETHEUS - mode 6	C D E F# G# B C	Prometheus - mode 6
  SHO 1	C D Eb F G A C	Sho 1 - mode 1
  SHO 1 - mode 2	C Db Eb F G Bb C	Sho 1 - mode 2
  SHO 1 - mode 3	C D E F# A B C	Sho 1 - mode 3
  SHO 1 - mode 4	C D E G A Bb C	Sho 1 - mode 4
  SHO 1 - mode 5	C D F G Ab Bb C	Sho 1 - mode 5
  SHO 1 - mode 6	C Eb F Gb Ab Bb C	Sho 1 - mode 6
  SHO 2	C Db Eb Fb Gb Bb C	Sho 2 - mode 1
  SHO 2 - mode 2	C D Eb F A B C	Sho 2 - mode 2
  SHO 2 - mode 3	C Db Eb G A Bb C	Sho 2 - mode 3
  SHO 2 - mode 4	C D F# G# A B C	Sho 2 - mode 4
  SHO 2 - mode 5	C E F# G A Bb C	Sho 2 - mode 5
  SHO 2 - mode 6	C D Eb F Gb Ab A	Sho 2 - mode 6
  MAJOR PENTATONIC	C D E G A C	Major Pentatonic - mode 1
  MAJOR PENTATONIC - mode 2	C D F G Bb C	Major Pentatonic - mode 2
  MAJOR PENTATONIC - mode 3	C Eb F Ab Bb C	Major Pentatonic - mode 3
  BANSHIKI-CHO	C D F G A C	Major Pentatonic - mode 4
  MINOR PENTATONIC	C Eb F G Bb C	Major Pentatonic - mode 5
  KANSAS CITY, KUMOI	C D Eb G A C	Kansas City - mode 1
  IN SEN	C Db F G Bb C	Kansas City - mode 2
  KANSAS CITY - mode 3	C E F# A B C	Kansas City - mode 3
  KANSAS CITY - mode 4	C D F G Ab C	Kansas City - mode 4
  KANSAS CITY - mode 5	C Eb F Gb Bb C	Kansas City - mode 5
  AUGMENTED PENTATONIC, MAJOR PENTATONIC b6	C D E G Ab C	Augmented Pentatonic - mode 1
  AUGMENTED PENTATONIC - mode 2	C D F Gb Bb C	Augmented Pentatonic - mode 2
  ALTERED PENTATONIC	C Eb E Ab Bb C	Augmented Pentatonic - mode 3
  AUGMENTED PENTATONIC - mode 4	C Db F G A C	Augmented Pentatonic - mode 4
  AUGMENTED PENTATONIC - mode 5	C E F# G# B C	Augmented Pentatonic - mode 5
  HIRAJOSHI, AKEBONO	C D Eb G Ab C	Kojo No Tsuki - mode 1
  IWATO	C Db F Gb Bb C	Kojo No Tsuki - mode 2
  KUMOI	C E F A B C	Kojo No Tsuki - mode 3
  HON KUMOI SHIOUZHI	C Db F G Ab C	Kojo No Tsuki - mode 4
  CHINESE, JAPANESE	C E F# G B C	Kojo No Tsuki - mode 5
  PYGMY, YO	C D Eb G Bb C	Five Note Pygmy Scale of Rwanda - mode 1
  PYGMY - mode 2	C Db F Ab Bb C	Five Note Pygmy Scale of Rwanda - mode 2
  PGYMY - mode 3	C E G A B C	Five Note Pygmy Scale of Rwanda - mode 3
  PGYMY - mode 4	C Eb F G Ab C	Five Note Pygmy Scale of Rwanda - mode 4
  PGYMY - mode 5	C D E F A C	Five Note Pygmy Scale of Rwanda - mode 5
  JOG	C D F# G A C	Jog - mode 1
  JOG - mode 2	C E F G Bb C	Jog - mode 2
  JOG - mode 3	C Db Eb Gb Ab Bb C	Jog - mode 3
  JOG - mode 4	C D F G B C	Jog - mode 4
  JOG - mode 5	C Eb F A Bb C	Jog - mode 5
  HANSA DHWANI	C D E G B C	Hansa Dhwani - mode 1
  HANSA DHWANI - mode 2	C D F A Bb C	Hansa Dhwani - mode 2
  HANSA DHWANI - mode 3	C Eb G Ab Bb C	Hansa Dhwani - mode 3
  HANSA DHWANI - mode 4	C E F G A C	Hansa Dhwani - mode 4
  HANSA DHWANI - mode 5	C Db Eb F Ab C	Hansa Dhwani - mode 5
  YUSEF SYNTHETIC 3	C D F F# G Bb B C	SYNTHETIC
  YUSEF SYNTHETIC 3 - mode 2	C D# E F G# A Bb C	SYNTHETIC
  YUSEF SYNTHETIC 3 - mode 3	C C# D F F# G A C	SYNTHETIC
  YUSEF SYNTHETIC 3 - mode 4	C C# E F F# G# B C	SYNTHETIC
  YUSEF SYNTHETIC 3 - mode 5	C D# E F G Bb B C	SYNTHETIC
  YUSEF SYNTHETIC 3 - mode 6	C C# D E G G# A C	SYNTHETIC
  YUSEF SYNTHETIC 3 - mode 7	C C# D# F# G G# B C	SYNTHETIC
  YUSEF SYNTHETIC 5	C D Eb E G Ab Bb C	SYNTHETIC
  YUSEF SYNTHETIC 5 - mode 2	C C# D F Gb Ab Bb C	SYNTHETIC
  YUSEF SYNTHETIC 5 - mode 3	C C# E F G A B C	SYNTHETIC
  YUSEF SYNTHETIC 5 - mode 4	C Eb Fb Gb Ab Bb B C	SYNTHETIC
  YUSEF SYNTHETIC 5 - mode 5	C C# E F G A B C	SYNTHETIC
  YUSEF SYNTHETIC 5 - mode 6	C Db Eb F G G# A C	SYNTHETIC
  YUSEF SYNTHETIC 5 - mode 7	C D E F# G G# B C	SYNTHETIC
  YUSEF SYNTHETIC 6	C D Eb E G G# A C	SYNTHETIC
  YUSEF SYNTHETIC 6 - mode 2	C C# D F F# G Bb C	SYNTHETIC
  YUSEF SYNTHETIC 6 - mode 3	C C# E F F# A B C	SYNTHETIC
  YUSEF SYNTHETIC 6 - mode 4	C Eb E F Ab Bb B C	SYNTHETIC
  YUSEF SYNTHETIC 6 - mode 5	C C# D F G G# A C	SYNTHETIC
  YUSEF SYNTHETIC 6 - mode 6	C C# E F# G G# B C	SYNTHETIC
  YUSEF SYNTHETIC 6 - mode 7	C Eb F F# G Bb B C	SYNTHETIC
  YUSEF SYNTHETIC 8	C D Eb F G# A B C	SYNTHETIC
  YUSEF SYNTHETIC 8 - mode 2	C Db Eb F# G A Bb C	SYNTHETIC
  YUSEF SYNTHETIC 8 - mode 3	C D F F# G# A B C	SYNTHETIC
  YUSEF SYNTHETIC 8 - mode 4	C D# E F# G A Bb C	SYNTHETIC
  YUSEF SYNTHETIC 8 - mode 5	C C# D# E F# G A C	SYNTHETIC
  YUSEF SYNTHETIC 8 - mode 6	C D Eb F F# G# B C	SYNTHETIC
  YUSEF SYNTHETIC 8 - mode 7	C C# D# E F# G A C	SYNTHETIC
  YUSEF SYNTHETIC 9	C C# D# E G# A B C	SYNTHETIC
  YUSEF SYNTHETIC 9 - mode 2	C D Eb G Ab Bb B C	SYNTHETIC
  YUSEF SYNTHETIC 9 - mode 3	C Db F F# G# A B C	SYNTHETIC
  YUSEF SYNTHETIC 9 - mode 4	C E F G G# A B C	SYNTHETIC
  YUSEF SYNTHETIC 9 - mode 5	C Db Eb E F G Ab C	SYNTHETIC
  YUSEF SYNTHETIC 9 - mode 6	C D D# E F# G B C	SYNTHETIC
  YUSEF SYNTHETIC 9 - mode 7	C C# D E F A Bb C	SYNTHETIC
  YUSEF SYNTHETIC 10	C D F G Ab B C	SYNTHETIC
  YUSEF SYNTHETIC 10 - mode 2	C Eb F Gb A Bb C	SYNTHETIC
  YUSEF SYNTHETIC 10 - mode 3	C D Eb F# G A C	SYNTHETIC
  YUSEF SYNTHETIC 10 - mode 4	C Db E F A Bb C	SYNTHETIC
  YUSEF SYNTHETIC 10 - mode 5	C D# E F# A B C	SYNTHETIC
  YUSEF SYNTHETIC 10 - mode 6	C Db Eb Gb Ab A C	SYNTHETIC
  YUSEF SYNTHETIC 11 - mode 1	C Eb F# G B C	SYNTHETIC
  YUSEF SYNTHETIC 11 - mode 2	C D# E G# A C	SYNTHETIC
  YUSEF SYNTHETIC 11 - mode 3	C Db F F# A C	SYNTHETIC
  YUSEF SYNTHETIC 11 - mode 4	C E F Ab B C	SYNTHETIC
  YUSEF SYNTHETIC 11 - mode 5	C Db E G Ab C	SYNTHETIC
  YUSEF SYNTHETIC 12	C E G Ab B C	SYNTHETIC
  YUSEF SYNTHETIC 12 - mode 2	C D# E G Ab C	SYNTHETIC
  YUSEF SYNTHETIC 12 - mode 3	C Db E F A C	SYNTHETIC
  YUSEF SYNTHETIC 12 - mode 4	C D# E G# B C	SYNTHETIC
  YUSEF SYNTHETIC 12 - mode 5	C Db F G# A C	SYNTHETIC
  YUSEF SYNTHETIC 13	C Db F G# A C	SYNTHETIC
  YUSEF SYNTHETIC 13 - mode 2	C E G Ab B C	SYNTHETIC
  YUSEF SYNTHETIC 13 - mode 3	C D# E G Ab C	SYNTHETIC
  YUSEF SYNTHETIC 13 - mode 4	C Db E F A C	SYNTHETIC
  YUSEF SYNTHETIC 13 - mode 5	C D# E G# B C	SYNTHETIC
  YUSEF SYNTHETIC 14	C F# A Bb B C	SYNTHETIC
  YUSEF SYNTHETIC 14 - mode 2	C D# E F F# C	SYNTHETIC
  YUSEF SYNTHETIC 14 - mode 3	C C# D Eb A C	SYNTHETIC
  YUSEF SYNTHETIC 14 - mode 4	C C# D Ab B C	SYNTHETIC
  YUSEF SYNTHETIC 14 - mode 5	C C# G Bb B C	SYNTHETIC
  YUSEF SYNTHETIC 15	C Eb G A# B C	SYNTHETIC
  YUSEF SYNTHETIC 15 - mode 2	C E G G# A C	SYNTHETIC
  YUSEF SYNTHETIC 15 - mode 3	C D# E F Ab C	SYNTHETIC
  YUSEF SYNTHETIC 15 - mode 4	C C# D F A C	SYNTHETIC
  YUSEF SYNTHETIC 15 - mode 5	C C# E G# B C	SYNTHETIC
  YUSEF SYNTHETIC 16	C Db Ab B C	SYNTHETIC
  YUSEF SYNTHETIC 16 - mode 2	C G Bb B C	SYNTHETIC
  YUSEF SYNTHETIC 16 - mode 3	C D# E F C	SYNTHETIC
  YUSEF SYNTHETIC 16 - mode 4	C C# D A C	SYNTHETIC
  YUSEF SYNTHETIC 17	C Db F Gb C	SYNTHETIC
  YUSEF SYNTHETIC 17 - mode 2	C E F B C	SYNTHETIC
  YUSEF SYNTHETIC 17 - mode 3	C Db G Ab C	SYNTHETIC
  YUSEF SYNTHETIC 17 - mode 4	C F# G B C	SYNTHETIC
  YUSEF SYNTHETIC 18	C Eb F Gb C	SYNTHETIC
  YUSEF SYNTHETIC 18 - mode 2	C D Eb A C	SYNTHETIC
  YUSEF SYNTHETIC 18 - mode 3	C Db G Bb C	SYNTHETIC
  YUSEF SYNTHETIC 18 - mode 4	C F# A B C	SYNTHETIC
  YUSEF SYNTHETIC 19	C E G Ab C	SYNTHETIC
  YUSEF SYNTHETIC 19 - mode 2	C D# E Ab C	SYNTHETIC
  YUSEF SYNTHETIC 19 - mode 3	C Db F A C	SYNTHETIC
  YUSEF SYNTHETIC 19 - mode 4	C E G# B C	SYNTHETIC
  YUSEF SYNTHETIC 20	C Db E F C	SYNTHETIC
  YUSEF SYNTHETIC 20 - mode 2	C D# E B C	SYNTHETIC
  YUSEF SYNTHETIC 20 - mode 3	C Db G# A C	SYNTHETIC
  YUSEF SYNTHETIC 20 - mode 4	C G Ab B C	SYNTHETIC
  AUGMENTED - mode 1	C D# E G Ab B C	SYMMETRICAL
  AUGMENTED - mode 2	C Db E F G# A C	SYMMETRICAL
  WHOLE TONE (messiaen 1)	C D E F# A Bb C	SYMMETRICAL, MESSIAEN
  DIMINISHED 1 (messiaen 2 mode 1)	C C# D# E F# G A Bb C	SYMMETRICAL, MESSIAEN
  DIMINISHED 2 (messiaen 2 mode 2)	C D Eb F F# G# A B C	SYMMETRICAL, MESSIAEN
  MESSIAEN 3 - mode 1	C D D# E F# G G# A# B C	SYMMETRICAL, MESSIAEN
  MESSIAEN 3 - mode 2	C C# D E F F# G# A Bb	SYMMETRICAL, MESSIAEN
  MESSIAEN 3 - mode 3	C C# D# E F G G# A B C	SYMMETRICAL, MESSIAEN
  MESSIAEN 4, YUSEF SYNTHETIC 1	C C# D F F# G G# B C	SYMMETRICAL, MESSIAEN
  MESSIAEN 4 - mode 2	C C# E F F# G A# B C	SYMMETRICAL, MESSIAEN
  MESSIAEN 4 - mode 3	C D# E F F# A A# B	SYMMETRICAL, MESSIAEN
  MESSIAEN 4 - mode 4	C C# D D# F# G G# A C	SYMMETRICAL, MESSIAEN
  MESSIAEN 5 - mode 1	C Db F F# G B C	SYMMETRICAL, MESSIAEN
  MESSIAEN 5 - mode 2	C F E F# A# B C	SYMMETRICAL, MESSIAEN
  TRITONE SEMI (messiaen 5 - mode 3)	C C# D F# G Ab C	SYMMETRICAL, MESSIAEN
  MESSIAEN 6 - mode 1	C D E F F# G# A# B C	SYMMETRICAL, MESSIAEN
  MESSIAEN 6 - mode 2	C D D# E F# G# A Bb C	SYMMETRICAL, MESSIAEN
  MESSIAEN 6 - mode 3	C C# D E F# G Ab Bb C	SYMMETRICAL, MESSIAEN
  MESSIAEN 6 - mode 4	C Db Eb F F# G A B C	SYMMETRICAL, MESSIAEN
  MESSIAEN 7 - mode 1	C C# D Eb F F# G G# A B C	SYMMETRICAL, MESSIAEN
  MESSIAEN 7 - mode 2	C C# D E F F# G G# A# B C	SYMMETRICAL, MESSIAEN
  MESSIAEN 7 - mode 3	C C# D# E F F# G A A# B C	SYMMETRICAL, MESSIAEN
  MESSIAEN 7 - mode 4	C D D# E F F# G# A A# B C	SYMMETRICAL, MESSIAEN
  TRUNCATED MESSIAEN 2 mode 2 ver A - mode 1	C Eb F F# A B C	SYMMETRICAL, MESSIAEN
  TRUNCATED MESSIAEN 2 mode 2 ver A - mode 2	C D Eb F# G# A C	SYMMETRICAL, MESSIAEN
  TRITONE SCALE	C C# E F# G Bb C	SYMMETRICAL, MESSIAEN
  TRUNCATED MESSIAEN 2 mode 2 ver B - mode 1	C D F F# G# B C	SYMMETRICAL, MESSIAEN
  TRUNCATED MESSIAEN 2 mode 2 ver B - mode 2	C D# E F# A Bb C	SYMMETRICAL, MESSIAEN
  TRUNCATED MESSIAEN 2 mode 2 ver B - mode 3	C Db Eb F# G A C	SYMMETRICAL, MESSIAEN
  TRUNCATED MESSIAEN 5 - mode 1	C Db F# G C	SYMMETRICAL, MESSIAEN
  TRUNCATED MESSIAEN 5 - mode 2	C F F# B C	SYMMETRICAL, MESSIAEN
  TRIPLE DIMINISHED	C B C# D# - D C# Eb F - E Eb F G - F# F G A - Ab G A B - Bb A B C# - C	Non Octave Based
  `
}

const td = require('tonal-distance')

const getSemitones = str => {
  const notes = str
    .split(' ')
    .map(n => n.trim())
    .filter(x => x)
    .map(n => td.semitones('C', n))
  notes.splice(notes.length - 1, 1)
  return notes
}

const getIntervals = str => {
  const notes = str
    .split(' ')
    .map(n => n.trim())
    .filter(x => x)
    .map(n => td.interval('C', n))
  notes.splice(notes.length - 1, 1)
  return notes
}

const getData = () => {
  const raw = getRawData()
  return raw
    .split('\n')
    .map(row => {
      const [name, notes, mode] = row.split('\t').map(s => s.trim())
      if (!name || !notes) {
        return null
      }
      return {
        name: _.lowerCase(name),
        notes,
        semitones: [...getSemitones(notes), 12],
        intervals: [...getIntervals(notes), '8P'],
        mode: _.lowerCase(mode),
      }
    })
    .filter(x => x)
}

const data = getData()
console.log(JSON.stringify(data, null, 2))
// console.log(JSON.stringify([data[0], data[10], data[54]], null, 2))
