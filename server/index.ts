import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createRoom, joinRoom, updatePlayerScore, removePlayer, getLeaderboard, getRoomByCode } from './roomManager.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

io.on('connection', (socket: Socket) => {
    console.log(`[+] Connected: ${socket.id}`);

    // Host creates a room
    socket.on('create-room', ({ nickname }: { nickname: string }) => {
        const room = createRoom(socket.id, nickname);
        socket.join(room.code);
        socket.emit('room-created', { roomCode: room.code });
        console.log(`[Room] Created: ${room.code} by ${nickname}`);
    });

    // Student joins a room
    socket.on('join-room', ({ roomCode, nickname }: { roomCode: string; nickname: string }) => {
        const room = joinRoom(roomCode.toUpperCase(), socket.id, nickname);
        if (!room) {
            socket.emit('join-error', { message: 'Room not found. Check the code and try again.' });
            return;
        }
        socket.join(room.code);
        const lb = getLeaderboard(room);
        io.to(room.code).emit('player-joined', { players: lb });
        socket.emit('join-success', { roomCode: room.code });
        socket.to(room.code).emit('leaderboard-update', { leaderboard: lb });
        console.log(`[Room] ${nickname} joined ${room.code}`);
    });

    // Player updates their score
    socket.on('score-update', ({ roomCode, score, status }: { roomCode: string; score: number; status: 'alive' | 'blotted' }) => {
        const room = updatePlayerScore(roomCode, socket.id, score, status);
        if (!room) return;
        const lb = getLeaderboard(room);
        io.to(roomCode).emit('leaderboard-update', { leaderboard: lb });
    });

    // Player disconnects
    socket.on('disconnect', () => {
        console.log(`[-] Disconnected: ${socket.id}`);
        const result = removePlayer(socket.id);
        if (result) {
            const lb = getLeaderboard(result.room);
            io.to(result.code).emit('leaderboard-update', { leaderboard: lb });
        }
    });

    // Host requests current leaderboard
    socket.on('request-leaderboard', ({ roomCode }: { roomCode: string }) => {
        const room = getRoomByCode(roomCode);
        if (!room) return;
        socket.emit('leaderboard-update', { leaderboard: getLeaderboard(room) });
    });
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
    console.log(`🎲 Backgammon Survival server running on http://localhost:${PORT}`);
});
