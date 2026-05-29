import { WebMidi, NoteMessageEvent, Note } from "webmidi"
import { Chord, Key } from "@tonaljs/tonal"
import * as Vex from "vexflow"
import * as $ from "jquery"

import {
  centerPiano,
  buildKeyboard,
  signatures,
  Signature,
  capitalize,
  KeyId,
  Accidental,
} from "./"

$(function () {
  const VF = Vex.Flow
  const renderer = new VF.Renderer(
    document.getElementById("sheetmusic") as HTMLDivElement,
    VF.Renderer.Backends.SVG
  )
  const context = renderer.getContext()

  let signature: Signature | undefined

  let [majorChords, minorChords]: [string[], string[]] = [[], []]

  // Function triggered when WEBMIDI.js is ready
  const onEnabled = () => {
    console.log("enabled")
    // Display available MIDI input devices
    console.log(WebMidi.inputs)

    // FIXME: Fetch from device manager
    const device = WebMidi.inputs[1]

    if (!device) {
      console.error("🤷‍♂️ No device found")
      return
    }

    device.channels[1].addListener("noteon", (event) =>
      noteEventHandler({ event })
    )

    device.channels[1].addListener("noteoff", (event) =>
      noteEventHandler({ event })
    )
  }

  WebMidi.enable()
    .then(onEnabled)
    .catch((err: any) => alert(err))

  let notes: Note[] = []

  renderer.resize(800, 600)

  const hasAccidental = (k: KeyId, a: Accidental) => k.substring(1, 2) == a
  const findSignature = ({ id }: { id: string }): Signature =>
    signatures.find((s) => s.id === id)

  const isNatural = (n: string, altered: string[]) =>
    n.substring(2, 3) !== `/` &&
    altered.map((a) => a.substring(0, 1)).includes(n.substring(0, 1))

  // returns true if both sets of chords are identical
  // FIXME: fix typing here. unsure what type to use for chords
  const chordsEqual = (a: any, b: any) => {
    if (a === b) return true
    if (a == null || b == null) return false
    if (a.length != b.length) return false
    a.sort()
    b.sort()
    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false
    }
    return true
  }

  const listChords = ({
    chords,
    type,
  }: {
    chords: string[]
    type: "major" | "minor"
  }): void => {
    $(`.${type}chords`).html(`<th>${capitalize(type)}</th>`)
    chords.forEach((chord) => {
      $(`.${type}chords`).append(`<td class="chord ${chord}">${chord}</td>`)
    })
  }

  // m: array of chords (i.e., array of keys)
  const highlightChords = (m: KeyId[]) => {
    m.forEach((c) => {
      const notes = Chord.get(c).notes

      console.log(notes)
      if (
        chordsEqual(
          notes,
          notes.map((k) => k.substring(0, k.length - 1))
        )
      ) {
        $(`.chord.${c}`).addClass("highlight")
      }
    })
  }

  // format number of flats/ sharps in a given key signature
  const accidentalText = ({
    signature,
    type,
  }: {
    signature: Signature
    type: keyof Signature
  }): string => {
    const count = signature[type] as number
    return count === 0
      ? ""
      : `(${count} ${type.replace(/s$/, "")}${count > 1 ? "s" : ""})`
  }

  //TODO: disambiguate "keys" (notes) from keySignatures
  const renderStave = ({
    keys,
    signature,
  }: {
    keys: KeyId[]
    signature: Signature
  }) => {
    // create a stave of width 400 at position 10, 40 on the canvas.
    const topStaff = new VF.Stave(30, 40, 130)
    const bottomStaff = new VF.Stave(30, 100, 130)

    const brace = new Vex.Flow.StaveConnector(topStaff, bottomStaff).setType(3)
    const lineRight = new Vex.Flow.StaveConnector(
      topStaff,
      bottomStaff
    ).setType(6)
    const lineLeft = new Vex.Flow.StaveConnector(topStaff, bottomStaff).setType(
      1
    )

    topStaff.addClef("treble")
    bottomStaff.addClef("bass")
    topStaff.addKeySignature(signature.id).addTimeSignature("4/4")
    bottomStaff.addKeySignature(signature.id).addTimeSignature("4/4")

    //   // FIXME: typings
    const notes = {
      notesTreble: [] as any[],
      notesBass: [] as any[],
    }

    let noteTreble = new VF.StaveNote({ keys: ["b/4"], duration: "qr" })
    let noteBass = new VF.StaveNote({ keys: ["b/4"], duration: "qr" })

    if (keys.length !== 0) {
      noteTreble = new VF.StaveNote({ clef: "treble", keys, duration: "q" })
      noteBass = new VF.StaveNote({ clef: "bass", keys, duration: "q" })
    }

    const flats = keys.map((k) => hasAccidental(k, "b"))
    const sharps = keys.map((k) => hasAccidental(k, "#"))

    const alteredNotes = Key.majorKey(`${signature.id}`).scale.map((n) =>
      n.toLowerCase()
    )

    // FIXME: Currently broken
    keys.forEach((k, i) => {
      console.log(k)
      if (!alteredNotes.includes(k.substring(0, 2))) {
        if (flats[i]) {
          noteTreble.addModifier(new Vex.Flow.Accidental("b"), i)
          noteBass.addModifier(new Vex.Flow.Accidental("b"), i)
        }
        if (sharps[i]) {
          noteTreble.addModifier(new Vex.Flow.Accidental("#"), i)
          noteBass.addModifier(new Vex.Flow.Accidental("#"), i)
        }
      }

      if (isNatural(k, alteredNotes)) {
        console.log("natural")
        noteTreble.addModifier(new Vex.Flow.Accidental("n"), i)
        noteBass.addModifier(new Vex.Flow.Accidental("n"), i)
      }
    })

    notes.notesTreble.unshift(noteTreble)
    notes.notesBass.unshift(noteBass)

    const voiceTreble = new VF.Voice({
      num_beats: 1,
      beat_value: 4,
      resolution: Vex.Flow.RESOLUTION,
    }).addTickables(notes.notesTreble)

    const voiceBass = new VF.Voice({
      num_beats: 1,
      beat_value: 4,
      resolution: Vex.Flow.RESOLUTION,
    }).addTickables(notes.notesBass)

    new VF.Formatter()
      .joinVoices([voiceTreble])
      .format([voiceTreble], 400)
      .joinVoices([voiceBass])
      .format([voiceBass], 400)

    context.clear()
    topStaff.setContext(context).draw()
    brace.setContext(context).draw()
    lineRight.setContext(context).draw()
    lineLeft.setContext(context).draw()
    bottomStaff.setContext(context).draw()

    voiceTreble.draw(context, topStaff)
    voiceBass.draw(context, bottomStaff)
  }

  const mutateKeySignature = () => {
    signature = findSignature({ id: $("#signature").val() as string })
    ;[majorChords, minorChords] = [
      Key.majorKey(`${signature.major}`).chords as string[],
      Key.minorKey(`${signature.minor}`).natural.chords as string[],
    ]

    listChords({ chords: majorChords, type: "major" })
    listChords({ chords: minorChords, type: "minor" })

    renderStave({ keys: [], signature })
  }

  signatures.forEach((signature) => {
    $("#signature").append(
      `<option value="${signature.id}">${signature.major} major / ${
        signature.minor
      } minor ${
        accidentalText({ signature, type: "sharps" }) ||
        accidentalText({ signature, type: "flats" })
      }</option>`
    )
  })

  $("#signature").on("change", function () {
    mutateKeySignature()
  })

  mutateKeySignature()

  const highlightPianoKeys = (keys: number[]) => {
    $(".keys .key").removeClass("pressed")
    keys.forEach((k) => {
      $(`*[data-keyno="${k}"]`).addClass("pressed")
    })
  }

  const noteEventHandler = ({ event }: { event: NoteMessageEvent }) => {
    const eventNote = event.note

    if (event.type === "noteon" && event.rawValue > 0) {
      if (!notes.some((note) => note.number === eventNote.number)) {
        notes.push(eventNote)
      }
    } else if (
      (event.type === "noteon" && event.rawValue == 0) ||
      event.type === "noteoff"
    ) {
      notes = notes.filter((note) => note.number !== eventNote.number)
    }

    $(".chord").removeClass("highlight")

    highlightChords(majorChords)
    highlightChords(minorChords)
    highlightPianoKeys(notes.map((note) => note.number))

    renderStave({
      keys: notes.map(
        (eventNote) =>
          // Format notes for VF
          `${eventNote.name}${eventNote.accidental || ""}/${eventNote.octave}`
      ),
      signature,
    })
  }

  buildKeyboard({
    selector: ".keys",
    octaveCount: 7,
    modifier: "black",
    initialKey: 24,
  })

  centerPiano({
    selector: "#piano",
    totalWidth: 84,
    currentPosition: 36,
  })
})
