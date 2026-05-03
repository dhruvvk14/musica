import { useEffect, useRef } from "react";
import { OpenSheetMusicDisplay, GraphicalNote } from "opensheetmusicdisplay";

interface OSMDProps {
  specialNotes: number[]; // Array of indices to color
  musicXML?: string | null;
  color: string;
}


export default function Sheet({ specialNotes, musicXML = null, color }: OSMDProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // We keep track of the instance to avoid unnecessary re-instantiation
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);

  useEffect(() => {
    if (!containerRef.current || !musicXML) return;

    // 1. Cleanup previous render to prevent duplicate canvases
    containerRef.current.innerHTML = "";

    // 2. Initialize OSMD
    const osmd = new OpenSheetMusicDisplay(containerRef.current, {
      autoResize: true,
      drawTitle: false,
      drawingParameters: "compacttight",
    });
    osmdRef.current = osmd;

    // 3. Load and Process
    (async () => {
      try {
        await osmd.load(musicXML);

        // 4. Colorize Notes BEFORE the final render
        // This is much faster than rendering -> coloring -> re-rendering
        let count = 0;
        
        for (const measureList of osmd.GraphicSheet.MeasureList) {
          for (const measure of measureList) {
            for (const staffEntry of measure.staffEntries) {
              for (const gve of staffEntry.graphicalVoiceEntries) {
                for (const note of gve.notes as GraphicalNote[]) {
                  
                  // Check if the current note index exists in your specialNotes array
                  if (specialNotes.includes(count)) {
                    const sourceNote = note.sourceNote;
                    sourceNote.NoteheadColor = color;
                    sourceNote.NoteheadColorCurrentlyRendered = color;
                  }
                  
                  count++;
                }
              }
            }
          }
        }

        // 5. Single Render Call
        osmd.render();
        
      } catch (e) {
        console.error("OSMD Render Error:", e);
      }
    })();

  }, [musicXML, specialNotes, color]); // Re-run if these props change

  return <div ref={containerRef} style={{ width: "100%" }} />;
}