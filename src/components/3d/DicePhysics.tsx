/**
 * DicePhysics.tsx – Visual-only 3D dice with dot faces
 * No Rapier physics – just spinning cubes with proper die face dots.
 * Roll values come from rollDice() in ClientPage.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Dot positions for each face (x, y on face from -0.28 to 0.28)
const FACE_DOTS: Record<number, [number, number][]> = {
    1: [[0, 0]],
    2: [[-0.22, -0.22], [0.22, 0.22]],
    3: [[-0.22, -0.22], [0, 0], [0.22, 0.22]],
    4: [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]],
    5: [[-0.22, -0.22], [0.22, -0.22], [0, 0], [-0.22, 0.22], [0.22, 0.22]],
    6: [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0], [0.22, 0], [-0.22, 0.22], [0.22, 0.22]],
};

// Builds a group with all 6 faces of dots embedded on the cube surface
function DieDots({ dotColor }: { dotColor: string }) {
    // 6 faces: +Y, -Y, +X, -X, +Z, -Z → values 1,6,2,5,3,4
    const faces: Array<{ val: number; pos: [number, number, number]; up: [number, number, number] }> = [
        { val: 1, pos: [0, 0.46, 0], up: [0, 1, 0] },   // top
        { val: 6, pos: [0, -0.46, 0], up: [0, -1, 0] },  // bottom
        { val: 2, pos: [0.46, 0, 0], up: [1, 0, 0] },    // right
        { val: 5, pos: [-0.46, 0, 0], up: [-1, 0, 0] },  // left
        { val: 3, pos: [0, 0, 0.46], up: [0, 0, 1] },    // front
        { val: 4, pos: [0, 0, -0.46], up: [0, 0, -1] },  // back
    ];

    return (
        <>
            {faces.map(({ val, pos, up }) => {
                const dots = FACE_DOTS[val] ?? [];
                return dots.map(([dx, dy], di) => {
                    // Compute world position of dot on face
                    const normal = new THREE.Vector3(...up);
                    // Create two tangent vectors
                    const t1 = new THREE.Vector3(normal.y === 0 ? 0 : 1, normal.x === 0 && normal.z === 0 ? 0 : 1, 0)
                        .cross(normal).normalize();
                    if (t1.lengthSq() < 0.01) t1.set(1, 0, 0);
                    const t2 = normal.clone().cross(t1).normalize();

                    const dotPos = new THREE.Vector3(...pos)
                        .addScaledVector(t1, dx)
                        .addScaledVector(t2, dy);

                    return (
                        <mesh key={`f${val}-d${di}`} position={dotPos.toArray() as [number, number, number]}>
                            <sphereGeometry args={[0.055, 8, 8]} />
                            <meshStandardMaterial color={dotColor} roughness={0.8} />
                        </mesh>
                    );
                });
            })}
        </>
    );
}

interface VisualDieProps {
    position: [number, number, number];
    color: string;
    rolling: boolean;
}

function VisualDie({ position, color, rolling }: VisualDieProps) {
    const groupRef = useRef<THREE.Group>(null);
    const vx = useRef(7 + Math.random() * 5);
    const vy = useRef(11 + Math.random() * 6);
    const vz = useRef(5 + Math.random() * 4);

    // Reset spin speed when roll starts
    if (rolling && vx.current < 4) {
        vx.current = 7 + Math.random() * 5;
        vy.current = 11 + Math.random() * 6;
        vz.current = 5 + Math.random() * 4;
    }

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        if (rolling) {
            groupRef.current.rotation.x += delta * vx.current;
            groupRef.current.rotation.y += delta * vy.current;
            groupRef.current.rotation.z += delta * vz.current;
        } else {
            // Slow down smoothly
            vx.current *= 0.85;
            vy.current *= 0.85;
            vz.current *= 0.85;
            groupRef.current.rotation.x += delta * vx.current;
            groupRef.current.rotation.y += delta * vy.current;
            groupRef.current.rotation.z += delta * vz.current;
        }
    });

    const dotColor = '#0a0a18';

    return (
        <group ref={groupRef} position={position}>
            {/* Die body */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[0.9, 0.9, 0.9]} />
                <meshStandardMaterial
                    color={color}
                    roughness={0.25}
                    metalness={0.35}
                    emissive={rolling ? color : '#000000'}
                    emissiveIntensity={rolling ? 0.5 : 0}
                />
            </mesh>
            {/* Dot faces */}
            <DieDots dotColor={dotColor} />
        </group>
    );
}

interface DicePhysicsProps {
    rollTrigger: number;
    onRollResult?: (d1: number, d2: number) => void;
    mode: '1-2' | '1-6';
    rolling: boolean;
    d1Value?: number;
    d2Value?: number;
}

export default function DicePhysics({ rolling }: DicePhysicsProps) {
    return (
        <group position={[0, 1.5, 5]}>
            {/* Tray floor */}
            <mesh position={[0, -0.2, 0]} receiveShadow>
                <boxGeometry args={[6, 0.2, 4]} />
                <meshStandardMaterial color="#0c0c22" roughness={0.9} transparent opacity={0.9} />
            </mesh>
            {/* Glowing border */}
            <mesh position={[0, -0.08, 0]}>
                <boxGeometry args={[5.7, 0.02, 3.6]} />
                <meshStandardMaterial color="#5c7cfa" emissive="#5c7cfa" emissiveIntensity={1.8} transparent opacity={0.55} />
            </mesh>
            {/* Left wall */}
            <mesh position={[-2.9, 0.5, 0]}>
                <boxGeometry args={[0.15, 1.2, 4]} />
                <meshStandardMaterial color="#14143a" transparent opacity={0.6} />
            </mesh>
            {/* Right wall */}
            <mesh position={[2.9, 0.5, 0]}>
                <boxGeometry args={[0.15, 1.2, 4]} />
                <meshStandardMaterial color="#14143a" transparent opacity={0.6} />
            </mesh>

            {/* The two dice */}
            <VisualDie position={[-1.3, 0.55, 0]} color="#5c7cfa" rolling={rolling} />
            <VisualDie position={[1.3, 0.55, 0]} color="#f59e0b" rolling={rolling} />
        </group>
    );
}
