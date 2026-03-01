/**
 * useSound – Web Audio API sound engine
 * Provides SFX and a procedural background music generator.
 */

let audioCtx: AudioContext | null = null;
let musicNodes: { osc?: OscillatorNode; gain?: GainNode }[] = [];
let musicGain: GainNode | null = null;
let musicPlaying = false;

function ctx(): AudioContext {
    if (!audioCtx) audioCtx = new AudioContext();
    return audioCtx;
}

// ── Simple helpers ─────────────────────────────────────────────────────────────

function playTone(freq: number, type: OscillatorType, duration: number, vol = 0.3, delay = 0) {
    const ac = ctx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.frequency.value = freq;
    osc.type = type;
    const start = ac.currentTime + delay;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(vol, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.start(start);
    osc.stop(start + duration + 0.05);
}

function playNoise(duration: number, vol = 0.15, bandFreq = 400) {
    const ac = ctx();
    const bufSize = ac.sampleRate * duration;
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;

    // Band-pass filter
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

// ── Sound Effects ──────────────────────────────────────────────────────────────

export const SFX = {
    roll: () => {
        // Multiple rattling noise bursts = dice rolling
        for (let i = 0; i < 6; i++) {
            const delay = i * 0.08;
            const vol = 0.18 - i * 0.02;
            setTimeout(() => { playNoise(0.12, vol, 300 + Math.random() * 200); }, delay * 1000);
        }
        // Low impact thud at end
        setTimeout(() => {
            playTone(80, 'sine', 0.15, 0.2);
            playNoise(0.08, 0.25, 180);
        }, 550);
    },

    diskMove: () => {
        // Short crisp click + soft whoosh
        playTone(900, 'square', 0.04, 0.1);
        playTone(440, 'sine', 0.12, 0.07);
    },

    diceSettle: () => {
        // Soft thud when dice land
        playNoise(0.06, 0.12, 200);
        playTone(120, 'sine', 0.08, 0.15);
    },

    turnSuccess: () => {
        // Rising arpeggio: C E G
        const notes = [523, 659, 784];
        notes.forEach((f, i) => playTone(f, 'sine', 0.18, 0.25, i * 0.08));
    },

    blot: () => {
        // Descending dissonant chord = game over feel
        playTone(220, 'sawtooth', 0.5, 0.3);
        playTone(174, 'sawtooth', 0.5, 0.2, 0.05);
        playTone(130, 'sine', 0.7, 0.25, 0.1);
        playNoise(0.6, 0.2, 100);
    },

    select: () => {
        // Soft pop
        playTone(660, 'sine', 0.06, 0.08);
    },

    hover: () => {
        playTone(880, 'sine', 0.03, 0.04);
    },
};


// ── Procedural Background Music ────────────────────────────────────────────────
// A slow, atmospheric minor pentatonic arpeggio

const SCALE_FREQS = [130.81, 155.56, 174.61, 196.00, 233.08, 261.63, 311.13, 349.23]; // Cm pentatonic family

let musicScheduler: ReturnType<typeof setTimeout> | null = null;
let musicStep = 0;
let _musicEnabled = false;

function scheduleNote() {
    if (!_musicEnabled) return;
    const ac = ctx();
    const freq = SCALE_FREQS[musicStep % SCALE_FREQS.length] * (musicStep > 7 ? 2 : 1);

    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const reverb = ac.createConvolver();

    // Simple pad sound
    osc.type = musicStep % 3 === 0 ? 'sine' : 'triangle';
    osc.frequency.value = freq;

    const now = ac.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + 2.5);

    musicStep++;
    const interval = musicStep % 4 === 0 ? 900 : 600;
    musicScheduler = setTimeout(scheduleNote, interval);
}

export function startMusic() {
    if (musicPlaying) return;
    _musicEnabled = true;
    musicPlaying = true;
    // Resume audio context if suspended
    ctx().resume().then(() => scheduleNote());
}

export function stopMusic() {
    _musicEnabled = false;
    musicPlaying = false;
    if (musicScheduler) { clearTimeout(musicScheduler); musicScheduler = null; }
}

export function toggleMusic(enabled: boolean) {
    enabled ? startMusic() : stopMusic();
}

// Resume AudioContext on first user interaction (browser policy)
export function unlockAudio() {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}
