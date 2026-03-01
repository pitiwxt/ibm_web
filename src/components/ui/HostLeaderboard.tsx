import { useGameStore } from '../../game/gameStore.js';
import type { LeaderboardEntry } from '../../game/types.js';

interface HostLeaderboardProps {
    roomCode: string;
}

export default function HostLeaderboard({ roomCode }: HostLeaderboardProps) {
    const { leaderboard } = useGameStore();

    const sorted = [...leaderboard].sort((a, b) => {
        if (a.status === 'alive' && b.status !== 'alive') return -1;
        if (b.status === 'alive' && a.status !== 'alive') return 1;
        return b.score - a.score;
    });

    const aliveCount = leaderboard.filter((p) => p.status === 'alive').length;

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Live Leaderboard</h2>
                    <p className="text-gray-400 text-sm">
                        {aliveCount} student{aliveCount !== 1 ? 's' : ''} still playing
                    </p>
                </div>
                <div
                    className="px-4 py-2 rounded-xl"
                    style={{
                        background: 'rgba(92,124,250,0.15)',
                        border: '1px solid rgba(92,124,250,0.3)',
                    }}
                >
                    <div className="text-xs text-gray-400 tracking-wider">ROOM</div>
                    <div className="text-xl font-black text-primary-300 tracking-widest">{roomCode}</div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto space-y-2">
                {sorted.length === 0 ? (
                    <div className="text-center py-16 text-gray-600">
                        <div className="text-4xl mb-3">👥</div>
                        <p>Waiting for students to join…</p>
                        <p className="text-sm mt-1">Share the room code or QR below</p>
                    </div>
                ) : (
                    sorted.map((player, rank) => (
                        <LeaderboardRow key={player.id} player={player} rank={rank + 1} />
                    ))
                )}
            </div>
        </div>
    );
}

function LeaderboardRow({ player, rank }: { player: LeaderboardEntry; rank: number }) {
    const medals = ['🥇', '🥈', '🥉'];
    const isAlive = player.status === 'alive';

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isAlive ? 'bg-primary-900/30' : 'bg-gray-900/30 opacity-70'
                }`}
            style={{ border: `1px solid ${isAlive ? 'rgba(92,124,250,0.2)' : 'rgba(255,255,255,0.05)'}` }}
        >
            {/* Rank */}
            <div className="w-8 text-center text-lg shrink-0">
                {rank <= 3 ? medals[rank - 1] : <span className="text-gray-500 text-sm font-bold">#{rank}</span>}
            </div>

            {/* Avatar */}
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{
                    background: isAlive
                        ? 'linear-gradient(135deg, #4c6ef5, #7048e8)'
                        : 'linear-gradient(135deg, #374151, #1f2937)',
                }}
            >
                {player.nickname[0].toUpperCase()}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
                <div className="text-white font-semibold truncate">{player.nickname}</div>
            </div>

            {/* Score */}
            <div className="text-right shrink-0">
                <div className="text-white font-bold text-lg">{player.score}</div>
                <div className="text-xs" style={{ color: isAlive ? '#69db7c' : '#f87171' }}>
                    {isAlive ? '🟢 Alive' : '🔴 Blotted'}
                </div>
            </div>
        </div>
    );
}
