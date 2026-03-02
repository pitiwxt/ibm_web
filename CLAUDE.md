# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A multiplayer educational backgammon-survival game. Teachers host a room (visible via QR code/room code), students join and play on a 3D board. The leaderboard updates in real-time via Socket.IO. Students are eliminated when a "blot" condition is detected (any track position with exactly 1 disk).

## Commands

```bash
# Install dependencies
npm install

# Start both frontend (Vite, port 5173) and backend (Express, port 3001) concurrently
npm run dev

# Build for production (TypeScript check + Vite bundle → /dist)
npm run build

# Lint
npm run lint

# Preview production build
npm run preview
```

There is no test runner configured.

## Known Issues

**`src/components/3d/GameScene.tsx` has unresolved git merge conflicts** (lines 5–127). The file has `<<<<<<< HEAD` / `>>>>>>>` markers scattered throughout. The two branches differ on whether the board scrolls (`cameraX` prop on `BoardTrack`) or the camera pans to follow disks (OrbitControls `target`). The HEAD branch also passes `occupiedSlots/minSlot/maxSlot` to `BoardTrack`. The file currently renders but is inconsistent — resolve before modifying 3D rendering.

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_SERVER_URL` | `http://localhost:3001` | Frontend socket connection target |
| `PORT` | `3001` | Backend server port |

## Architecture

### Routing (3 routes)
- `/` → `MainMenu` — create or join a room
- `/host` → `HostPage` — teacher dashboard (QR code, live leaderboard)
- `/play/:roomCode` → `ClientPage` — student 3D game board

### State Management
Zustand store at `src/game/gameStore.ts` with three combined slices:
- **GameSlice** — disk positions, turn phase (`idle|rolling|selecting|animating|gameover`), dice roll, move slots, undo history
- **SettingsSlice** — dice mode (`1-2` vs `1-6`), sound/music toggles, render quality
- **RoomSlice** — room code, nickname, isHost flag, leaderboard array

### Game Logic (`src/game/gameRules.ts`)
Pure functions: `rollDice`, `buildMoveSlots`, `applyMove`, `checkBlot`, `createInitialDisks`. No side effects — called from the Zustand store actions.

### 3D Rendering (`src/components/3d/`)
React Three Fiber canvas wrapping Three.js. `@react-three/rapier` provides physics for dice rolling. `@react-spring/three` and GSAP handle animations.

`BoardTrack.tsx` exports the `SLOT_SPACING` constant used to calculate `boardScrollX = avgLocation * SLOT_SPACING` for camera/board positioning.

The `settings.quality` field only affects `gl.antialias` on the Canvas (`antialias: quality !== 'low'`). It has no other rendering effect.

### Real-time Multiplayer (`server/`)
- `server/index.ts` — Express 5 + Socket.IO server on `process.env.PORT ?? 3001`
- `server/roomManager.ts` — In-memory `Map` of rooms (no persistence; rooms lost on restart)
- `server/types.ts` — `Player`, `Room`, `RoomStore` interfaces
- Key Socket.IO events: `create-room`, `join-room`, `score-update`, `disconnect`, `request-leaderboard`

`getSocket()` in `src/hooks/useSocket.ts` is a module-level singleton (not React-scoped), exported for use outside hooks. Rooms auto-delete when the last player disconnects.

Score transmitted to server = turn count. When phase becomes `gameover`, status is set to `'blotted'` and emitted via `score-update`.

### Game Phase State Machine
```
idle → (roll button) → rolling → (2 s timer) → selecting → (all slots used) → idle
                                                                              ↓ (if checkBlot)
                                                                          gameover
```
**Key:** Dice values are computed immediately on roll; the 2-second animation is purely visual and independent of computed state. `checkBlot()` runs only after **all** move slots are consumed in `selectDisk`, not incrementally after each move.

### Move Slot Rules
- Non-doubles → 2 slots `[d1, d2]`
- Doubles → 4 slots `[d1, d1, d1, d1]`
- Player must exhaust all slots; unused slots are forfeited when the player clicks "End Turn"

### Audio
Entirely procedural via Web Audio API in `src/hooks/useSound.ts` — no audio asset files. Implements Bach Minuet in G (BWV Anh. 114) as an infinite loop using oscillators scheduled with a 4-beat lookahead buffer. Call `unlockAudio()` on first user interaction to satisfy browser autoplay policy.

## Key Technology Choices

| Concern | Library |
|---|---|
| State | Zustand 5 (not Redux) |
| 3D | Three.js via React Three Fiber |
| Physics | `@react-three/rapier` (Rapier WASM) |
| Animations | React Spring + GSAP |
| Styling | Tailwind CSS 3 with custom dark color palette |
| Realtime | Socket.IO 4 |
| Build | Vite 7 + tsx (server dev) |

## TypeScript Setup

Three separate `tsconfig` files composed via references:
- `tsconfig.app.json` — frontend (target ES2022, bundler module resolution)
- `tsconfig.node.json` — Vite config
- `tsconfig.server.json` — Express server

Strict mode is on, but `noUnusedLocals` and `noUnusedParameters` are disabled.
