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

    let keyNo = message[1];
    let middleC = 60;

    let k = (keyNo - middleC) * 0.35;

       // Key press
       if (message[2] > 0) {
        $('#live').append(
            '<span class="note" style="bottom: '+k+'rem;">&#9833;</span>');
           
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
