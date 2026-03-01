import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';


const SLOT_SPACING = 2;
const VISIBLE_SLOTS = 20;

interface BoardTrackProps {
    cameraX?: number;
}

export default function BoardTrack({ cameraX = 0 }: BoardTrackProps) {
    const groupRef = useRef<THREE.Group>(null);

    // Generate slot markers
    const slots = useMemo(() => {
        return Array.from({ length: VISIBLE_SLOTS }, (_, i) => i);
    }, []);

    useFrame(() => {
        if (!groupRef.current) return;
        // Slowly scroll the board to follow camera
        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, cameraX, 0.05);
    });

    return (
        <group ref={groupRef}>
            {/* Main track platform */}
            <mesh receiveShadow position={[SLOT_SPACING * VISIBLE_SLOTS * 0.5 - SLOT_SPACING, -0.35, 0]} castShadow={false}>
                <boxGeometry args={[SLOT_SPACING * VISIBLE_SLOTS + 4, 0.3, 3.5]} />
                <meshStandardMaterial color="#0d0d24" roughness={0.8} metalness={0.3} />
            </mesh>

            {/* Glowing edge strips */}
            {[-1.6, 1.6].map((z, idx) => (
                <mesh key={idx} position={[SLOT_SPACING * VISIBLE_SLOTS * 0.5 - SLOT_SPACING, -0.19, z]}>
                    <boxGeometry args={[SLOT_SPACING * VISIBLE_SLOTS + 4, 0.04, 0.08]} />
                    <meshStandardMaterial color="#5c7cfa" emissive="#5c7cfa" emissiveIntensity={2} />
                </mesh>
            ))}

            {/* Slot markers */}
            {slots.map((i) => (
                <group key={i} position={[i * SLOT_SPACING, 0, 0]}>
                    {/* Slot circle */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.19, 0]}>
                        <ringGeometry args={[0.45, 0.55, 32]} />
                        <meshStandardMaterial color="#4263eb" emissive="#4263eb" emissiveIntensity={0.5} transparent opacity={0.8} />
                    </mesh>

                    {/* Slot number label */}
                    {i % 2 === 0 && (
                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]}>
                            <planeGeometry args={[0.6, 0.4]} />
                            <meshBasicMaterial transparent opacity={0} />
                        </mesh>
                    )}
                </group>
            ))}

            {/* Atmospheric fog plane below */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[SLOT_SPACING * VISIBLE_SLOTS * 0.5 - SLOT_SPACING, -2, 0]}>
                <planeGeometry args={[SLOT_SPACING * VISIBLE_SLOTS + 20, 20]} />
                <meshBasicMaterial color="#050510" transparent opacity={0.9} />
            </mesh>
        </group>
    );
}

export { SLOT_SPACING };
