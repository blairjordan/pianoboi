var {ipcRenderer, remote} = require('electron');  
var main = remote.require("./main.js");
var midi = require('midi');
const keys = require('./keys.js');
const symbols = require('./symbols.js');
window.$ = window.jQuery = require('jquery');

// Set up a new input.
var input = new midi.input();

// Count the available input ports.
var portCount = input.getPortCount();

console.log(`devices available: ${portCount}`);

// Get the name of a specified input port.
input.getPortName(0);

let pressedKeys = [];

const findKey = keyNo => {
  return keys.find((k) => {
    return k.id === keyNo;
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
    
    let messageType = message[0];
    let keyNo = message[1];
    let velocity = message[2];

    let currentKey = findKey(keyNo);
    
    // Key event for a defined key
    if (messageType == keyEventMessage
      && typeof currentKey !== 'undefined') {

      if (velocity > 0) { 
        if ( !( currentKey.id in pressedKeys ) ) {
          // Add
          pressedKeys.push(currentKey.id);
        }
      } else {
        // Remove
        pressedKeys.splice( pressedKeys.indexOf(currentKey.id), 1 );
      } 
    }
    
    pressedKeys.sort();
    $('.live-g, .live-f').empty();

    pressedKeys.forEach(k => {
      let keyFound = findKey(k);

      let live = (!keyFound.bass) ? $('.live-g') : $('.live-f');

      live.append('<span class="notecontainer"></span>');

      $( live ).children('.notecontainer').append(
        `<span class="note ${keyFound.name}">&#9833;</span>`
      );
      
      symbols.forEach((s) => {
        if (keyFound[s.id]) {
          $( live ).children('.notecontainer').append(
            `<span class="${s.id} ${keyFound.name}">${s.symbol}</span>`
          );
        }
      });
    });
});

// Open the first available input port.
input.openPort(0);

// Sysex, timing, and active sensing messages are ignored
input.ignoreTypes(false, false, false);
