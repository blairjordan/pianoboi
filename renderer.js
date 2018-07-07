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

  let signature = {};
  let hasSharps = false;
  let majorChords, minorChords;

  var input = new midi.input(); // Set up a new input
  var portCount = input.getPortCount();
  console.log(`devices available: ${portCount}`);
  input.getPortName(0); // Just look at the first port for now

  let keys = [];

  renderer.resize(800, 600);
  
  const hasAccidental = (k,a) => (k.substring(1,2) == a);
  const findSignature = id => signatures.find(s => s.id === id);
  const capitalize = ([first,...rest]) => first.toUpperCase() + rest.join('').toLowerCase();

  const chordsEqual = ( a, b ) => {
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

  // m: array of chords (i.e., array of keys)
  // t: major or minor
  const listChords = ( m, t ) => {
    $(`.${t}chords`).html(`<th>${capitalize(t)}</th>`);
      m.forEach(c => {
        $(`.${t}chords`).append(`<td class="chord ${c}">${c}</td>`);
      });
  };

  // m: array of chords (i.e., array of keys)
  const highlightChords = m => {
    m.forEach(c => {
      let n = Chord.notes(c);
      if (chordsEqual(n, keys.map(k => k.substring(0, k.length - 1)))) {
        $(`.chord.${c}`).addClass('highlight');
      }
    });
  }

  // Format number of flats/ sharps in a given key signature
  const accidentalText = ( s, t ) => {
    let count =  s[`${t}s`];
    if (count=== 0) return '';
    return `(${count} ${t}${(count > 1) ? 's' : ''})`;
  }

  const renderStave = ({ keys, signature }) => {

    // Create a stave of width 400 at position 10, 40 on the canvas.
    let topStaff = new VF.Stave(30, 40, 550);
    let bottomStaff = new VF.Stave(30, 180, 550);

    let brace = new Vex.Flow.StaveConnector(topStaff, bottomStaff).setType(3);
    let lineRight = new Vex.Flow.StaveConnector(topStaff, bottomStaff).setType(6);
    let lineLeft = new Vex.Flow.StaveConnector(topStaff, bottomStaff).setType(1);

    topStaff.addClef('treble');
    bottomStaff.addClef('bass');
    topStaff.addKeySignature(signature.id).addTimeSignature('4/4');
    bottomStaff.addKeySignature(signature.id).addTimeSignature('4/4');

    let rests  = [
      new VF.StaveNote({ keys: ["b/4"], duration: "qr" }),
      new VF.StaveNote({ keys: ["b/4"], duration: "qr" }),
      new VF.StaveNote({ keys: ["b/4"], duration: "qr" }),
    ];

    let notes = {
      notesTreble: [ ...rests],
      notesBass: [ ...rests]
    }
    
    let noteTreble = new VF.StaveNote({ keys: ["b/4"], duration: "qr" });
    let noteBass = new VF.StaveNote({ keys: ["b/4"], duration: "qr" });
    if (keys.length !== 0) {
      noteTreble = new VF.StaveNote({ clef: 'treble', keys, duration: "q" });
      noteBass = new VF.StaveNote({ clef: 'bass', keys, duration: "q" });
    } 
    
    let flats = keys.map(k => hasAccidental(k,'b'));
    let sharps = keys.map(k => hasAccidental(k,'#'));

    console.log(keys);

    keys.forEach((k,i) => {
      if (flats[i]) {
        noteTreble.addAccidental(i, new Vex.Flow.Accidental('b'));
        noteBass.addAccidental(i, new Vex.Flow.Accidental('b'));
      }
      if (sharps[i]) {
        noteTreble.addAccidental(i, new Vex.Flow.Accidental('#'));
        noteBass.addAccidental(i, new Vex.Flow.Accidental('#'));
      }
    });

    notes.notesTreble.unshift(noteTreble);
    notes.notesBass.unshift(noteBass);

    let voiceTreble = new VF.Voice({num_beats: 4,  beat_value: 4, resolution: Vex.Flow.RESOLUTION}).addTickables(notes.notesTreble);
    let voiceBass = new VF.Voice({num_beats: 4,  beat_value: 4, resolution: Vex.Flow.RESOLUTION}).addTickables(notes.notesBass);
    
    let formatter = new VF.Formatter()
      .joinVoices([voiceTreble])
      .format([voiceTreble], 400)
      .joinVoices([voiceBass])
      .format([voiceBass], 400);

    context.clear();
    topStaff.setContext(context).draw();
    brace.setContext(context).draw();
    lineRight.setContext(context).draw();
    lineLeft.setContext(context).draw();
    bottomStaff.setContext(context).draw();

    voiceTreble.draw(context, topStaff);
    voiceBass.draw(context, bottomStaff);
  }

  const updateKeySignature = () => {
    signature = findSignature($('#signature').val());
    
    majorChords = Key.chords(`${signature.major} major`);
    minorChords = Key.chords(`${signature.minor} minor`);

    listChords( majorChords, 'major');
    listChords( minorChords, 'minor');

    renderStave({ keys: [], signature });
  }
  
  signatures.forEach(s => {
    $('#signature').append(`<option value="${s.id}">${s.major} major / ${s.minor} minor ${accidentalText(s, 'sharp') || accidentalText(s, 'flat') }</option>`);
  });

  $('#signature').on('change', function () {  
    updateKeySignature();    
  });

  updateKeySignature();

  input.on('message', function(deltaTime, message) {

    const keyEventMessage = 144;
    
    let messageType = message[0];
    let keyNo = message[1];
    let velocity = message[2];

    // TODO: Set second param to true for sharps.
    // https://github.com/danigb/tonal/blob/master/docs/API.md#notefrommidimidi-boolean--string
    let currentKey = Note.fromMidi(keyNo, (signature.sharps > 1));

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
    highlightChords(majorChords);
    highlightChords(minorChords);
      
    renderStave({
      keys: (Array.sort(keys)).map(k => `${k.substring(0,k.search(/\d/)).toLowerCase()}/${k.substring(k.search(/\d/),k.length)}`),
      signature
    });
  });

  // Open the first available input port.
  input.openPort(0);

  // Sysex, timing, and active sensing messages are ignored
  input.ignoreTypes(false, false, false);

});