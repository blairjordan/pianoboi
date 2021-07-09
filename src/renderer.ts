
import { ipcRenderer, remote } from 'electron';
import * as midi from 'jzz';
import { Note, Array, Chord } from 'tonal';
import * as Key from '@tonaljs/key'
import * as Vex from 'vexflow';

import { centerPiano, buildKeyboard, signatures, Signature, capitalize, KeyId, Accidental } from './';

let main = remote.require("./main.js");

window.$ = window.jQuery = require("jquery");

$(function() {
  const VF = Vex.Flow;
  const renderer = new VF.Renderer(
    document.getElementById("sheetmusic"),
    VF.Renderer.Backends.SVG
  );
  const context = renderer.getContext();

  let signature: Signature | undefined;
  let majorChords, minorChords;

  midi({engine:'webmidi'})
    .openMidiIn()
    .or("Cannot open MIDI In port!")
    .and(function() {
      console.log("MIDI-In: ", this.name());
    })
    .connect(e => handler(e));

  let keys: KeyId[] = [];

  renderer.resize(800, 600);

  const hasAccidental = (k: KeyId, a: Accidental) => k.substring(1, 2) == a;
  const findSignature = (id: string): Signature => signatures.find(s => s.id === id);
  const isNatural = (n: string, altered: string[]) =>
    n.substring(2, 3) !== `/` &&
    altered.map(a => a.substring(0, 1)).includes(n.substring(0, 1));

  // returns true if both sets of chords are identical
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
  };

  // m: array of chords (i.e., array of keys)
  // t: major or minor
  const listChords = (m, t) => {
    $(`.${t}chords`).html(`<th>${capitalize(t)}</th>`);
    m.forEach(c => {
      $(`.${t}chords`).append(`<td class="chord ${c}">${c}</td>`);
    });
  };

  // m: array of chords (i.e., array of keys)
  const highlightChords = (m: KeyId[]) => {
    m.forEach(c => {
      let n = Chord.notes(c);
      if (chordsEqual(n, keys.map(k => k.substring(0, k.length - 1)))) {
        $(`.chord.${c}`).addClass('highlight');
      }
    });
  };

  // format number of flats/ sharps in a given key signature
  const accidentalText = (s, t) => {
    let count = s[`${t}s`];
    if (count === 0) return "";
    return `(${count} ${t}${count > 1 ? 's' : ''})`;
  };

  // TODO: disambiguate "keys" (notes) from keySignatures
  const renderStave = ({ keys, signature }: { keys: KeyId[], signature: Signature }) => {
    // create a stave of width 400 at position 10, 40 on the canvas.
    const topStaff = new VF.Stave(30, 40, 130);
    const bottomStaff = new VF.Stave(30, 100, 130);

    const brace = new Vex.Flow.StaveConnector(topStaff, bottomStaff).setType(3);
    const lineRight = new Vex.Flow.StaveConnector(topStaff, bottomStaff).setType(6);
    const lineLeft = new Vex.Flow.StaveConnector(topStaff, bottomStaff).setType(1);

    topStaff.addClef("treble");
    bottomStaff.addClef("bass");
    topStaff.addKeySignature(signature.id).addTimeSignature("4/4");
    bottomStaff.addKeySignature(signature.id).addTimeSignature("4/4");

    const notes = {
      notesTreble: [],
      notesBass: []
    };

    let noteTreble = new VF.StaveNote({ keys: ["b/4"], duration: "qr" });
    let noteBass = new VF.StaveNote({ keys: ["b/4"], duration: "qr" });
    if (keys.length !== 0) {
      noteTreble = new VF.StaveNote({ clef: "treble", keys, duration: "q" });
      noteBass = new VF.StaveNote({ clef: "bass", keys, duration: "q" });
    }

    const flats = keys.map(k => hasAccidental(k, "b"));
    const sharps = keys.map(k => hasAccidental(k, "#"));

    const alteredNotes = Key.alteredNotes(`${signature.id} major`).map(n => n.toLowerCase());

    keys.forEach((k, i) => {
      if (!alteredNotes.includes(k.substring(0, 2))) {
        if (flats[i]) {
          noteTreble.addAccidental(i, new Vex.Flow.Accidental("b"));
          noteBass.addAccidental(i, new Vex.Flow.Accidental("b"));
        }
        if (sharps[i]) {
          noteTreble.addAccidental(i, new Vex.Flow.Accidental("#"));
          noteBass.addAccidental(i, new Vex.Flow.Accidental("#"));
        }
      }

      if (isNatural(k, alteredNotes)) {
        noteTreble.addAccidental(i, new Vex.Flow.Accidental("n"));
        noteBass.addAccidental(i, new Vex.Flow.Accidental("n"));
      }
    });

    notes.notesTreble.unshift(noteTreble);
    notes.notesBass.unshift(noteBass);

    let voiceTreble = new VF.Voice({
      num_beats: 1,
      beat_value: 4,
      resolution: Vex.Flow.RESOLUTION
    }).addTickables(notes.notesTreble);
    let voiceBass = new VF.Voice({
      num_beats: 1,
      beat_value: 4,
      resolution: Vex.Flow.RESOLUTION
    }).addTickables(notes.notesBass);

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
  };

  const mutateKeySignature = () => {
    signature = findSignature($("#signature").val());

    [majorChords, minorChords] = [
      Key.chords(`${signature.major} major`),
      Key.chords(`${signature.minor} minor`)
    ];

    listChords(majorChords, "major");
    listChords(minorChords, "minor");

    renderStave({ keys: [], signature });
  };

  signatures.forEach(s => {
    $("#signature").append(
      `<option value="${s.id}">${s.major} major / ${
        s.minor
      } minor ${accidentalText(s, "sharp") ||
        accidentalText(s, "flat")}</option>`
    );
  });

  $("#signature").on("change", function() {
    mutateKeySignature();
  });

  mutateKeySignature();

  const highlightPianoKeys = (keys: KeyId[]) => {
    $(".keys .key").removeClass("pressed");
    keys.forEach(k => {
      $(`*[data-keyno="${Note.midi(k)}"]`).addClass("pressed");
    });
  };

  const handler = e => {
    const currentKey = Note.fromMidi(e.getNote(), signature.sharps > 1);

    if ((e.isNoteOn() && e.getVelocity() > 0) && typeof currentKey !== "undefined") {
      if (!(currentKey in keys)) {
        keys.push(currentKey);
      }
    } else if ((e.isNoteOn() && e.getVelocity() == 0) || e.isNoteOff()) {
      keys.splice(keys.indexOf(currentKey), 1);
    }

    $(".chord").removeClass("highlight");
    highlightChords(majorChords);
    highlightChords(minorChords);
    highlightPianoKeys(keys);

    renderStave({
      keys: Array.sort(keys).map(
        k =>
          `${k.substring(0, k.search(/\d/)).toLowerCase()}/${k.substring(
            k.search(/\d/),
            k.length
          )}`
      ),
      signature
    });
  };

  buildKeyboard(".keys", 7, "black", 24);
  centerPiano("#piano", 84, 36);
});
