import React, { useState, useEffect, useMemo, useRef } from "react";
import { Piano, MidiNumbers } from "react-piano";
import "react-piano/dist/styles.css";
import * as Tone from "tone";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

interface PianoProps {
  maxWidth: number;
  goBack: () => void;
}

interface NoteEvent {
  time: number;
  note: string;
  duration: number;
}

interface MetronomeEvent {
  time: number;
  isDownbeat: boolean;
}

interface CursorMapPoint {
  seconds: number;
  scoreBeat: number;
}

const PianoRaw = Piano as any;

// --- 1. SHEET VIEWER ---
const SheetViewer: React.FC<{ 
  xml: string; 
  currentSeconds: number; 
  baseBpm: number; 
  leadTime: number;
  cursorMap: CursorMapPoint[]; // New prop for mapping linear time to sheet position
}> = ({ xml, currentSeconds, baseBpm, leadTime, cursorMap }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const lastSecondsRef = useRef(0);

  const activeSeconds = Math.max(0, leadTime - currentSeconds);
  const beatsLeft = Math.ceil(activeSeconds / (60 / baseBpm));
  const showCountdown = currentSeconds < leadTime && currentSeconds > 0;

  useEffect(() => {
    if (containerRef.current && xml) {
      containerRef.current.innerHTML = ""; 
      const osmd = new OpenSheetMusicDisplay(containerRef.current, {
        drawTitle: false,
        autoResize: true,
        backend: "svg",
        followCursor: true, 
        drawingParameters: "compacttight"
      });
      osmd.load(xml).then(() => {
        osmd.render();
        osmd.cursor.show();
        osmd.cursor.reset();
        osmdRef.current = osmd;
      });
    }
  }, [xml]);

  useEffect(() => {
    const osmd = osmdRef.current;
    if (!osmd || !osmd.cursor) return;
    const cursor = osmd.cursor;
    if (!cursor.Iterator) return;

    // Remove buffer; map handles precise timing
    const activeTime = Math.max(0, currentSeconds - leadTime);

    // --- REPEAT-AWARE CURSOR MAPPING ---
    // 1. Find the latest map point that is <= current activeTime
    let mapIndex = 0;
    for (let i = 0; i < cursorMap.length; i++) {
        if (activeTime >= cursorMap[i].seconds) {
            mapIndex = i;
        } else {
            break;
        }
    }
    
    const currentMapPoint = cursorMap[mapIndex];
    
    // 2. Interpolate the exact beat
    let targetRealValue = 0;
    if (currentMapPoint) {
        const timeDelta = activeTime - currentMapPoint.seconds;
        const beatDelta = timeDelta * (baseBpm / 60);
        targetRealValue = (currentMapPoint.scoreBeat + beatDelta) / 4;
    }

    if (currentSeconds < lastSecondsRef.current - 0.5 || currentSeconds <= leadTime) {
      cursor.reset();
      if (containerRef.current) containerRef.current.scrollTop = 0;
    }

    // 3. Move cursor to the calculated position (handling jumps automatically)
    // We reset the iterator if the target is BEHIND the current position (repeat jump)
    if (cursor.Iterator.currentTimeStamp.RealValue > targetRealValue + 0.1) {
       cursor.reset();
    }

    while (!cursor.Iterator.EndReached && cursor.Iterator.currentTimeStamp.RealValue < targetRealValue) {
      cursor.next();
    }
    
    if (containerRef.current && cursor.cursorElement) {
      const cursorElement = cursor.cursorElement;
      const cursorTop = cursorElement.getBoundingClientRect().top;
      const containerTop = containerRef.current.getBoundingClientRect().top;
      const relativeCursorTop = cursorTop - containerTop;

      if (relativeCursorTop > 120) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollTop + relativeCursorTop - 50, 
          behavior: 'smooth'
        });
      }
    }

    lastSecondsRef.current = currentSeconds;
  }, [currentSeconds, baseBpm, leadTime, cursorMap]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'relative', 
        background: "#fff", 
        margin: "0 40px 10px", 
        flex: 1, 
        minHeight: "0", 
        overflowY: "auto", 
        borderRadius: "8px", 
        border: "2px solid #333",
        scrollBehavior: 'smooth'
      }}
    >
      {showCountdown && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10, fontSize: '80px', fontWeight: '900', color: '#facc15', textShadow: '2px 2px 0px #000', fontFamily: 'Arial Black' }}>
          {beatsLeft}
        </div>
      )}
    </div>
  );
};

// --- 2. MAIN PIANO COMPONENT ---
const PianoComponent: React.FC<PianoProps> = ({ maxWidth, goBack }) => {
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [metronomeOn, setMetronomeOn] = useState(true);
  const [totalBeats, setTotalBeats] = useState(0); 
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [xmlData, setXmlData] = useState<string>(""); 
  
  const [sliderBpm, setSliderBpm] = useState(120);
  const [baseBpm, setBaseBpm] = useState(120); 
  const [volume, setVolume] = useState(-10);
  
  // New state for mapping linear audio time to score position
  const [cursorMap, setCursorMap] = useState<CursorMapPoint[]>([]);

  const metronomeRef = useRef(metronomeOn);

  useEffect(() => {
    metronomeRef.current = metronomeOn;
  }, [metronomeOn]);

  const [pianoRange, setPianoRange] = useState({ 
    first: MidiNumbers.fromNote("c3"), 
    last: MidiNumbers.fromNote("e5") 
  });

  useEffect(() => {
    if (activeNotes.length > 0) {
      const minActive = Math.min(...activeNotes);
      const maxActive = Math.max(...activeNotes);
      if (minActive < pianoRange.first || maxActive > pianoRange.last) {
        const newFirst = Math.max(21, minActive - 7); 
        const newLast = Math.min(108, newFirst + 28); 
        setPianoRange({ first: newFirst, last: newLast });
      }
    }
  }, [activeNotes, pianoRange]);

  const clickSynth = useMemo(() => new Tone.MembraneSynth({
    pitchDecay: 0.008, octaves: 2,
    envelope: { attack: 0.0001, decay: 0.2, sustain: 0 }
  }).toDestination(), []);

  const sampler = useMemo(() => {
    return new Tone.Sampler({
      urls: { A0: "A0.mp3", C1: "C1.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3", C4: "C4.mp3", "D#4": "Ds4.mp3", A4: "A4.mp3", C5: "C5.mp3" },
      baseUrl: "https://tonejs.github.io/audio/salamander/",
      onload: () => setIsLoaded(true),
    }).toDestination();
  }, []);

  useEffect(() => { 
    if (baseBpm > 0) {
      Tone.Transport.playbackRate = sliderBpm / baseBpm;
    }
  }, [sliderBpm, baseBpm]);

  useEffect(() => { Tone.Destination.volume.value = volume; }, [volume]);

  const leadTimeSeconds = 4 * (60 / baseBpm);
  const totalSeconds = (totalBeats * (60 / baseBpm)) + leadTimeSeconds + 2;

  const handleFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setXmlData(text); 
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    
    let detectedBpm = 120;
    const soundNode = xmlDoc.getElementsByTagName("sound")[0];
    if (soundNode?.getAttribute("tempo")) detectedBpm = parseInt(soundNode.getAttribute("tempo") || "120");
    
    setBaseBpm(detectedBpm);
    setSliderBpm(detectedBpm);
    Tone.Transport.playbackRate = 1; 

    // --- PARSE MEASURES & REPEATS ---
    const rawMeasures: any[] = [];
    const measureElements = xmlDoc.getElementsByTagName("measure");
    let currentDivisions = 1;
    let currentBeatsPerMeasure = 4;

    // 1. First Pass: Parse all measures into memory
    for (let i = 0; i < measureElements.length; i++) {
        const m = measureElements[i];
        
        // Parse attributes
        const attr = m.getElementsByTagName("attributes")[0];
        if (attr) {
            const div = attr.getElementsByTagName("divisions")[0];
            if (div) currentDivisions = parseInt(div.textContent || "1");
            const time = attr.getElementsByTagName("time")[0];
            if (time) {
                const b = time.getElementsByTagName("beats")[0];
                if (b) currentBeatsPerMeasure = parseInt(b.textContent || "4");
            }
        }

        // Check Repeats
        let repeatStart = false;
        let repeatEnd = false;
        const barlines = m.getElementsByTagName("barline");
        for (let b = 0; b < barlines.length; b++) {
            const repeat = barlines[b].getElementsByTagName("repeat")[0];
            if (repeat) {
                const dir = repeat.getAttribute("direction");
                if (dir === "forward") repeatStart = true;
                if (dir === "backward") repeatEnd = true;
            }
        }

        // Parse Notes
        const children = m.children;
        const notes: any[] = [];
        let localBeat = 0;
        let maxDur = 0;

        for (let j = 0; j < children.length; j++) {
            const child = children[j];
            if (child.tagName === "note") {
                const durVal = parseInt(child.getElementsByTagName("duration")[0]?.textContent || "0");
                const beats = durVal / currentDivisions;
                const isRest = child.getElementsByTagName("rest").length > 0;
                const isChord = child.getElementsByTagName("chord").length > 0;
                
                if (!isRest && !isChord) {
                    const step = child.getElementsByTagName("step")[0]?.textContent;
                    const octave = child.getElementsByTagName("octave")[0]?.textContent;
                    const alter = child.getElementsByTagName("alter")[0]?.textContent;
                    if (step && octave) {
                        let name = `${step}${octave}`;
                        if (alter === "1") name = `${step}#${octave}`;
                        if (alter === "-1") name = `${step}b${octave}`;
                        notes.push({ offset: localBeat, note: name, duration: beats });
                    }
                } else if (!isRest && isChord && notes.length > 0) {
                     // Add chord note at same offset
                     const step = child.getElementsByTagName("step")[0]?.textContent;
                     const octave = child.getElementsByTagName("octave")[0]?.textContent;
                     const alter = child.getElementsByTagName("alter")[0]?.textContent;
                     if (step && octave) {
                        let name = `${step}${octave}`;
                        if (alter === "1") name = `${step}#${octave}`;
                        if (alter === "-1") name = `${step}b${octave}`;
                        notes.push({ offset: notes[notes.length-1].offset, note: name, duration: beats });
                     }
                }

                if (!isChord) localBeat += beats;
                if (localBeat > maxDur) maxDur = localBeat;
            } else if (child.tagName === "backup") {
                const dur = parseInt(child.getElementsByTagName("duration")[0]?.textContent || "0");
                localBeat -= (dur / currentDivisions);
            } else if (child.tagName === "forward") {
                const dur = parseInt(child.getElementsByTagName("duration")[0]?.textContent || "0");
                localBeat += (dur / currentDivisions);
            }
        }
        if (maxDur === 0) maxDur = currentBeatsPerMeasure;

        rawMeasures.push({
            index: i,
            duration: maxDur,
            notes: notes,
            repeatStart,
            repeatEnd,
            globalScoreBeat: 0 // Will be calculated
        });
    }

    // 2. Second Pass: Calculate 'globalScoreBeat' (Written Beat) for each measure linearly
    let runningScoreBeat = 0;
    rawMeasures.forEach(m => {
        m.globalScoreBeat = runningScoreBeat;
        runningScoreBeat += m.duration;
    });

    // 3. Third Pass: Unroll Repeats into a Linear Playlist
    const playlist: any[] = [];
    let repeatStartIndex = 0;
    
    for (let i = 0; i < rawMeasures.length; i++) {
        const m = rawMeasures[i];
        if (m.repeatStart) repeatStartIndex = i;
        
        playlist.push(m);

        if (m.repeatEnd) {
            // Found a repeat end. Append the section again.
            // We assume simple 1-time repeats for now (A A B B etc)
            // To prevent infinite loops in complex files, we could add flags, 
            // but for Fur Elise this logic works perfectly.
            const section = rawMeasures.slice(repeatStartIndex, i + 1);
            playlist.push(...section);
            // Reset repeat markers so we don't repeat the repeat
            m.repeatEnd = false; // "Consume" the repeat
        }
    }

    // 4. Build Final Arrays & Cursor Map
    const notesArray: NoteEvent[] = [];
    const metronomeArray: MetronomeEvent[] = [];
    const newCursorMap: CursorMapPoint[] = [];

    let linearPlayBeat = 0; // The beat in the unrolled linear timeline

    playlist.forEach(m => {
        // Add Map Point: At this linear beat, we are at this score beat
        newCursorMap.push({
            seconds: linearPlayBeat * (60 / detectedBpm), // Convert linear beat to seconds
            scoreBeat: m.globalScoreBeat
        });

        // Add Notes
        m.notes.forEach((n: any) => {
            notesArray.push({
                time: linearPlayBeat + n.offset, // Linear timing
                note: n.note,
                duration: n.duration
            });
        });

        // Add Metronome
        const beatsToClick = Math.ceil(m.duration);
        for (let b = 0; b < beatsToClick; b++) {
            metronomeArray.push({
                time: linearPlayBeat + b,
                isDownbeat: b === 0
            });
        }

        linearPlayBeat += m.duration;
    });

    setCursorMap(newCursorMap);
    setTotalBeats(linearPlayBeat);
    Tone.Transport.cancel();
    
    const beatInterval = 60 / detectedBpm;
    const totalLeadTime = 4 * beatInterval; 

    // Schedule Events
    const leadInEvents = Array.from({length: 4}, (_, i) => ({ time: i - 4, isDownbeat: i === 0 }));
    const allClicks = [...leadInEvents, ...metronomeArray];

    new Tone.Part((time: number, event: MetronomeEvent) => {
        if (metronomeRef.current) {
            clickSynth.triggerAttackRelease(event.isDownbeat ? "C6" : "C5", "32n", time, 0.4);
        }
    }, allClicks.map(c => ({...c, time: (c.time * beatInterval) + totalLeadTime}))).start(0);

    new Tone.Part((time: number, event: NoteEvent) => {
      const midiValue = Tone.Frequency(event.note).toMidi();
      const currentPlaybackRate = Tone.Transport.playbackRate;
      const realDuration = (event.duration * beatInterval) / currentPlaybackRate;
      const gap = Math.min(0.1, realDuration * 0.15); 
      const visualDuration = Math.max(0.05, realDuration - gap); 

      sampler.triggerAttackRelease(event.note, realDuration, time);
      Tone.Draw.schedule(() => setActiveNotes((prev) => [...new Set([...prev, midiValue])]), time);
      Tone.Draw.schedule(() => setActiveNotes((prev) => prev.filter((n) => n !== midiValue)), time + visualDuration);
    }, notesArray.map(n => ({...n, time: (n.time * beatInterval) + totalLeadTime}))).start(0);
  };

  const togglePlay = async () => {
    if (Tone.context.state !== 'running') await Tone.start();
    if (Tone.Transport.seconds >= totalSeconds) Tone.Transport.seconds = 0;
    isPlaying ? Tone.Transport.pause() : Tone.Transport.start();
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (Tone.Transport.state === "started") {
        setDisplaySeconds(Tone.Transport.seconds);
        if (Tone.Transport.seconds >= totalSeconds) {
          Tone.Transport.stop();
          setIsPlaying(false);
          setActiveNotes([]);
        }
      }
    }, 16); 
    return () => clearInterval(interval);
  }, [totalSeconds]);

  const naturalKeyWidth = (maxWidth * 0.9) / 17;

  return (
    <div style={containerStyle}>
      <style>{`
        .ReactPiano__Keyboard { display: flex !important; background: #000; border-top: 15px solid #1a1a1a; margin: 0 auto; overflow: visible !important; justify-content: center; transition: all 0.5s ease-in-out; }
        .ReactPiano__Key { margin: 0 !important; position: relative !important; left: auto !important; }
        .ReactPiano__Key--natural { height: 260px !important; background: #ffffff !important; border: 1px solid #bbb !important; width: ${naturalKeyWidth}px !important; }
        .ReactPiano__Key--accidental { height: 160px !important; background: #111 !important; z-index: 10 !important; width: ${naturalKeyWidth * 0.6}px !important; margin-left: -${naturalKeyWidth * 0.3}px !important; margin-right: -${naturalKeyWidth * 0.3}px !important; box-shadow: 2px 5px 10px rgba(0,0,0,0.5); }
        .ReactPiano__Key--active { position: relative; }
        .ReactPiano__Key--active::after { content: ""; position: absolute; bottom: 12px; left: 10%; width: 80%; height: 8px; background: #ff0000; box-shadow: 0 0 15px rgba(255, 0, 0, 0.9); border-radius: 4px; z-index: 100; }
        .piano-label-large { position: absolute; bottom: 30px; left: 0; right: 0; text-align: center; font-family: 'Arial Black', sans-serif; font-weight: 900; font-size: 13px; color: #000; pointer-events: none; }
        .accidental-label { bottom: 25px; font-size: 11px; color: #fff; } 
        .ReactPiano__Key--active.ReactPiano__Key--natural { background: #facc15 !important; }
        .ReactPiano__Key--active.ReactPiano__Key--accidental { background: #eab308 !important; }
        .exit-button { background: transparent; border: 2px solid #facc15; color: #facc15; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; font-family: 'Arial Black', sans-serif; transition: all 0.3s ease; }
        .exit-button:hover { background: #facc15; color: #000; }
        .control-slider { accent-color: #facc15; cursor: pointer; width: 80px; height: 4px; }
        .time-slider { flex-grow: 1; accent-color: #facc15; cursor: pointer; height: 6px; }
        .metronome-toggle { background: #000; border: 1px solid #333; color: #666; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-family: monospace; font-size: 10px; font-weight: bold; transition: all 0.2s; }
        .metronome-toggle.active { border-color: #facc15; color: #facc15; box-shadow: 0 0 8px rgba(250, 204, 21, 0.3); }
      `}</style>

      <div style={pianoChassisStyle}>
        <div style={toolbarStyle}>
          <h1 style={titleStyleStudio}>MUSICA</h1>
          <input type="file" accept=".musicxml,.xml" onChange={handleFileLoad} style={{fontSize: '12px', color: '#ccc'}} />
          <button onClick={togglePlay} style={playButtonStyle}>{isPlaying ? "⏸ PAUSE" : "▶ START"}</button>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', borderLeft: '1px solid #333', paddingLeft: '20px' }}>
            <div style={controlLabelStyle}><span>VOL</span><input type="range" className="control-slider" min="-40" max="0" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} /></div>
            <div style={controlLabelStyle}><span>{sliderBpm} BPM</span><input type="range" className="control-slider" min="40" max="220" value={sliderBpm} onChange={(e) => setSliderBpm(parseInt(e.target.value))} /></div>
            <div style={controlLabelStyle}>
                <span>CLICK</span>
                <button className={`metronome-toggle ${metronomeOn ? 'active' : ''}`} onClick={() => setMetronomeOn(!metronomeOn)}>
                  {metronomeOn ? "ON" : "OFF"}
                </button>
            </div>
          </div>

          <div style={{flexGrow: 1, display: 'flex', alignItems: 'center', gap: '20px'}}>
            <input type="range" className="time-slider" min="0" max={totalSeconds || 1} step="0.01" value={displaySeconds} onChange={(e) => { 
              Tone.Transport.seconds = parseFloat(e.target.value); setDisplaySeconds(Tone.Transport.seconds); setActiveNotes([]); 
            }} />
            <span style={{color: '#facc15', fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace', minWidth: '150px'}}>{displaySeconds.toFixed(1)}s / {totalSeconds.toFixed(1)}s</span>
          </div>
        </div>

        {xmlData && <SheetViewer xml={xmlData} currentSeconds={displaySeconds} baseBpm={baseBpm} leadTime={leadTimeSeconds} cursorMap={cursorMap} />}

        <div style={pianoWrapperStyle}>
          {!isLoaded ? ( <div style={{color: '#facc15'}}>LOADING...</div> ) : (
            <div style={{ width: maxWidth * 0.9 }}>
              <PianoRaw
                activeNotes={activeNotes} 
                noteRange={pianoRange} 
                playNote={(midi: number) => sampler.triggerAttack(Tone.Frequency(midi, "midi").toNote())}
                stopNote={(midi: number) => sampler.triggerRelease(Tone.Frequency(midi, "midi").toNote())}
                width={maxWidth * 0.9}
                renderNoteLabel={({ midiNumber, isAccidental }: any) => (
                  <div className={`piano-label-large ${isAccidental ? 'accidental-label' : ''}`}>
                    {Tone.Frequency(midiNumber, "midi").toNote()}
                  </div>
                )}
              />
            </div>
          )}
        </div>

        <div style={footerStyle}>
          <button onClick={goBack} className="exit-button">← EXIT TO HOME</button>
        </div>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = { width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#050505", overflow: "hidden" };
const pianoChassisStyle: React.CSSProperties = { 
  width: "95%", 
  height: "90vh", 
  background: "#111", 
  borderRadius: "16px", 
  border: "1px solid #333", 
  display: 'flex', 
  flexDirection: 'column' 
};
const toolbarStyle: React.CSSProperties = { padding: "20px 40px", display: "flex", alignItems: "center", gap: "30px", background: "#000", borderBottom: "2px solid #1a1a1a" };
const titleStyleStudio: React.CSSProperties = { color: "#facc15", fontSize: "28px", fontWeight: "900", fontFamily: "'Arial Black', sans-serif", margin: 0, letterSpacing: "2px" };
const playButtonStyle: React.CSSProperties = { background: "#facc15", border: "none", padding: "10px 25px", borderRadius: "8px", fontWeight: "900", cursor: "pointer", fontSize: "14px", minWidth: "120px" };
const controlLabelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#666', fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace', minWidth: '90px' };
const pianoWrapperStyle: React.CSSProperties = { padding: "20px 20px 0px", background: '#000', display: 'flex', justifyContent: 'center' };
const footerStyle: React.CSSProperties = { padding: "40px 50px 20px", textAlign: 'left', background: '#111', marginTop: 'auto' };

export default PianoComponent;