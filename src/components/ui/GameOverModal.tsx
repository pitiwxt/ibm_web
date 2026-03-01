
import { useGameStore } from '../../game/gameStore.js';
import { blotLocations } from '../../game/gameRules.js';

interface GameOverModalProps {
    onReturn: () => void;
}

export default function GameOverModal({ onReturn }: GameOverModalProps) {
    const { turn, disks, resetGame } = useGameStore();
    const blots = blotLocations(disks);

    function handleReturn() {
        resetGame();
        onReturn();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(5, 5, 16, 0.92)', backdropFilter: 'blur(12px)' }}
        >
            <div
                className="w-full max-w-md rounded-3xl p-8 text-center animate-slide-up"
                style={{
                    background: 'linear-gradient(135deg, #0f0f24 0%, #1a0a20 100%)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    boxShadow: '0 0 60px rgba(239, 68, 68, 0.2), 0 25px 50px rgba(0,0,0,0.6)',
                }}
            >
                {/* Blot icon */}
                <div className="text-6xl mb-4 animate-bounce">💥</div>

                <h2 className="text-3xl font-bold text-red-400 mb-2">Blot Detected!</h2>
                <p className="text-gray-400 mb-6 text-sm">
                    A disk was left alone at location{' '}
                    <span className="text-red-300 font-semibold">{blots.join(', ')}</span>
                </p>

                {/* Score display */}
                <div
                    className="rounded-2xl p-6 mb-6"
                    style={{ background: 'rgba(92, 124, 250, 0.1)', border: '1px solid rgba(92, 124, 250, 0.25)' }}
                >
                    <div className="text-primary-400 text-xs uppercase tracking-widest mb-2">Final Score</div>
                    <div className="text-6xl font-black text-white">{turn}</div>
                    <div className="text-gray-500 text-sm mt-1">
                        {turn === 0 ? 'First roll — keep practicing!' : turn === 1 ? 'Survived 1 roll' : `Survived ${turn} rolls`}
                    </div>
                </div>

                {/* Rating */}
                <div className="mb-6">
                    {turn === 0 && <p className="text-gray-400">🎯 Keep trying — you'll get better!</p>}
                    {turn >= 1 && turn < 5 && <p className="text-yellow-400">⭐ Not bad! Try again!</p>}
                    {turn >= 5 && turn < 10 && <p className="text-green-400">⭐⭐ Good run! Can you beat it?</p>}
                    {turn >= 10 && <p className="text-primary-300">🌟 Excellent strategy!</p>}
                </div>

                {/* Waiting indicator */}
                <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-6">
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse" />
                    <span>Waiting for other players…</span>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleReturn}
                        className="flex-1 py-3 rounded-xl font-bold text-base bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-500 hover:to-primary-400 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary-600/30"
                    >
                        Return to Lobby
                    </button>
                </div>
            </div>
        </div>
    );
}
