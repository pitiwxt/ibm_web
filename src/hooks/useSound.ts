/**
 * useSound.ts  –  Web Audio API sound engine
 *
 * SFX: dice roll, disk move, settle, success, blot
 * Music: Bach-style Minuet in G (BWV Anh 114) procedural recreation
 */

let audioCtx: AudioContext | null = null;

function ctx(): AudioContext {
    if (!audioCtx) audioCtx = new AudioContext();
    return audioCtx;
}

export function unlockAudio() {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function hz(note: string): number {
    const map: Record<string, number> = {
        C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, Fs4: 369.99,
        G4: 392.00, A4: 440.00, B4: 493.88,
        C5: 523.25, D5: 587.33, E5: 659.25, Fs5: 739.99,
        G5: 783.99, A5: 880.00, B5: 987.77,
        G3: 196.00, D3: 146.83, C3: 130.81, A3: 220.00, B3: 246.94, E3: 164.81,
    };
    return map[note] ?? 440;
}

function playNote(freq: number, type: OscillatorType, start: number, dur: number, vol: number, ac: AudioContext) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(vol, start + 0.02);
    gain.gain.setValueAtTime(vol, start + dur * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(start);
    osc.stop(start + dur + 0.05);
}

function playNoise(duration: number, vol = 0.15, bandFreq = 400) {
    const ac = ctx();
    const bufSize = ac.sampleRate * duration;
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = bandFreq;
    filter.Q.value = 1.5;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    src.start();
    src.stop(ac.currentTime + duration);
}

function simpleTone(freq: number, type: OscillatorType, dur: number, vol = 0.2, delay = 0) {
    const ac = ctx();
    const t = ac.currentTime + delay;
    playNote(freq, type, t, dur, vol, ac);
}

// ── SFX ───────────────────────────────────────────────────────────────────────

export const SFX = {
    roll: () => {
        for (let i = 0; i < 6; i++) {
            const d = i * 0.08;
            setTimeout(() => playNoise(0.1, 0.18 - i * 0.02, 300 + Math.random() * 200), d * 1000);
        }
        setTimeout(() => { simpleTone(80, 'sine', 0.15, 0.18); playNoise(0.07, 0.22, 180); }, 550);
    },
    diskMove: () => {
        simpleTone(880, 'sine', 0.06, 0.08);
        simpleTone(440, 'sine', 0.1, 0.05, 0.03);
    },
    diceSettle: () => {
        playNoise(0.05, 0.1, 200);
        simpleTone(120, 'sine', 0.06, 0.12);
    },
    turnSuccess: () => {
        [523, 659, 784].forEach((f, i) => simpleTone(f, 'sine', 0.2, 0.22, i * 0.08));
    },
    blot: () => {
        simpleTone(220, 'sawtooth', 0.5, 0.28);
        simpleTone(174, 'sawtooth', 0.5, 0.18, 0.05);
        simpleTone(130, 'sine', 0.7, 0.22, 0.1);
        playNoise(0.6, 0.18, 100);
    },
    select: () => simpleTone(660, 'sine', 0.05, 0.07),
};

// ── Bach Minuet in G (BWV Anh. 114) – Classical procedural music ───────────────
//
// Full 32-bar Minuet melody + simple bass line using triangle/sine oscillators.
// Each bar is 3 beats at ♩ = 90 BPM  → 1 beat = 0.667 s

const BPM = 90;
const BEAT = 60 / BPM;          // seconds per quarter note
const BAR = BEAT * 3;           // 3/4 time

// Melody (note, beats duration, octave offset)
type Note = [string, number];
const MELODY: Note[] = [
    // Bar 1
    ['D5', 1], ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['C5', 0.5],
    // Bar 2
    ['D5', 2], ['G4', 0.5], ['G4', 0.5],
    // Bar 3
    ['E5', 1], ['C5', 0.5], ['D5', 0.5], ['E5', 0.5], ['Fs5', 0.5],
    // Bar 4
    ['G5', 2], ['G4', 0.5], ['G4', 0.5],
    // Bar 5
    ['C5', 1], ['D5', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5],
    // Bar 6
    ['B4', 1], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5],
    // Bar 7
    ['Fs4', 0.5], ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['G4', 0.5], ['B4', 0.5],
    // Bar 8
    ['A4', 3],
    // Bar 9  (repeat A)
    ['D5', 1], ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['C5', 0.5],
    // Bar 10
    ['D5', 2], ['G5', 1],
    // Bar 11
    ['E5', 0.5], ['Fs5', 0.5], ['G5', 0.5], ['Fs5', 0.5], ['E5', 0.5], ['D5', 0.5],
    // Bar 12
    ['C5', 1], ['B4', 0.5], ['C5', 0.5], ['A4', 0.5], ['A4', 0.5],
    // Bar 13
    ['Fs4', 0.5], ['A4', 0.5], ['C5', 0.5], ['A4', 0.5], ['C5', 0.5], ['A4', 0.5],
    // Bar 14
    ['D5', 0.5], ['Fs5', 0.5], ['A5', 0.5], ['G5', 0.5], ['Fs5', 0.5], ['E5', 0.5],
    // Bar 15
    ['Fs5', 0.5], ['E5', 0.5], ['D5', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5],
    // Bar 16
    ['G4', 3],
];

// Bass (root note per bar, 1 beat + 2 beats pattern)
const BASS: [string, string][] = [
    ['G3', 'B3'], ['G3', 'B3'], ['C3', 'E3'], ['G3', 'B3'],
    ['C3', 'E3'], ['G3', 'D4'], ['D3', 'Fs4'], ['D3', 'Fs4'],
    ['G3', 'B3'], ['G3', 'B3'], ['C3', 'E3'], ['A3', 'C4'],
    ['D3', 'Fs4'], ['D3', 'Fs4'], ['G3', 'B3'], ['G3', 'D4'],
];

let _musicEnabled = false;
let _musicPlaying = false;
let _musicSchedulerId: ReturnType<typeof setTimeout> | null = null;
let _audioCtxStartTime = 0;
let _melodyIdx = 0;
let _bassIdx = 0;
let _cursorTime = 0;

function scheduleMelodyChunk() {
    if (!_musicEnabled) return;
    const ac = ctx();

    // Schedule BEAT-worth of notes ahead
    const lookahead = BEAT * 4;
    const now = ac.currentTime;

    // If this is the first call, start cursor at now
    if (_cursorTime < now) _cursorTime = now + 0.05;

    while (_cursorTime < now + lookahead) {
        const [note, dur] = MELODY[_melodyIdx % MELODY.length];
        const durSec = dur * BEAT;
        playNote(hz(note), 'triangle', _cursorTime, durSec * 0.85, 0.12, ac);
        _cursorTime += durSec;
        _melodyIdx++;

        // Schedule bass note at bar boundary
        if (_melodyIdx % 8 === 0) {
            const barStart = _cursorTime - durSec;
            const [root, fifth] = BASS[_bassIdx % BASS.length];
            playNote(hz(root), 'sine', barStart, BEAT, 0.1, ac);
            playNote(hz(fifth), 'sine', barStart + BEAT, BEAT * 2, 0.06, ac);
            _bassIdx++;
        }
    }

    _musicSchedulerId = setTimeout(scheduleMelodyChunk, BEAT * 1000);
}

export function startMusic() {
    if (_musicPlaying) return;
    _musicEnabled = true;
    _musicPlaying = true;
    _melodyIdx = 0;
    _bassIdx = 0;
    _cursorTime = 0;
    ctx().resume().then(() => scheduleMelodyChunk());
}

export function stopMusic() {
    _musicEnabled = false;
    _musicPlaying = false;
    if (_musicSchedulerId) { clearTimeout(_musicSchedulerId); _musicSchedulerId = null; }
}

export function toggleMusic(enabled: boolean) {
    enabled ? startMusic() : stopMusic();
}
