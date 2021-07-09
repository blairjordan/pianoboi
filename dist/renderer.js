var _a = require("electron"), ipcRenderer = _a.ipcRenderer, remote = _a.remote;
var main = remote.require("./main.js");
var midi = require("jzz");
var signatures = require("./signatures").signatures;
window.$ = window.jQuery = require("jquery");
var _b = require("tonal"), Note = _b.Note, Array = _b.Array, Chord = _b.Chord;
var Key = require("tonal-key");
var Vex = require("vexflow");
var _c = require("./piano"), centerPiano = _c.centerPiano, buildKeyboard = _c.buildKeyboard;
$(function () {
    var VF = Vex.Flow;
    var renderer = new VF.Renderer(document.getElementById("sheetmusic"), VF.Renderer.Backends.SVG);
    var context = renderer.getContext();
    var signature = {};
    var majorChords, minorChords;
    midi({ engine: 'webmidi' })
        .openMidiIn()
        .or("Cannot open MIDI In port!")
        .and(function () {
        console.log("MIDI-In: ", this.name());
    })
        .connect(function (e) { return handler(e); });
    var keys = [];
    renderer.resize(800, 600);
    var hasAccidental = function (k, a) { return k.substring(1, 2) == a; };
    var findSignature = function (id) { return signatures.find(function (s) { return s.id === id; }); };
    var capitalize = function (_a) {
        var first = _a[0], rest = _a.slice(1);
        return first.toUpperCase() + rest.join("").toLowerCase();
    };
    var isNatural = function (n, altered) {
        return n.substring(2, 3) !== "/" &&
            altered.map(function (a) { return a.substring(0, 1); }).includes(n.substring(0, 1));
    };
    // returns true if both sets of chords are identical
    var chordsEqual = function (a, b) {
        if (a === b)
            return true;
        if (a == null || b == null)
            return false;
        if (a.length != b.length)
            return false;
        a.sort();
        b.sort();
        for (var i = 0; i < a.length; ++i) {
            if (a[i] !== b[i])
                return false;
        }
        return true;
    };
    // m: array of chords (i.e., array of keys)
    // t: major or minor
    var listChords = function (m, t) {
        $("." + t + "chords").html("<th>" + capitalize(t) + "</th>");
        m.forEach(function (c) {
            $("." + t + "chords").append("<td class=\"chord " + c + "\">" + c + "</td>");
        });
    };
    // m: array of chords (i.e., array of keys)
    var highlightChords = function (m) {
        m.forEach(function (c) {
            var n = Chord.notes(c);
            if (chordsEqual(n, keys.map(function (k) { return k.substring(0, k.length - 1); }))) {
                $(".chord." + c).addClass("highlight");
            }
        });
    };
    // format number of flats/ sharps in a given key signature
    var accidentalText = function (s, t) {
        var count = s[t + "s"];
        if (count === 0)
            return "";
        return "(" + count + " " + t + (count > 1 ? "s" : "") + ")";
    };
    // TODO: disambiguate "keys" (notes) from keySignatures
    var renderStave = function (_a) {
        var keys = _a.keys, signature = _a.signature;
        // create a stave of width 400 at position 10, 40 on the canvas.
        var topStaff = new VF.Stave(30, 40, 130);
        var bottomStaff = new VF.Stave(30, 100, 130);
        var brace = new Vex.Flow.StaveConnector(topStaff, bottomStaff).setType(3);
        var lineRight = new Vex.Flow.StaveConnector(topStaff, bottomStaff).setType(6);
        var lineLeft = new Vex.Flow.StaveConnector(topStaff, bottomStaff).setType(1);
        topStaff.addClef("treble");
        bottomStaff.addClef("bass");
        topStaff.addKeySignature(signature.id).addTimeSignature("4/4");
        bottomStaff.addKeySignature(signature.id).addTimeSignature("4/4");
        var notes = {
            notesTreble: [],
            notesBass: []
        };
        var noteTreble = new VF.StaveNote({ keys: ["b/4"], duration: "qr" });
        var noteBass = new VF.StaveNote({ keys: ["b/4"], duration: "qr" });
        if (keys.length !== 0) {
            noteTreble = new VF.StaveNote({ clef: "treble", keys: keys, duration: "q" });
            noteBass = new VF.StaveNote({ clef: "bass", keys: keys, duration: "q" });
        }
        var flats = keys.map(function (k) { return hasAccidental(k, "b"); });
        var sharps = keys.map(function (k) { return hasAccidental(k, "#"); });
        var alteredNotes = Key.alteredNotes(signature.id + " major").map(function (n) { return n.toLowerCase(); });
        keys.forEach(function (k, i) {
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
        var voiceTreble = new VF.Voice({
            num_beats: 1,
            beat_value: 4,
            resolution: Vex.Flow.RESOLUTION
        }).addTickables(notes.notesTreble);
        var voiceBass = new VF.Voice({
            num_beats: 1,
            beat_value: 4,
            resolution: Vex.Flow.RESOLUTION
        }).addTickables(notes.notesBass);
        var formatter = new VF.Formatter()
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
    var updateKeySignature = function () {
        var _a;
        signature = findSignature($("#signature").val());
        _a = [
            Key.chords(signature.major + " major"),
            Key.chords(signature.minor + " minor")
        ], majorChords = _a[0], minorChords = _a[1];
        listChords(majorChords, "major");
        listChords(minorChords, "minor");
        renderStave({ keys: [], signature: signature });
    };
    signatures.forEach(function (s) {
        $("#signature").append("<option value=\"" + s.id + "\">" + s.major + " major / " + s.minor + " minor " + (accidentalText(s, "sharp") ||
            accidentalText(s, "flat")) + "</option>");
    });
    $("#signature").on("change", function () {
        updateKeySignature();
    });
    updateKeySignature();
    var highlightPianoKeys = function (keys) {
        $(".keys .key").removeClass("pressed");
        keys.forEach(function (k) {
            $("*[data-keyno=\"" + Note.midi(k) + "\"]").addClass("pressed");
        });
    };
    var handler = function (e) {
        var currentKey = Note.fromMidi(e.getNote(), signature.sharps > 1);
        if ((e.isNoteOn() && e.getVelocity() > 0) && typeof currentKey !== "undefined") {
            if (!(currentKey in keys)) {
                keys.push(currentKey);
            }
        }
        else if ((e.isNoteOn() && e.getVelocity() == 0) || e.isNoteOff()) {
            keys.splice(keys.indexOf(currentKey), 1);
        }
        $(".chord").removeClass("highlight");
        highlightChords(majorChords);
        highlightChords(minorChords);
        highlightPianoKeys(keys);
        renderStave({
            keys: Array.sort(keys).map(function (k) {
                return k.substring(0, k.search(/\d/)).toLowerCase() + "/" + k.substring(k.search(/\d/), k.length);
            }),
            signature: signature
        });
    };
    buildKeyboard(".keys", 7, "black", 24);
    centerPiano("#piano", 84, 36);
});
//# sourceMappingURL=renderer.js.map