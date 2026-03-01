import { create } from 'zustand';
import type { Disk, DiceRoll, MoveSlot, GamePhase, LeaderboardEntry, RoomInfo, GameSettings, DiceMode, Quality } from './types.js';
import { rollDice, buildMoveSlots, applyMove, checkBlot, createInitialDisks } from './gameRules.js';

// ── Game Slice ────────────────────────────────────────────────────────────────

interface GameSlice {
    disks: Disk[];
    turn: number;
    phase: GamePhase;
    currentRoll: DiceRoll | null;
    moveSlots: MoveSlot[];
    moveHistory: Array<{ disks: Disk[]; moveSlots: MoveSlot[] }>;

    rollDiceAction: () => void;
    selectDisk: (diskId: string, slotIndex: number) => void;
    undoLastMove: () => void;
    resetGame: () => void;
    setPhase: (phase: GamePhase) => void;
}

// ── Settings Slice ────────────────────────────────────────────────────────────

interface SettingsSlice {
    settings: GameSettings;
    setDiceMode: (mode: DiceMode) => void;
    setSoundEnabled: (v: boolean) => void;
    setMusicEnabled: (v: boolean) => void;
    setQuality: (q: Quality) => void;
}

// ── Room Slice ─────────────────────────────────────────────────────────────────

interface RoomSlice {
    room: RoomInfo | null;
    leaderboard: LeaderboardEntry[];
    setRoom: (r: RoomInfo | null) => void;
    setLeaderboard: (l: LeaderboardEntry[]) => void;
}

// ── Combined Store ────────────────────────────────────────────────────────────

type Store = GameSlice & SettingsSlice & RoomSlice;

export const useGameStore = create<Store>((set, get) => ({
    // ── Game ────────────────────────────────────────────────────────────────────
    disks: createInitialDisks(),
    turn: 0,
    phase: 'idle',
    currentRoll: null,
    moveSlots: [],
    moveHistory: [],

    rollDiceAction: () => {
        const { settings } = get();
        const roll = rollDice(settings.diceMode);
        const slots = buildMoveSlots(roll);
        set({ currentRoll: roll, moveSlots: slots, phase: 'selecting', moveHistory: [] });
    },

    selectDisk: (diskId: string, slotIndex: number) => {
        const { disks, moveSlots, turn } = get();
        const slot = moveSlots[slotIndex];
        if (!slot || slot.used) return;

        const newSlots = moveSlots.map((s, i) => (i === slotIndex ? { ...s, used: true } : s));
        const newDisks = applyMove(disks, diskId, slot.value);

        const allUsed = newSlots.every((s) => s.used);
        let phase: GamePhase = 'selecting';
        let newTurn = turn;

        if (allUsed) {
            if (checkBlot(newDisks)) {
                phase = 'gameover';
            } else {
                phase = 'idle';
                newTurn = turn + 1;
            }
        }

        set({
            moveHistory: [...get().moveHistory, { disks, moveSlots }],
            disks: newDisks,
            moveSlots: newSlots,
            phase,
            turn: newTurn,
        });
    },

    undoLastMove: () => {
        const { moveHistory } = get();
        if (moveHistory.length === 0) return;
        const prev = moveHistory[moveHistory.length - 1];
        set({
            disks: prev.disks,
            moveSlots: prev.moveSlots,
            moveHistory: moveHistory.slice(0, -1),
            phase: 'selecting',
        });
    },

    resetGame: () => {
        set({
            disks: createInitialDisks(),
            turn: 0,
            phase: 'idle',
            currentRoll: null,
            moveSlots: [],
            moveHistory: [],
        });
    },

    setPhase: (phase) => set({ phase }),

    // ── Settings ────────────────────────────────────────────────────────────────
    settings: { diceMode: '1-2', soundEnabled: true, musicEnabled: false, quality: 'medium' },
    setDiceMode: (mode) => set((s) => ({ settings: { ...s.settings, diceMode: mode } })),
    setSoundEnabled: (v) => set((s) => ({ settings: { ...s.settings, soundEnabled: v } })),
    setMusicEnabled: (v) => set((s) => ({ settings: { ...s.settings, musicEnabled: v } })),
    setQuality: (q) => set((s) => ({ settings: { ...s.settings, quality: q } })),

    // ── Room ────────────────────────────────────────────────────────────────────
    room: null,
    leaderboard: [],
    setRoom: (r) => set({ room: r }),
    setLeaderboard: (l) => set({ leaderboard: l }),
}));
