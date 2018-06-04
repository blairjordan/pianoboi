// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

var {ipcRenderer, remote} = require('electron');  
var main = remote.require("./main.js");
var midi = require('midi');
window.$ = window.jQuery = require('jquery');

// Set up a new input.
var input = new midi.input();

// Count the available input ports.
var portCount = input.getPortCount();

console.log(portCount);

// Get the name of a specified input port.
input.getPortName(0);

// Configure a callback.
input.on('message', function(deltaTime, message) {
  // The message is an array of numbers corresponding to the MIDI bytes:
  //   [status, data1, data2]
  // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
  // information interpreting the messages.
  //console.log('m:' + message + ' d:' + deltaTime);
  console.log(message);

    //message[1]);

    // http://www.somascape.org/midi/basic/notes.html

    const keyPressMessage = 144;
    const middleC = 60;
    
    let messageType = message[0];
    let keyNo = message[1];
    let velocity = message[2];

    //let k = (keyNo - middleC) * 0.35;

    const keys = [
      { 'id': 60, 'name' : 'c3' },
      { 'id' : 62, 'name' : 'd3' },
      { 'id' : 64, 'name' : 'e3' },
      { 'id' : 65, 'name' : 'f3' },
      { 'id' : 67, 'name' : 'g3' },
      { 'id' : 69, 'name' : 'a3' },
      { 'id' : 71, 'name' : 'b3' },
      { 'id' : 72, 'name' : 'c4' },
      { 'id' : 74, 'name' : 'd4' },
      { 'id' : 76, 'name' : 'e4' },
      { 'id' : 77, 'name' : 'f4' },
      { 'id' : 79, 'name' : 'g4' },
    ];

    let key = keys.find((k) => {
      return k.id == keyNo;
    });
    
       // Key press
       if (velocity > 0 
        && messageType == keyPressMessage
        && typeof key !== 'undefined') {

        $('#live').append(
              `<span class="note ${key.name}">&#9833;</span>`);
            
       } else {
         // remove to keep notes
        $('#live').empty();
       }
});

// Open the first available input port.
input.openPort(0);

// Sysex, timing, and active sensing messages are ignored
// by default. To enable these message types, pass false for
// the appropriate type in the function below.
// Order: (Sysex, Timing, Active Sensing)
// For example if you want to receive only MIDI Clock beats
// you should use
// input.ignoreTypes(true, false, true)
input.ignoreTypes(false, false, false);
