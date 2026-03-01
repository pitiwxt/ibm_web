import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket.js';
import { useGameStore } from '../game/gameStore.js';
import HostLeaderboard from '../components/ui/HostLeaderboard.js';
import QRCodeDisplay from '../components/ui/QRCodeDisplay.js';
import SettingsMenu from '../components/ui/SettingsMenu.js';
import { useState } from 'react';

export default function HostPage() {
    const navigate = useNavigate();
    const socket = useSocket();
    const { room, leaderboard } = useGameStore();
    const [showSettings, setShowSettings] = useState(false);

    const roomCode = room?.code ?? '';
    const joinUrl = `${window.location.origin}/play/${roomCode}`;

    useEffect(() => {
        if (!roomCode) { navigate('/'); return; }
        socket.emit('request-leaderboard', { roomCode });
    }, [roomCode]);

    if (!roomCode) return null;

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0520 100%)' }}
        >
            {/* Top bar */}
            <header
                className="px-6 py-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(92,124,250,0.15)' }}
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🎲</span>
                    <div>
                        <div className="text-white font-bold">Backgammon Survival</div>
                        <div className="text-gray-500 text-xs">Teacher Dashboard</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowSettings(true)}
                        className="px-3 py-2 rounded-xl text-gray-400 hover:text-white text-sm transition-colors"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                        ⚙️ Settings
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="px-3 py-2 rounded-xl text-gray-400 hover:text-red-400 text-sm transition-colors"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                        ✕ End Session
                    </button>
                </div>
            </header>

            {/* Main content */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 max-w-7xl mx-auto w-full">
                {/* Left: QR + stats */}
                <div className="lg:col-span-1 space-y-4">
                    <QRCodeDisplay roomCode={roomCode} joinUrl={joinUrl} />

                    {/* Quick stats */}
                    <div
                        className="rounded-2xl p-4 grid grid-cols-2 gap-3"
                        style={{ background: 'rgba(10,10,25,0.7)', border: '1px solid rgba(92,124,250,0.2)' }}
                    >
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">{leaderboard.length}</div>
                            <div className="text-gray-500 text-xs">Students</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">
                                {leaderboard.filter((p) => p.status === 'alive').length}
                            </div>
                            <div className="text-gray-500 text-xs">Still Alive</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-accent-400">
                                {leaderboard.length > 0 ? Math.max(...leaderboard.map((p) => p.score)) : 0}
                            </div>
                            <div className="text-gray-500 text-xs">Top Score</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">
                                {leaderboard.length > 0
                                    ? Math.round(leaderboard.reduce((s, p) => s + p.score, 0) / leaderboard.length)
                                    : 0}
                            </div>
                            <div className="text-gray-500 text-xs">Avg Score</div>
                        </div>
                    </div>
                </div>

                {/* Right: Leaderboard */}
                <div
                    className="lg:col-span-2 rounded-3xl p-6 overflow-hidden"
                    style={{
                        background: 'rgba(10,10,25,0.8)',
                        border: '1px solid rgba(92,124,250,0.2)',
                        backdropFilter: 'blur(20px)',
                    }}
                >
                    <HostLeaderboard roomCode={roomCode} />
                </div>
            </div>

            {showSettings && <SettingsMenu onClose={() => setShowSettings(false)} />}
        </div>
    );
}
