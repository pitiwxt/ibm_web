import { useRef, useState, useEffect } from 'react';
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

    // Target resting position in world space
    const targetX = disk.location * SLOT_SPACING;
    const targetY = DISK_HEIGHT / 2 + indexAtLocation * STACK_GAP;
    const targetZ = (indexAtLocation - (totalAtLocation - 1) / 2) * 0.01;

    // Trigger arc animation when disk.location changes (useEffect = correct place for side-effects)
    useEffect(() => {
        if (!meshRef.current) return;
        if (prevLocation.current === disk.location) return;

        const fromX = prevLocation.current * SLOT_SPACING;
        const toX = targetX;
        prevLocation.current = disk.location;
        isAnimating.current = true;

        const midY = 1.8 + Math.abs(toX - fromX) * 0.15;
        const proxy = { t: 0, rotation: 0 };

        gsap.killTweensOf(proxy);
        gsap.to(proxy, {
            duration: 0.55,
            ease: 'power2.inOut',
            t: 1,
            rotation: Math.PI * 2,
            onUpdate: () => {
                if (!meshRef.current) return;
                const x = THREE.MathUtils.lerp(fromX, toX, proxy.t);
                const arcY = 4 * (midY - targetY) * proxy.t * (1 - proxy.t) + targetY;
                meshRef.current.position.x = x;
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

    // Single useFrame: lerp to resting position when idle, and keep glow glued to the disk
    useFrame(() => {
        const mesh = meshRef.current;
        const glow = glowRef.current;

        if (mesh && !isAnimating.current) {
            mesh.position.x = THREE.MathUtils.lerp(mesh.position.x, targetX, 0.15);
            mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, targetY, 0.15);
            mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, targetZ, 0.15);
        }

        // Glow tracks the disk every frame — including mid-arc
        if (glow) {
            if (mesh) glow.position.copy(mesh.position);
            const scale = isSelectable ? 1 + Math.sin(Date.now() * 0.004) * 0.12 : 1;
            glow.scale.setScalar(scale);
            glow.visible = isSelectable || isBlot;
        }
    });

    function handleClick(e: ThreeEvent<MouseEvent>) {
        e.stopPropagation();
        if (isSelectable) onClick?.(disk.id);
    }

    return (
        <group>
            <mesh
                ref={meshRef}
                position={[targetX, targetY, targetZ]}
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
                    <meshBasicMaterial
                        color={isBlot ? '#fca5a5' : '#ffffff'}
                        transparent
                        opacity={0.25}
                    />
                </mesh>
                {/* Rim edge torus */}
                <mesh position={[0, 0, 0]}>
                    <torusGeometry args={[DISK_RADIUS, 0.03, 8, 32]} />
                    <meshStandardMaterial
                        color={isBlot ? '#fca5a5' : baseColor}
                        emissive={isBlot ? '#fca5a5' : baseColor}
                        emissiveIntensity={0.4}
                    />
                </mesh>
            </mesh>

            {/* Glow ring — position synced every frame in useFrame above */}
            <mesh ref={glowRef} position={[targetX, targetY, targetZ]} visible={false}>
                <cylinderGeometry args={[DISK_RADIUS + 0.18, DISK_RADIUS + 0.18, 0.04, 32]} />
                <meshBasicMaterial
                    color={isBlot ? '#ef4444' : '#5c7cfa'}
                    transparent
                    opacity={0.4}
                />
            </mesh>
        </group>
    );
}
