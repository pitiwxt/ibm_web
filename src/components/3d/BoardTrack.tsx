import { useMemo } from 'react';
import { Text } from '@react-three/drei';

const SLOT_SPACING = 2;

interface BoardTrackProps {
    occupiedSlots?: Set<number>;
    /** Lowest slot currently occupied by any disk */
    minSlot?: number;
    /** Highest slot currently occupied by any disk */
    maxSlot?: number;
}

/**
 * Renders the board track at FIXED world-space positions.
 * Each ring at slot S lives at world-x = S * SLOT_SPACING — always aligned
 * with disk positions regardless of camera movement.
 */
export default function BoardTrack({
    occupiedSlots,
    minSlot = 0,
    maxSlot = 15,
}: BoardTrackProps) {
    // Render a small window around the actual disk range
    const startSlot = Math.max(0, minSlot - 2);
    const endSlot = maxSlot + 4;

    const slots = useMemo(
        () => Array.from({ length: endSlot - startSlot + 1 }, (_, i) => startSlot + i),
        [startSlot, endSlot],
    );

    const platformCenterX = ((startSlot + endSlot) / 2) * SLOT_SPACING;
    const platformWidth = (endSlot - startSlot + 1) * SLOT_SPACING + 4;

    return (
        <group>
            {/* Main track platform */}
            <mesh receiveShadow position={[platformCenterX, -0.35, 0]} castShadow={false}>
                <boxGeometry args={[platformWidth, 0.3, 3.5]} />
                <meshStandardMaterial color="#0d0d24" roughness={0.8} metalness={0.3} />
            </mesh>

            {/* Glowing edge strips */}
            {[-1.6, 1.6].map((z, idx) => (
                <mesh key={idx} position={[platformCenterX, -0.19, z]}>
                    <boxGeometry args={[platformWidth, 0.04, 0.08]} />
                    <meshStandardMaterial color="#5c7cfa" emissive="#5c7cfa" emissiveIntensity={2} />
                </mesh>
            ))}

            {/* Slot markers — each at exact world-x for its slot number */}
            {slots.map((slot) => {
                const isOccupied = occupiedSlots?.has(slot) ?? false;
                const showLabel = slot % 5 === 0;
                const wx = slot * SLOT_SPACING;

                return (
                    <group key={slot} position={[wx, 0, 0]}>
                        {/* Ring outline — turns amber when a disk is here */}
                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.19, 0]}>
                            <ringGeometry args={[0.45, 0.55, 32]} />
                            <meshStandardMaterial
                                color={isOccupied ? '#f59e0b' : '#4263eb'}
                                emissive={isOccupied ? '#f59e0b' : '#4263eb'}
                                emissiveIntensity={isOccupied ? 2.5 : 0.5}
                                transparent
                                opacity={isOccupied ? 1 : 0.8}
                            />
                        </mesh>

                        {/* Soft inner fill when occupied */}
                        {isOccupied && (
                            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.19, 0]}>
                                <circleGeometry args={[0.44, 32]} />
                                <meshBasicMaterial color="#f59e0b" transparent opacity={0.12} />
                            </mesh>
                        )}

                        {/* Numeric label every 5 slots */}
                        {showLabel && (
                            <Text
                                position={[0, -0.17, 1.75]}
                                rotation={[-Math.PI / 2, 0, 0]}
                                fontSize={0.28}
                                color="#6677bb"
                                anchorX="center"
                                anchorY="middle"
                                fillOpacity={0.75}
                            >
                                {slot.toString()}
                            </Text>
                        )}
                    </group>
                );
            })}

            {/* Atmospheric fog plane below */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[platformCenterX, -2, 0]}>
                <planeGeometry args={[platformWidth + 20, 20]} />
                <meshBasicMaterial color="#050510" transparent opacity={0.9} />
            </mesh>
        </group>
    );
}

export { SLOT_SPACING };
