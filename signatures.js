const octaves = 
  {
    g: [ 4, 4, 4, 4, 3, 4, 3 ]
  };

const sharps = [ 'f', 'c', 'g', 'd', 'a', 'e', 'b' ];
const flats = [ 'b', 'e', 'a', 'd', 'g', 'c', 'f' ];

const signatures = 
[
  { id: 'CM',  major: 'C',        minor: 'A',       sharps: 0, flats: 0 },
  { id: 'GM',  major: 'G',        minor: 'E',       sharps: 1, flats: 0 },
  { id: 'DM',  major: 'D',        minor: 'B',       sharps: 2, flats: 0 },
  { id: 'AM',  major: 'A',        minor: 'F-sharp', sharps: 3, flats: 0 },
  { id: 'EM',  major: 'E',        minor: 'C-sharp', sharps: 4, flats: 0 },
  { id: 'BM',  major: 'B',        minor: 'G-sharp', sharps: 5, flats: 0 },
  { id: 'FsM', major: 'F-sharp',  minor: 'D-sharp', sharps: 6, flats: 0 },
  { id: 'CsM', major: 'C-sharp',  minor: 'A-sharp', sharps: 7, flats: 0 },
  { id: 'FM',  major: 'F',        minor: 'D',       sharps: 0, flats: 1 },
  { id: 'BfM', major: 'B-flat',   minor: 'G',       sharps: 0, flats: 2 },
  { id: 'EfM', major: 'E-flat',   minor: 'C',       sharps: 0, flats: 3 },
  { id: 'AfM', major: 'A-flat',   minor: 'F',       sharps: 0, flats: 4 },
  { id: 'DfM', major: 'D-flat',   minor: 'B-flat',  sharps: 0, flats: 5 },
  { id: 'GfM', major: 'G-flat',   minor: 'E-flat',  sharps: 0, flats: 6 },
  { id: 'CfM', major: 'C-flat',   minor: 'A-flat',  sharps: 0, flats: 7 },
];

module.exports = { signatures, sharps, flats, octaves };