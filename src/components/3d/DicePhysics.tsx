/**
 * DicePhysics.tsx – Visual-only spinning dice (NO physics engine)
 *
 * The actual dice values are computed instantly in ClientPage via rollDice().
 * This component just shows visually appealing spinning 3D dice during the
 * "rolling" animation window.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface VisualDieProps {
    position: [number, number, number];
    color: string;
    rolling: boolean;
    faceValue?: number;
}

const DIE_COLORS: Record<number, string> = {
    1: '#ffffff', 2: '#ffffff', 3: '#ffffff',
    4: '#ffffff', 5: '#ffffff', 6: '#ffffff',
};

function VisualDie({ position, color, rolling, faceValue }: VisualDieProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const speedRef = useRef({ x: 8, y: 12, z: 6 });

    useFrame((_, delta) => {
        if (!meshRef.current) return;

        if (rolling) {
            // Spin fast while rolling
            meshRef.current.rotation.x += delta * speedRef.current.x;
            meshRef.current.rotation.y += delta * speedRef.current.y;
            meshRef.current.rotation.z += delta * speedRef.current.z;
        } else {
            // Decelerate smoothly to rest
            speedRef.current.x *= 0.88;
            speedRef.current.y *= 0.88;
            speedRef.current.z *= 0.88;
            meshRef.current.rotation.x += delta * speedRef.current.x;
            meshRef.current.rotation.y += delta * speedRef.current.y;
            meshRef.current.rotation.z += delta * speedRef.current.z;

            // Once nearly stopped, snap to showing face 1 on top
            if (Math.abs(speedRef.current.x) < 0.2) {
                speedRef.current = { x: 0, y: 0, z: 0 };
                meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.12);
                meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, 0.12);
            }
        }
    });

    // Reset speed when rolling starts
    if (rolling && speedRef.current.x < 5) {
        speedRef.current = { x: 8 + Math.random() * 4, y: 12 + Math.random() * 6, z: 6 + Math.random() * 3 };
    }

    return (
        <mesh ref={meshRef} position={position} castShadow>
            <boxGeometry args={[0.9, 0.9, 0.9]} />
            <meshStandardMaterial
                color={color}
                roughness={0.2}
                metalness={0.4}
                emissive={rolling ? color : '#000000'}
                emissiveIntensity={rolling ? 0.4 : 0}
            />
        </mesh>
    );
}

interface DicePhysicsProps {
    rollTrigger: number;
    onRollResult?: (d1: number, d2: number) => void; // kept for API compat, not used
    mode: '1-2' | '1-6';
    rolling: boolean;
    d1Value?: number;
    d2Value?: number;
}

export default function DicePhysics({ rolling, d1Value, d2Value }: DicePhysicsProps) {
    return (
        <group position={[0, 1.5, 5]}>
            {/* Tray floor - static mesh, no physics */}
            <mesh position={[0, -0.2, 0]} receiveShadow>
                <boxGeometry args={[6, 0.2, 3.5]} />
                <meshStandardMaterial color="#0d0d24" roughness={0.9} transparent opacity={0.85} />
            </mesh>

            {/* Glow border */}
            <mesh position={[0, -0.09, 0]}>
                <boxGeometry args={[5.8, 0.02, 3.2]} />
                <meshStandardMaterial color="#5c7cfa" emissive="#5c7cfa" emissiveIntensity={1.5} transparent opacity={0.5} />
            </mesh>

            {/* The two dice */}
            <VisualDie position={[-1.4, 0.5, 0]} color="#5c7cfa" rolling={rolling} faceValue={d1Value} />
            <VisualDie position={[1.4, 0.5, 0]} color="#f59e0b" rolling={rolling} faceValue={d2Value} />
        </group>
    );
}
