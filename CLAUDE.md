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

### Real-time Multiplayer (`server/`)
- `server/index.ts` — Express 5 + Socket.IO server on `process.env.PORT ?? 3001`
- `server/roomManager.ts` — In-memory `Map` of rooms (no persistence; rooms lost on restart)
- Key Socket.IO events: `create-room`, `join-room`, `score-update`, `disconnect`, `request-leaderboard`

### Audio
Entirely procedural via Web Audio API in `src/hooks/useSound.ts` — no audio asset files.

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
