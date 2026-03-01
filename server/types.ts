export interface Player {
    id: string;          // socket id
    nickname: string;
    score: number;
    status: 'alive' | 'blotted';
    joinedAt: number;
}

export interface Room {
    code: string;
    hostId: string;
    players: Map<string, Player>;
    createdAt: number;
}

export interface RoomStore {
    rooms: Map<string, Room>;
}
