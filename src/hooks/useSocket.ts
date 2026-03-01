import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../game/gameStore.js';
import type { LeaderboardEntry } from '../game/types.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        socket = io(SERVER_URL, { autoConnect: false });
    }
    return socket;
}

export function useSocket() {
    const setLeaderboard = useGameStore((s) => s.setLeaderboard);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const s = getSocket();
        socketRef.current = s;
        if (!s.connected) s.connect();

        s.on('leaderboard-update', ({ leaderboard }: { leaderboard: LeaderboardEntry[] }) => {
            setLeaderboard(leaderboard);
        });

        return () => {
            s.off('leaderboard-update');
        };
    }, [setLeaderboard]);

    return socketRef.current ?? getSocket();
}
