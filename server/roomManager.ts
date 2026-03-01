import { Room, Player } from './types.js';

const rooms = new Map<string, Room>();

function generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function createRoom(hostId: string, nickname: string): Room {
    let code = generateCode();
    while (rooms.has(code)) code = generateCode();

    const host: Player = { id: hostId, nickname, score: 0, status: 'alive', joinedAt: Date.now() };
    const room: Room = {
        code,
        hostId,
        players: new Map([[hostId, host]]),
        createdAt: Date.now(),
    };
    rooms.set(code, room);
    return room;
}

export function joinRoom(code: string, playerId: string, nickname: string): Room | null {
    const room = rooms.get(code);
    if (!room) return null;
    const player: Player = { id: playerId, nickname, score: 0, status: 'alive', joinedAt: Date.now() };
    room.players.set(playerId, player);
    return room;
}

export function updatePlayerScore(code: string, playerId: string, score: number, status: 'alive' | 'blotted'): Room | null {
    const room = rooms.get(code);
    if (!room) return null;
    const player = room.players.get(playerId);
    if (player) { player.score = score; player.status = status; }
    return room;
}

export function removePlayer(playerId: string): { room: Room; code: string } | null {
    for (const [code, room] of rooms.entries()) {
        if (room.players.has(playerId)) {
            room.players.delete(playerId);
            if (room.players.size === 0) rooms.delete(code);
            return { room, code };
        }
    }
    return null;
}

export function getLeaderboard(room: Room): Player[] {
    return Array.from(room.players.values()).sort((a, b) => b.score - a.score);
}

export function getRoomByCode(code: string): Room | undefined {
    return rooms.get(code);
}
