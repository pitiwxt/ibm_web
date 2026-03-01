import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Suspense } from 'react';
import * as THREE from 'three';

import SceneLighting from './SceneLighting.js';
import BoardTrack, { SLOT_SPACING } from './BoardTrack.js';
import DiskPiece from './DiskPiece.js';
import DicePhysics from './DicePhysics.js';
import { useGameStore } from '../../game/gameStore.js';
import { blotLocations } from '../../game/gameRules.js';

interface GameSceneProps {
    onDiskClick?: (diskId: string) => void;
    rollTrigger: number;
    selectableSlotIndex: number | null;
    rolling: boolean;
    d1Value?: number;
    d2Value?: number;
}

function SceneInner({ onDiskClick, rollTrigger, selectableSlotIndex, rolling, d1Value, d2Value }: GameSceneProps) {
    const { disks, moveSlots, phase, settings } = useGameStore();

    // Group disks by location
    const disksByLocation = disks.reduce((acc, d) => {
        (acc[d.location] = acc[d.location] ?? []).push(d);
        return acc;
    }, {} as Record<number, typeof disks>);

    const blots = phase === 'gameover' ? blotLocations(disks) : [];
    // Board track scrolls – camera stays fixed
    const avgLocation = disks.reduce((s, d) => s + d.location, 0) / disks.length;
    const boardScrollX = avgLocation * SLOT_SPACING;

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
                    <BoardTrack cameraX={boardScrollX} />

                    {/* Render disks */}
                    {Object.entries(disksByLocation).map(([loc, disksHere]) =>
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
                        ))
                    )}

                    {/* Dice – visual only */}
                    <DicePhysics
                        rollTrigger={rollTrigger}
                        mode={settings.diceMode}
                        rolling={rolling}
                        d1Value={d1Value}
                        d2Value={d2Value}
                    />
                </Physics>
            </Suspense>

            {/* Camera stays fixed – only the board scrolls */}
            <OrbitControls
                target={[0, 0, 0]}
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
    const shadowMapSize = settings.quality === 'high' ? 2048 : settings.quality === 'medium' ? 1024 : 512;

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
