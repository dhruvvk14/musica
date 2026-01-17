declare module "react-piano" {
  import * as React from "react";

  export interface NoteRange {
    first: number;
    last: number;
  }

  export interface KeyboardShortcuts {
    create: (options: { firstNote: number; lastNote: number; keyboardConfig?: any }) => any;
    HOME_ROW: any;
  }

  export interface PianoProps {
    noteRange: NoteRange;
    playNote: (midiNumber: number) => void;
    stopNote: (midiNumber: number) => void;
    width: number;
    keyboardShortcuts?: any;
    renderNoteLabel?: (midiNumber: number) => React.ReactNode;
  }

  export const Piano: React.FC<PianoProps>;
  export const KeyboardShortcuts: KeyboardShortcuts;
  export const MidiNumbers: {
    fromNote: (note: string) => number;
  };
}
