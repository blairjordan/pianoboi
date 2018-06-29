var {ipcRenderer, remote} = require('electron');  
var main = remote.require("./main.js");
var midi = require('midi');
const symbols = require('./symbols.js');
window.$ = window.jQuery = require('jquery');
const { Note, Interval, Distance, Scale, Chord } = require('tonal');
const Vex = require('vexflow');

let VF, renderer, context;

$(function() {
  VF = Vex.Flow;
  
  renderer = new VF.Renderer(document.getElementById("sheetmusic"), VF.Renderer.Backends.SVG);
  
  renderer.resize(800, 500);
  context = renderer.getContext();
  
  const findSignature = id => signatures.find(s => s.id === id);
  signatures.forEach(s => {
    $('#signature').append(`<option value="${s.id}">${s.major} major / ${s.minor} minor</option>`);
  });

  $('#signature').on('change', function () {
    console.log('changed signature to something');
  });
});

// Set up a new input.
var input = new midi.input();

// Count the available input ports.
var portCount = input.getPortCount();

console.log(`devices available: ${portCount}`);

input.getPortName(0); // Temp - Just look at first port for now

const hasAccidental = (k,a) => (k.substring(1,2) == a);

let keysPressed = [];

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
        if ( !( currentKey in keysPressed ) ) {
          // Add
          keysPressed.push(currentKey);
        }
      } else {
        // Remove
        keysPressed.splice( keysPressed.indexOf(currentKey), 1 );
      } 
    }
    
    console.log(keysPressed);

    // Create a stave of width 400 at position 10, 40 on the canvas.
    let stave = new VF.Stave(10, 40, 400);
    stave.addClef("treble").addTimeSignature("4/4");
    
    let stave2 = new VF.Stave(10, 150, 400);
    stave2.addClef("bass").addTimeSignature("4/4");

    keys = keysPressed.map(k => `${k.substring(0,k.search(/\d/)).toLowerCase()}/${k.substring(k.search(/\d/),k.length)}`);

    var notes = [
      new VF.StaveNote({ keys: ["b/4"], duration: "qr" }),
      new VF.StaveNote({ keys: ["b/4"], duration: "qr" }),
      new VF.StaveNote({ keys: ["b/4"], duration: "qr" }),
    ];

    let note = new VF.StaveNote({ keys: ["b/4"], duration: "qr" });
    if (keys.length !== 0) {
      note = new VF.StaveNote({ keys, duration: "q" });
    }
    
    let accidentals = keys.map(k => hasAccidental(k,'b'));
    
    keys.forEach((k,i) => {
      if (accidentals[i]) {
        note.addAccidental(i, new Vex.Flow.Accidental('b'));
      }
    });

    notes.unshift(note);

    var voice = new VF.Voice({num_beats: 4,  beat_value: 4});
    voice.addTickables(notes);
    
    // Format and justify the notes to 400 pixels.
    var formatter = new VF.Formatter().joinVoices([voice]).format([voice], 400);

    context.clear();
    stave.setContext(context).draw();
    stave2.setContext(context).draw();

    // Render voice
    voice.draw(context, stave);
});

// Open the first available input port.
input.openPort(0);

// Sysex, timing, and active sensing messages are ignored
input.ignoreTypes(false, false, false);
