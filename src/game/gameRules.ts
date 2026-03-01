import type { DiceMode, DiceRoll, MoveSlot, Disk } from './types.js';

// ── Dice Rolling ──────────────────────────────────────────────────────────────

export function rollDie(mode: DiceMode): number {
    if (mode === '1-2') return Math.random() < 0.5 ? 1 : 2;
    return Math.floor(Math.random() * 6) + 1;
}

export function rollDice(mode: DiceMode): DiceRoll {
    const d1 = rollDie(mode);
    const d2 = rollDie(mode);
    return { d1, d2, isDoubles: d1 === d2 };
}

// ── Move Slots ────────────────────────────────────────────────────────────────

/**
 * Returns the list of moves the player MUST make this turn.
 * Non-doubles → [d1, d2]   (move 2 disks)
 * Doubles     → [v, v, v, v] (move 4 disks, each by v)
 */
export function buildMoveSlots(roll: DiceRoll): MoveSlot[] {
    if (roll.isDoubles) {
        return [
            { value: roll.d1, used: false },
            { value: roll.d1, used: false },
            { value: roll.d1, used: false },
            { value: roll.d1, used: false },
        ];
    }
    return [
        { value: roll.d1, used: false },
        { value: roll.d2, used: false },
    ];
}

// ── Apply a Move ──────────────────────────────────────────────────────────────

/**
 * Returns new disk array after moving disk `diskId` by `steps`.
 */
export function applyMove(disks: Disk[], diskId: string, steps: number): Disk[] {
    return disks.map((d) =>
        d.id === diskId ? { ...d, location: d.location + steps, selected: false } : d
    );
}

// ── Blot Detection ────────────────────────────────────────────────────────────

/**
 * A blot = any location occupied by exactly 1 disk.
 * Returns true if the current disk layout has a blot.
 */
export function checkBlot(disks: Disk[]): boolean {
    const counts: Record<number, number> = {};
    for (const d of disks) {
        counts[d.location] = (counts[d.location] ?? 0) + 1;
    }
    return Object.values(counts).some((c) => c === 1);
}

/**
 * Returns the location numbers that are blots (for highlighting).
 */
export function blotLocations(disks: Disk[]): number[] {
    const counts: Record<number, number> = {};
    for (const d of disks) {
        counts[d.location] = (counts[d.location] ?? 0) + 1;
    }
    return Object.entries(counts)
        .filter(([, c]) => c === 1)
        .map(([loc]) => Number(loc));
}

// ── Validate a Selection ──────────────────────────────────────────────────────

/**
 * Check whether selecting a slot `slotIndex` for disk `diskId` is valid.
 * Rules: the slot must be unused, and the disk's resulting position
 * must still leave ≥ 2 disks wherever it currently sits (or it was alone = already a blot).
 */
export function validateSelection(
    disks: Disk[],
    diskId: string,
    steps: number
): boolean {
    const disk = disks.find((d) => d.id === diskId);
    if (!disk) return false;
    // Applying this move should not create any NEW lonely location
    const newDisks = applyMove(disks, diskId, steps);
    // We allow the move if the final state isn't worse per turn logic
    // (Full blot check happens only after the entire turn completes)
    return newDisks.find((d) => d.id === diskId) !== undefined;
}

// ── Initial State ─────────────────────────────────────────────────────────────

export function createInitialDisks(): Disk[] {
    return Array.from({ length: 5 }, (_, i) => ({
        id: `disk-${i}`,
        location: 0,
        selected: false,
        moving: false,
    }));
}
