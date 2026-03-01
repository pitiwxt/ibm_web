import { useState } from 'react';
import { getSocket } from '../../hooks/useSocket.js';
import { useGameStore } from '../../game/gameStore.js';

interface NicknameInputProps {
    roomCode: string;
    onJoined: () => void;
}

export default function NicknameInput({ roomCode, onJoined }: NicknameInputProps) {
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const setRoom = useGameStore((s) => s.setRoom);

    function handleJoin() {
        const name = nickname.trim();
        if (!name || name.length < 2) {
            setError('Nickname must be at least 2 characters');
            return;
        }
        setError('');
        setLoading(true);

        const socket = getSocket();
        if (!socket.connected) socket.connect();

        socket.emit('join-room', { roomCode, nickname: name });

        socket.once('join-success', () => {
            setRoom({ code: roomCode, nickname: name, isHost: false });
            setLoading(false);
            onJoined();
        });

        socket.once('join-error', ({ message }: { message: string }) => {
            setError(message);
            setLoading(false);
        });
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0520 100%)' }}
        >
            {/* Animated background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #5c7cfa, transparent)' }} />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
            </div>

            <div
                className="relative w-full max-w-sm rounded-3xl p-8 animate-slide-up"
                style={{
                    background: 'linear-gradient(135deg, #0f0f24 0%, #141428 100%)',
                    border: '1px solid rgba(92,124,250,0.3)',
                    boxShadow: '0 0 60px rgba(92,124,250,0.15), 0 25px 50px rgba(0,0,0,0.5)',
                }}
            >
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4 animate-float">🎲</div>
                    <h1 className="text-2xl font-bold text-white mb-1">Join Game</h1>
                    <p className="text-gray-400 text-sm">
                        Room <span className="text-primary-300 font-bold tracking-widest">{roomCode}</span>
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-gray-300 text-sm font-medium mb-2 block">Your Nickname</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                            placeholder="e.g. MathWizard99"
                            maxLength={20}
                            autoFocus
                            className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none transition-all"
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(92,124,250,0.3)',
                                boxShadow: error ? '0 0 10px rgba(239,68,68,0.1)' : 'none',
                            }}
                        />
                        {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
                    </div>

                    <button
                        onClick={handleJoin}
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl font-bold text-base bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-500 hover:to-primary-400 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '⏳ Joining…' : 'Join Game →'}
                    </button>
                </div>
            </div>
        </div>
    );
}
