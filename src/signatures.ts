type KeyId = string;

type Signature = {
  id: KeyId;
  major: string;
  minor: string;
  sharps: number;
  flats: number;
};

type Accidental = '#' | 'b';

const signatures: Signature[] = 
[
  { id: 'C',  major: 'C',        minor: 'A',       sharps: 0, flats: 0 },
  { id: 'G',  major: 'G',        minor: 'E',       sharps: 1, flats: 0 },
  { id: 'D',  major: 'D',        minor: 'B',       sharps: 2, flats: 0 },
  { id: 'A',  major: 'A',        minor: 'F#',      sharps: 3, flats: 0 },
  { id: 'E',  major: 'E',        minor: 'C#',      sharps: 4, flats: 0 },
  { id: 'B',  major: 'B',        minor: 'G#',      sharps: 5, flats: 0 },
  { id: 'F#', major: 'F#',       minor: 'D#',      sharps: 6, flats: 0 },
  { id: 'C#', major: 'C#',       minor: 'A#',      sharps: 7, flats: 0 },
  { id: 'F',  major: 'F',        minor: 'D',       sharps: 0, flats: 1 },
  { id: 'Bb', major: 'Bb',       minor: 'G',       sharps: 0, flats: 2 },
  { id: 'Eb', major: 'Eb',       minor: 'C',       sharps: 0, flats: 3 },
  { id: 'Ab', major: 'Ab',       minor: 'F',       sharps: 0, flats: 4 },
  { id: 'Db', major: 'Db',       minor: 'Bb',      sharps: 0, flats: 5 },
  { id: 'Gb', major: 'Gb',       minor: 'Eb',      sharps: 0, flats: 6 },
  { id: 'Cb', major: 'Cb',       minor: 'Ab',      sharps: 0, flats: 7 },
];

export { Signature, KeyId, signatures, Accidental };