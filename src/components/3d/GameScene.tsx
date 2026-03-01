import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Suspense } from 'react';

import SceneLighting from './SceneLighting.js';
import BoardTrack, { SLOT_SPACING } from './BoardTrack.js';
import DiskPiece from './DiskPiece.js';
import DicePhysics from './DicePhysics.js';
import { useGameStore } from '../../game/gameStore.js';
import { blotLocations } from '../../game/gameRules.js';

interface GameSceneProps {
    onRollResult?: (d1: number, d2: number) => void;
    onDiskClick?: (diskId: string) => void;
    rollTrigger: number;
    selectableSlotIndex: number | null;
}

function SceneInner({ onRollResult, onDiskClick, rollTrigger }: GameSceneProps) {
    const { disks, moveSlots, phase, settings } = useGameStore();

    // Group disks by location for stacking
    const disksByLocation = disks.reduce(
        (acc, d) => {
            (acc[d.location] = acc[d.location] ?? []).push(d);
            return acc;
        },
        {} as Record<number, typeof disks>,
    );

    const blots = phase === 'gameover' ? blotLocations(disks) : [];

    // Camera target: average disk position (OrbitControls pans the camera, not the board)
    const avgLocation = disks.reduce((s, d) => s + d.location, 0) / disks.length;
    const cameraTargetX = avgLocation * SLOT_SPACING;

    // Slot range for the board — determines which rings to render
    const locations = disks.map((d) => d.location);
    const minSlot = Math.min(...locations);
    const maxSlot = Math.max(...locations);

    const occupiedSlots = new Set(Object.keys(disksByLocation).map(Number));

    const availableSlots = moveSlots
        .map((s, i) => (!s.used ? i : null))
        .filter((i) => i !== null) as number[];
    const isSelectable = phase === 'selecting' && availableSlots.length > 0;

    return (
        <>
            <fog attach="fog" args={['#050510', 20, 60]} />
            <SceneLighting />
            <Stars radius={60} depth={30} count={2000} factor={3} fade speed={0.5} />

            <Suspense fallback={null}>
                <Physics gravity={[0, -12, 0]}>
                    {/* Board sits at fixed world positions — no group movement */}
                    <BoardTrack
                        occupiedSlots={occupiedSlots}
                        minSlot={minSlot}
                        maxSlot={maxSlot}
                    />

                    {Object.entries(disksByLocation).map(([, disksHere]) =>
                        disksHere.map((disk, idx) => (
                            <DiskPiece
                                key={disk.id}
                                disk={disk}
                                isSelectable={isSelectable}
                                isBlot={blots.includes(disk.location)}
                                onClick={onDiskClick}
                                totalAtLocation={disksHere.length}
                                indexAtLocation={idx}
                            />
                        )),
                    )}

                    <DicePhysics
                        rollTrigger={rollTrigger}
                        onRollResult={onRollResult}
                        mode={settings.diceMode}
                    />
                </Physics>
            </Suspense>

            {/* Camera pans to follow the average disk position */}
            <OrbitControls
                target={[cameraTargetX, 0, 0]}
                minDistance={5}
                maxDistance={20}
                maxPolarAngle={Math.PI / 2.2}
                enablePan={false}
                makeDefault
            />
        </>
    );
}

export default function GameScene(props: GameSceneProps) {
    const { settings } = useGameStore();

    return (
        <Canvas
            shadows
            camera={{ position: [0, 8, 14], fov: 55, near: 0.1, far: 200 }}
            gl={{ antialias: settings.quality !== 'low', powerPreference: 'high-performance' }}
            style={{ background: 'linear-gradient(180deg, #050510 0%, #0a0a1f 100%)' }}
        >
            <SceneInner {...props} />
        </Canvas>
    );
}
