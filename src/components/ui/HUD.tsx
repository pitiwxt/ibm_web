import { useGameStore } from '../../game/gameStore.js';
import { SFX, unlockAudio } from '../../hooks/useSound.js';

interface HUDProps {
    onRoll: () => void;
    onUndo: () => void;
    onOpenSettings: () => void;
    onHowToPlay: () => void;
    selectableSlotIndex: number | null;
    onSlotSelect: (i: number) => void;
}

const DIE_FACE_DOTS: Record<number, [number, number][]> = {
    1: [[0, 0]],
    2: [[-1, -1], [1, 1]],
    3: [[-1, -1], [0, 0], [1, 1]],
    4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
    6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};

function DieFace({ value, color = '#5c7cfa', rolling = false }: { value: number | null; color?: string; rolling?: boolean }) {
    const dots = value ? DIE_FACE_DOTS[Math.min(value, 6)] ?? [] : [];
    return (
        <div
            className={`relative w-14 h-14 rounded-xl flex items-center justify-center transition-all ${rolling ? 'animate-spin' : ''}`}
            style={{
                background: 'linear-gradient(135deg, #1a1a38 0%, #0f0f24 100%)',
                border: `2px solid ${color}`,
                boxShadow: rolling ? `0 0 20px ${color}aa` : value ? `0 0 12px ${color}66` : 'none',
                animationDuration: '0.25s',
            }}
        >
            {value === null || rolling ? (
                <span className={`text-xl ${rolling ? 'opacity-50' : 'text-gray-600'}`}>{rolling ? '⬛' : '?'}</span>
            ) : (
                <div className="w-10 h-10 relative">
                    {dots.map(([dx, dy], i) => (
                        <div
                            key={i}
                            className="absolute w-2.5 h-2.5 rounded-full"
                            style={{
                                background: color,
                                left: `${50 + dx * 32}%`,
                                top: `${50 + dy * 32}%`,
                                transform: 'translate(-50%, -50%)',
                                boxShadow: `0 0 4px ${color}`,
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function HUD({ onRoll, onUndo, onOpenSettings, onHowToPlay, selectableSlotIndex, onSlotSelect }: HUDProps) {
    const { phase, turn, currentRoll, moveSlots, settings } = useGameStore();
    const canRoll = phase === 'idle';
    const canUndo = phase === 'selecting' && useGameStore.getState().moveHistory.length > 0;
    const isRolling = phase === 'rolling';

    const unusedSlots = moveSlots.filter((s) => !s.used);
    const movesLeft = unusedSlots.length;

    function handleRollClick() {
        unlockAudio();
        SFX.roll();
        onRoll();
    }

    function handleSlotClick(i: number) {
        SFX.select();
        onSlotSelect(i);
    }

    function handleUndo() {
        SFX.select();
        onUndo();
    }

    return (
        <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none">
            {/* Context hint bar */}
            <div className="mx-4 mb-2 text-center pointer-events-none">
                {phase === 'idle' && (
                    <div
                        className="inline-block px-4 py-1.5 rounded-full text-xs text-primary-300 animate-pulse"
                        style={{ background: 'rgba(92,124,250,0.12)', border: '1px solid rgba(92,124,250,0.2)' }}
                    >
                        🎲 Press "Roll Dice" to start your turn
                    </div>
                )}
                {phase === 'selecting' && movesLeft > 0 && (
                    <div
                        className="inline-block px-4 py-1.5 rounded-full text-xs text-accent-400 animate-pulse"
                        style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
                    >
                        👆 {selectableSlotIndex === null
                            ? `Tap a "+${unusedSlots[0]?.value}" slot below, then click a disk to move it`
                            : `Now click a 🔵 glowing disk to move it +${moveSlots[selectableSlotIndex]?.value} steps`}
                    </div>
                )}
                {phase === 'rolling' && (
                    <div
                        className="inline-block px-4 py-1.5 rounded-full text-xs text-yellow-300"
                        style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.25)' }}
                    >
                        🎲 Rolling…
                    </div>
                )}
            </div>

            {/* Bottom panel */}
            <div
                className="mx-4 mb-4 rounded-2xl p-4 pointer-events-auto"
                style={{
                    background: 'rgba(10, 10, 25, 0.88)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(92, 124, 250, 0.3)',
                }}
            >
                <div className="flex items-center justify-between gap-4">
                    {/* Turn counter */}
                    <div className="text-center min-w-[60px]">
                        <div className="text-primary-400 text-xs uppercase tracking-widest mb-1">Turn</div>
                        <div className="text-white text-3xl font-bold">{turn}</div>
                    </div>

                    {/* Dice display */}
                    <div className="flex items-center gap-3 flex-1 justify-center">
                        <DieFace value={currentRoll?.d1 ?? null} color="#5c7cfa" rolling={isRolling} />
                        {currentRoll?.isDoubles && !isRolling && (
                            <div className="text-accent-400 text-xl font-bold animate-pulse">×4</div>
                        )}
                        {isRolling && (
                            <div className="text-yellow-400 text-xs animate-bounce">rolling…</div>
                        )}
                        <DieFace value={currentRoll?.d2 ?? null} color="#f59e0b" rolling={isRolling} />
                    </div>

                    {/* Status */}
                    <div className="text-center min-w-[50px]">
                        {phase === 'selecting' && (
                            <div className="text-primary-300 text-xs">
                                {movesLeft} left
                            </div>
                        )}
                        {settings.diceMode === '1-2' && (
                            <div className="text-gray-600 text-[10px] mt-1">1-2 mode</div>
                        )}
                    </div>
                </div>

                {/* Move slot buttons */}
                {phase === 'selecting' && moveSlots.length > 0 && (
                    <div className="mt-3 flex gap-2 justify-center flex-wrap">
                        {moveSlots.map((slot, i) => (
                            <button
                                key={i}
                                disabled={slot.used}
                                onClick={() => handleSlotClick(i)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${slot.used
                                        ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed line-through'
                                        : selectableSlotIndex === i
                                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/50 scale-110 ring-2 ring-primary-300'
                                            : 'bg-primary-900/60 text-primary-300 border border-primary-600/50 hover:bg-primary-700/60 hover:scale-105'
                                    }`}
                            >
                                {slot.used ? '✓' : `+${slot.value} ${slot.value === 1 ? 'step' : 'steps'}`}
                            </button>
                        ))}
                    </div>
                )}

                {/* Role instructions when slot selected */}
                {phase === 'selecting' && selectableSlotIndex !== null && (
                    <div className="mt-2 text-center">
                        <span className="text-xs text-accent-400 animate-pulse">
                            ↑ Now click a glowing disk on the board above ↑
                        </span>
                    </div>
                )}

                {/* Action buttons */}
                <div className="mt-3 flex gap-2">
                    <button
                        onClick={handleRollClick}
                        disabled={!canRoll}
                        className={`flex-1 py-3 rounded-xl font-bold text-base tracking-wide transition-all ${canRoll
                                ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-500 hover:to-primary-400 shadow-lg shadow-primary-600/40 hover:shadow-primary-500/60 hover:scale-[1.02] active:scale-95'
                                : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                            }`}
                    >
                        🎲 Roll Dice
                    </button>
                    <button
                        onClick={handleUndo}
                        disabled={!canUndo}
                        className={`px-3 py-3 rounded-xl font-semibold transition-all text-lg ${canUndo
                                ? 'bg-gray-700/80 text-gray-200 hover:bg-gray-600/80 border border-gray-600/50'
                                : 'bg-gray-800/50 text-gray-700 cursor-not-allowed'
                            }`}
                        title="Undo last move"
                    >
                        ↩
                    </button>
                    <button
                        onClick={onHowToPlay}
                        className="px-3 py-3 rounded-xl bg-indigo-900/60 text-indigo-300 hover:bg-indigo-700/60 border border-indigo-600/40 transition-all text-sm font-semibold"
                        title="How to play"
                    >
                        ?
                    </button>
                    <button
                        onClick={() => { SFX.select(); onOpenSettings(); }}
                        className="px-3 py-3 rounded-xl bg-gray-700/80 text-gray-200 hover:bg-gray-600/80 border border-gray-600/50 transition-all"
                        title="Settings"
                    >
                        ⚙️
                    </button>
                </div>
            </div>
        </div>
    );
}
