import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../hooks/useSocket.js';
import { useGameStore } from '../game/gameStore.js';
import SettingsMenu from '../components/ui/SettingsMenu.js';

export default function MainMenu() {
    const navigate = useNavigate();
    const [showSettings, setShowSettings] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [nickname, setNickname] = useState('');
    const [loading, setLoading] = useState<'host' | 'join' | null>(null);
    const [error, setError] = useState('');
    const [view, setView] = useState<'main' | 'join'>('main');
    const setRoom = useGameStore((s) => s.setRoom);

    function handleCreateRoom() {
        const name = nickname.trim() || 'Teacher';
        setLoading('host');
        const socket = getSocket();
        if (!socket.connected) socket.connect();

        socket.emit('create-room', { nickname: name });
        socket.once('room-created', ({ roomCode }: { roomCode: string }) => {
            setRoom({ code: roomCode, nickname: name, isHost: true });
            setLoading(null);
            navigate('/host');
        });
    }

    function handleJoinRoom() {
        const code = joinCode.trim().toUpperCase();
        const name = nickname.trim();
        if (!code || code.length < 4) { setError('Enter a valid room code'); return; }
        if (!name || name.length < 2) { setError('Enter your nickname (min 2 chars)'); return; }
        setError('');
        setLoading('join');

        const socket = getSocket();
        if (!socket.connected) socket.connect();

        socket.emit('join-room', { roomCode: code, nickname: name });
        socket.once('join-success', ({ roomCode }: { roomCode: string }) => {
            setRoom({ code: roomCode, nickname: name, isHost: false });
            setLoading(null);
            navigate(`/play/${roomCode}`);
        });
        socket.once('join-error', ({ message }: { message: string }) => {
            setError(message);
            setLoading(null);
        });
    }

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0520 50%, #050510 100%)' }}
        >
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-15 blur-3xl animate-float" style={{ background: 'radial-gradient(circle, #5c7cfa, transparent)' }} />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full opacity-15 blur-3xl animate-float" style={{ animationDelay: '1.5s', background: 'radial-gradient(circle, #a855f7, transparent)' }} />
                <div className="absolute top-3/4 left-1/2 w-64 h-64 rounded-full opacity-10 blur-3xl animate-float" style={{ animationDelay: '3s', background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
                {/* Star grid */}
                {Array.from({ length: 30 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full opacity-30"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 4}s`,
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10 animate-slide-up">
                    <div className="text-6xl mb-4">🎲</div>
                    <h1
                        className="text-4xl font-black text-white mb-2"
                        style={{ textShadow: '0 0 30px rgba(92,124,250,0.6)' }}
                    >
                        Backgammon
                        <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #5c7cfa, #a855f7)' }}>
                            {' '}Survival
                        </span>
                    </h1>
                    <p className="text-gray-400 text-sm">A classroom puzzle challenge</p>
                </div>

                {/* Card */}
                <div
                    className="rounded-3xl p-6 animate-slide-up"
                    style={{
                        background: 'rgba(15,15,36,0.8)',
                        border: '1px solid rgba(92,124,250,0.25)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 0 60px rgba(92,124,250,0.12), 0 25px 50px rgba(0,0,0,0.4)',
                        animationDelay: '0.1s',
                    }}
                >
                    {view === 'main' && (
                        <div className="space-y-4">
                            {/* Nickname for host */}
                            <div>
                                <label className="text-gray-300 text-sm font-medium mb-2 block">Your Name (Teacher)</label>
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder="Teacher / Host Name"
                                    maxLength={20}
                                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none transition-all"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(92,124,250,0.3)' }}
                                />
                            </div>

                            <button
                                onClick={handleCreateRoom}
                                disabled={loading !== null}
                                className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-500 hover:to-primary-400 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary-600/30 disabled:opacity-50"
                            >
                                {loading === 'host' ? '⏳ Creating…' : '🏫 Create Room (Teacher)'}
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-gray-800" />
                                <span className="text-gray-600 text-xs">OR</span>
                                <div className="flex-1 h-px bg-gray-800" />
                            </div>

                            <button
                                onClick={() => setView('join')}
                                className="w-full py-4 rounded-2xl font-bold text-lg text-primary-300 transition-all hover:scale-[1.02] active:scale-95"
                                style={{ background: 'rgba(92,124,250,0.1)', border: '1px solid rgba(92,124,250,0.3)' }}
                            >
                                📱 Join Room (Student)
                            </button>
                        </div>
                    )}

                    {view === 'join' && (
                        <div className="space-y-4">
                            <button
                                onClick={() => { setView('main'); setError(''); }}
                                className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
                            >
                                ← Back
                            </button>
                            <h3 className="text-white font-bold text-lg">Join a Room</h3>
                            <div>
                                <label className="text-gray-300 text-sm font-medium mb-2 block">Room Code</label>
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. ABC123"
                                    maxLength={8}
                                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none uppercase tracking-widest font-bold text-center transition-all"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(92,124,250,0.3)' }}
                                />
                            </div>
                            <div>
                                <label className="text-gray-300 text-sm font-medium mb-2 block">Your Nickname</label>
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder="e.g. MathWizard99"
                                    maxLength={20}
                                    onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none transition-all"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(92,124,250,0.3)' }}
                                />
                            </div>
                            {error && <p className="text-red-400 text-xs">{error}</p>}
                            <button
                                onClick={handleJoinRoom}
                                disabled={loading !== null}
                                className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-500 hover:to-primary-400 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary-600/30 disabled:opacity-50"
                            >
                                {loading === 'join' ? '⏳ Joining…' : 'Join Game →'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Settings */}
                <div className="mt-4 text-center">
                    <button
                        onClick={() => setShowSettings(true)}
                        className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                    >
                        ⚙️ Settings
                    </button>
                </div>
            </div>

            {showSettings && <SettingsMenu onClose={() => setShowSettings(false)} />}
        </div>
    );
}
