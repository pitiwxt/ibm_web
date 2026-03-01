// ===== Shared Frontend Types =====

export type DiceMode = '1-2' | '1-6';
export type GamePhase = 'idle' | 'rolling' | 'selecting' | 'animating' | 'gameover';
export type PlayerStatus = 'alive' | 'blotted';

export interface Disk {
    id: string;
    location: number;   // which slot (0, 1, 2, …)
    selected: boolean;
    moving: boolean;
}

export interface DiceRoll {
    d1: number;
    d2: number;
    isDoubles: boolean;
}

export interface MoveSlot {
    value: number;   // die face value — steps to move
    used: boolean;
}

export interface LeaderboardEntry {
    id: string;
    nickname: string;
    score: number;
    status: PlayerStatus;
}

export interface RoomInfo {
    code: string;
    nickname: string;
    isHost: boolean;
}

export type Quality = 'low' | 'medium' | 'high';

export interface GameSettings {
    diceMode: DiceMode;
    soundEnabled: boolean;
    musicEnabled: boolean;
    quality: Quality;
}
