let {ipcRenderer, remote} = require('electron');  
let main = remote.require("./main.js");
const midi = require('midi');
const { signatures } = require('./signatures.js');
window.$ = window.jQuery = require('jquery');
const { Note, Array, Chord } = require('tonal');
const Key = require("tonal-key")
const Vex = require('vexflow');

$(function() {

  const VF = Vex.Flow;
  const renderer = new VF.Renderer(document.getElementById("sheetmusic"), VF.Renderer.Backends.SVG);
  const context = renderer.getContext();

  let signature = 'C';
  let clef = 'treble';
  let majorChords, minorChords;

  renderer.resize(800, 600);
  
  const findSignature = id => signatures.find(s => s.id === id);

  const chordsEqual = (a, b) => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;
    a.sort();
    b.sort();
    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  renderStave = ({ clef, keys, signature }) => {

    // Create a stave of width 400 at position 10, 40 on the canvas.
    let stave = new VF.Stave(10, 40, 550);
    stave.addClef(clef).addTimeSignature("4/4");
    stave.addKeySignature(signature.id);

    var notes = [
      new VF.StaveNote({ keys: ["b/4"], duration: "qr" }),
      new VF.StaveNote({ keys: ["b/4"], duration: "qr" }),
      new VF.StaveNote({ keys: ["b/4"], duration: "qr" }),
    ];

    let note = new VF.StaveNote({ keys: ["b/4"], duration: "qr" });
    if (keys.length !== 0) {
      note = new VF.StaveNote({ clef, keys, duration: "q" });
    }
    
    let accidentals = keys.map(k => hasAccidental(k,'b'));

    console.log(keys);

    keys.forEach((k,i) => {
      if (accidentals[i]) {
        note.addAccidental(i, new Vex.Flow.Accidental('b'));
      }
    });

    notes.unshift(note);

    var voice = new VF.Voice({num_beats: 4,  beat_value: 4});
    voice.addTickables(notes);
    
    var formatter = new VF.Formatter().joinVoices([voice]).format([voice], 400);

    context.clear();
    stave.setContext(context).draw();

    voice.draw(context, stave);
  }

  const updateKeySignature = () => {
    signature = findSignature($('#signature').val()); // TODO: use tonal Key.props
    majorChords = Key.chords(`${signature.major} major`);
    minorChords = Key.chords(`${signature.minor} minor`);

    $('.majorchords').html('<th>Major</th>');
    majorChords.forEach(c => {
      $('.majorchords').append(`<td class="chord ${c}">${c}</td>`);
    });

    $('.minorchords').html('<th>Minor</th>');
    minorChords.forEach(c => {
      $('.minorchords').append(`<td class="chord ${c}">${c}</td>`);
    });

    renderStave({ clef, keys: [], signature });
  }
  
  // Describes number of flats/ sharps in a given key signature
  accidentalText = (s, t) => {
    let count =  s[`${t}s`];
    if (count=== 0) return '';
    return `(${count} ${t}${(count > 1) ? 's' : ''})`;
  }

  signatures.forEach(s => {
    $('#signature').append(`<option value="${s.id}">${s.major} major / ${s.minor} minor ${accidentalText(s, 'sharp') || accidentalText(s, 'flat') }</option>`);
  });

  $('#signature').on('change', function () {  
    updateKeySignature();    
  });

  $('#clef').on('change', function () {  
    clef = $('#clef').val();
    renderStave({ clef, keys: [], signature });
  });

  updateKeySignature();

  // Set up a new input.
  var input = new midi.input();

  // Count the available input ports.
  var portCount = input.getPortCount();

  console.log(`devices available: ${portCount}`);

  input.getPortName(0); // Temp - Just look at first port for now

  const hasAccidental = (k,a) => (k.substring(1,2) == a);

  let keys = [];
  input.on('message', function(deltaTime, message) {

      const keyEventMessage = 144;
      
      let messageType = message[0];
      let keyNo = message[1];
      let velocity = message[2];

      let currentKey = Note.fromMidi(keyNo);

      // Key event for a defined key
      if (messageType == keyEventMessage
        && typeof currentKey !== 'undefined') {

        if (velocity > 0) { 
          if ( !( currentKey in keys ) ) {
            // Add
            keys.push(currentKey);
          }
        } else {
          // Remove
          keys.splice( keys.indexOf(currentKey), 1 );
        } 
      }

      $('.chord').removeClass('highlight');
      majorChords.forEach(c => {
        let chordNotes = Chord.notes(c);
        if (chordsEqual(chordNotes, keys.map(k => k.substring(0, k.length - 1)))) {
          $(`.chord.${c}`).addClass('highlight');
        }
      });

      minorChords.forEach(c => {
        let chordNotes = Chord.notes(c);
        if (chordsEqual(chordNotes, keys.map(k => k.substring(0, k.length - 1)))) {
          $(`.chord.${c}`).addClass('highlight');
        }
      });
      
    renderStave({
      clef, 
      keys: (Array.sort(keys)).map(k => `${k.substring(0,k.search(/\d/)).toLowerCase()}/${k.substring(k.search(/\d/),k.length)}`),
      signature
    });
  });

  // Open the first available input port.
  input.openPort(0);

  // Sysex, timing, and active sensing messages are ignored
  input.ignoreTypes(false, false, false);

});