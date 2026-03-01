import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import type { Disk } from '../../game/types.js';
import { SLOT_SPACING } from './BoardTrack.js';

interface DiskPieceProps {
    disk: Disk;
    isSelectable: boolean;
    isBlot?: boolean;
    onClick?: (diskId: string) => void;
    totalAtLocation: number;
    indexAtLocation: number;
}

const COLORS = ['#5c7cfa', '#f59e0b', '#10b981', '#f43f5e', '#a855f7'];
const DISK_RADIUS = 0.38;
const DISK_HEIGHT = 0.18;
const STACK_GAP = 0.22;

export default function DiskPiece({
    disk,
    isSelectable,
    isBlot = false,
    onClick,
    totalAtLocation,
    indexAtLocation,
}: DiskPieceProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const prevLocation = useRef(disk.location);
    const isAnimating = useRef(false);
    const [hovered, setHovered] = useState(false);

    const colorIndex = parseInt(disk.id.split('-')[1]) % COLORS.length;
    const baseColor = COLORS[colorIndex];

    // Target X position based on slot
    const targetX = disk.location * SLOT_SPACING;
    // Stack disks vertically at same location
    const targetY = DISK_HEIGHT / 2 + indexAtLocation * STACK_GAP;
    // Slight Z spread at same location
    const targetZ = (indexAtLocation - (totalAtLocation - 1) / 2) * 0.01;

    useEffect(() => {
        if (!meshRef.current) return;
        if (prevLocation.current === disk.location) return;

        const fromX = prevLocation.current * SLOT_SPACING;
        const toX = targetX;
        const midY = 1.8 + Math.abs(toX - fromX) * 0.15;
        prevLocation.current = disk.location;
        isAnimating.current = true;

        // Arc trajectory via GSAP
        const proxy = { x: fromX, y: meshRef.current.position.y, rotation: 0 };
        gsap.to(proxy, {
            duration: 0.55,
            ease: 'power2.inOut',
            x: toX,
            y: midY,
            rotation: Math.PI * 2,
            onUpdate: () => {
                if (!meshRef.current) return;
                const t = proxy.x === toX ? 1 : (proxy.x - fromX) / (toX - fromX);
                const arcY = 4 * (midY - targetY) * t * (1 - t) + targetY;
                meshRef.current.position.x = proxy.x;
                meshRef.current.position.y = Math.max(arcY, targetY);
                meshRef.current.rotation.z = proxy.rotation;
            },
            onComplete: () => {
                if (meshRef.current) {
                    meshRef.current.position.set(toX, targetY, targetZ);
                    meshRef.current.rotation.z = 0;
                }
                isAnimating.current = false;
            },
        });
    }, [disk.location, targetX, targetY, targetZ]);

    // Snap to position if not animating
    useFrame(() => {
        if (!meshRef.current || isAnimating.current) return;
        meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.15);
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.15);
        meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 0.15);
    });

    // Glow pulse for selectable disks
    useFrame(() => {
        if (!glowRef.current) return;
        const scale = isSelectable ? 1 + Math.sin(Date.now() * 0.004) * 0.12 : 1;
        glowRef.current.scale.setScalar(scale);
        glowRef.current.visible = isSelectable || isBlot;
    });

    function handleClick(e: ThreeEvent<MouseEvent>) {
        e.stopPropagation();
        if (isSelectable) onClick?.(disk.id);
    }

    return (
        <group>
            <mesh
                ref={meshRef}
                position={[prevLocation.current * SLOT_SPACING, targetY, targetZ]}
                castShadow
                receiveShadow
                onClick={handleClick}
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
            >
                <cylinderGeometry args={[DISK_RADIUS, DISK_RADIUS, DISK_HEIGHT, 32]} />
                <meshStandardMaterial
                    color={isBlot ? '#ef4444' : baseColor}
                    emissive={isBlot ? '#ef4444' : hovered && isSelectable ? baseColor : '#000'}
                    emissiveIntensity={isBlot ? 0.8 : hovered ? 0.6 : 0}
                    roughness={0.3}
                    metalness={0.5}
                />
                {/* Top face highlight ring */}
                <mesh position={[0, DISK_HEIGHT / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[DISK_RADIUS * 0.4, DISK_RADIUS * 0.85, 32]} />
                    <meshBasicMaterial color={isBlot ? '#fca5a5' : '#ffffff'} transparent opacity={0.25} />
                </mesh>
            </mesh>

            {/* Glow indicator */}
            <mesh ref={glowRef} position={[prevLocation.current * SLOT_SPACING, targetY, targetZ]}>
                <cylinderGeometry args={[DISK_RADIUS + 0.15, DISK_RADIUS + 0.15, 0.04, 32]} />
                <meshBasicMaterial color={isBlot ? '#ef4444' : '#5c7cfa'} transparent opacity={0.35} />
            </mesh>
        </group>
    );
}
