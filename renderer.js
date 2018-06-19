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

// http://www.somascape.org/midi/basic/notes.html
const keys = [
  { id : 40, name : 'e0',  sharp: false, ledger: true, bass: true  },
  { id : 41, name : 'f0',  sharp: false, ledger: false, bass: true  },
  { id : 43, name : 'g0',  sharp: false, ledger: false, bass: true  },
  { id : 45, name : 'a1',  sharp: false, ledger: false, bass: true  },
  { id : 47, name : 'b1',  sharp: false, ledger: false, bass: true  },
  { id : 48, name : 'c1',  sharp: false, ledger: false, bass: true  },
  { id : 50, name : 'd1',  sharp: false, ledger: false, bass: true  },
  { id : 52, name : 'e1',  sharp: false, ledger: false, bass: true  },
  { id : 53, name : 'f1',  sharp: false, ledger: false, bass: true  },
  { id : 55, name : 'g1',  sharp: false, ledger: false, bass: true  },
  { id : 57, name : 'a2',  sharp: false, ledger: false, bass: true  },
  { id : 59, name : 'b2',  sharp: false, ledger: false, bass: true  },
  { id : 60, name : 'c3',  sharp: false, ledger: true,  bass: false },
  { id : 62, name : 'd3',  sharp: false, ledger: false, bass: false },
  { id : 64, name : 'e3',  sharp: false, ledger: false, bass: false },
  { id : 65, name : 'f3',  sharp: false, ledger: false, bass: false },
  { id : 67, name : 'g3',  sharp: false, ledger: false, bass: false },
  { id : 69, name : 'a3',  sharp: false, ledger: false, bass: false },
  { id : 71, name : 'b3',  sharp: false, ledger: false, bass: false },
  { id : 72, name : 'c4',  sharp: false, ledger: false, bass: false },
  { id : 73, name : 'c4s', sharp: true,  ledger: false, bass: false },
  { id : 74, name : 'd4',  sharp: false, ledger: false, bass: false },
  { id : 76, name : 'e4',  sharp: false, ledger: false, bass: false },
  { id : 77, name : 'f4',  sharp: false, ledger: false, bass: false },
  { id : 79, name : 'g4',  sharp: false, ledger: false, bass: false },
  { id : 81, name : 'a4',  sharp: false, ledger: true, bass: false },
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

    $('.live-g').empty();
    $('.live-f').empty();

    pressedKeys.forEach(k => {
      let keyFound = findKey(k);

      let live = (!keyFound.bass) ? $('.live-g') : $('.live-f');

      live.append('<span class="notecontainer"></span>');

      $( live ).children('.notecontainer').append(
        `<span class="note ${keyFound.name}">&#9833;</span>`
      );

      if (keyFound.ledger)
      {
        $( live ).children('.notecontainer').append(
          `<span class="ledgerline ${keyFound.name}" />`
          );
      }

    });
});

// Open the first available input port.
input.openPort(0);

// Sysex, timing, and active sensing messages are ignored
input.ignoreTypes(false, false, false);
