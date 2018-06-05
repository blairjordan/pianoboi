var {ipcRenderer, remote} = require('electron');  
var main = remote.require("./main.js");
var midi = require('midi');
window.$ = window.jQuery = require('jquery');

// Set up a new input.
var input = new midi.input();

// Count the available input ports.
var portCount = input.getPortCount();

console.log(`devices available: ${portCount}`);

// Get the name of a specified input port.
input.getPortName(0);

const keys = [
  { id : 60, name : 'c3' },
  { id : 62, name : 'd3' },
  { id : 64, name : 'e3' },
  { id : 65, name : 'f3' },
  { id : 67, name : 'g3' },
  { id : 69, name : 'a3' },
  { id : 71, name : 'b3' },
  { id : 72, name : 'c4' },
  { id : 73, name : 'c4s' },
  { id : 74, name : 'd4' },
  { id : 76, name : 'e4' },
  { id : 77, name : 'f4' },
  { id : 79, name : 'g4' },
];

let pressedKeys = [];

findKey = keyNo => {
  return keys.find((k) => {
    return k.id == keyNo;
  });
}

input.on('message', function(deltaTime, message) {
  // The message is an array of numbers corresponding to the MIDI bytes:
  //   [status, data1, data2]
  // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
  // information interpreting the messages.
  //console.log('m:' + message + ' d:' + deltaTime);
  console.log(message);

    // http://www.somascape.org/midi/basic/notes.html

    const keyEventMessage = 144;
    const middleC = 60;
    
    let messageType = message[0];
    let keyNo = message[1];
    let velocity = message[2];

    let currentKey = findKey(keyNo);
    
    // Key event for a defined key
    if (messageType == keyEventMessage
     && typeof currentKey !== 'undefined') {

      if (velocity > 0) { 
        if ( !( currentKey.id in keys ) ) {
          // Add
          pressedKeys.push(currentKey.id);
        }
      } else {
        // Remove
        pressedKeys.splice( pressedKeys.indexOf(currentKey.id), 1 );
      } 
    }
    
    pressedKeys.sort();

     $('.live')
      .empty()
      .append('<span class="notecontainer"></span>');

    pressedKeys.forEach(k => {
      $('.notecontainer').append(
      `<span class="note ${findKey(k).name}">&#9833;</span>`);
    });
});

// Open the first available input port.
input.openPort(0);

// Sysex, timing, and active sensing messages are ignored
input.ignoreTypes(false, false, false);
