/**
 * DicePhysics.tsx – Reliable 3D dice with physics + timeout fallback
 *
 * Key fixes:
 * - Removed CuboidCollider (was creating double-collider chaos with mesh children)
 * - Added 5s timeout fallback so game never gets stuck
 * - Lower settle thresholds, faster detection
 * - Wrapped SFX in try-catch so audio failures don't crash physics
 */
import * as THREE from 'three';
import { useRef, useEffect, useState } from 'react';
import { RigidBody } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';

const FACE_NORMALS = [
    { normal: new THREE.Vector3(0, 1, 0), value: 1 },
    { normal: new THREE.Vector3(0, -1, 0), value: 6 },
    { normal: new THREE.Vector3(1, 0, 0), value: 2 },
    { normal: new THREE.Vector3(-1, 0, 0), value: 5 },
    { normal: new THREE.Vector3(0, 0, 1), value: 3 },
    { normal: new THREE.Vector3(0, 0, -1), value: 4 },
];

function getTopFace(quat: THREE.Quaternion): number {
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);
    let best = -Infinity, result = 1;
    for (const { normal, value } of FACE_NORMALS) {
        const d = up.dot(normal);
        if (d > best) { best = d; result = value; }
    }
    return result;
}

// Simple die dots for top face visual (rendered in HUD, not 3D geometry)
interface SingleDieProps {
    startPos: [number, number, number];
    color: string;
    rollTrigger: number;
    mode: '1-2' | '1-6';
    onSettled: (value: number) => void;
}

function SingleDie({ startPos, color, rollTrigger, mode, onSettled }: SingleDieProps) {
    const rbRef = useRef<RapierRigidBody>(null);
    const [glowing, setGlowing] = useState(false);
    const settledTimer = useRef(0);
    const hasSettled = useRef(false);
    const lastFire = useRef(-1);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (rollTrigger === 0 || rollTrigger === lastFire.current) return;
        lastFire.current = rollTrigger;
        hasSettled.current = false;
        settledTimer.current = 0;
        setGlowing(true);

        // Clear any pending timeout
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        const rb = rbRef.current;
        if (rb) {
            // Reset to starting position with random rotation
            const q = new THREE.Quaternion().setFromEuler(
                new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
            );
            rb.setTranslation(
                { x: startPos[0] + (Math.random() - 0.5) * 0.4, y: startPos[1], z: startPos[2] + (Math.random() - 0.5) * 0.3 },
                true
            );
            rb.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
            rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
            rb.setAngvel({ x: 0, y: 0, z: 0 }, true);

            // Apply impulse to throw the die
            rb.applyImpulse(
                {
                    x: (Math.random() - 0.5) * 3,
                    y: -(5 + Math.random() * 3),
                    z: (Math.random() - 0.5) * 2,
                },
                true
            );
            rb.applyTorqueImpulse(
                {
                    x: (Math.random() - 0.5) * 10,
                    y: (Math.random() - 0.5) * 10,
                    z: (Math.random() - 0.5) * 10,
                },
                true
            );
        }

        // === FALLBACK TIMEOUT ===
        // If dice don't settle in 5 seconds, force a random result
        timeoutRef.current = setTimeout(() => {
            if (hasSettled.current) return;
            hasSettled.current = true;
            setGlowing(false);
            let face = Math.ceil(Math.random() * 6);
            if (mode === '1-2') face = Math.random() < 0.5 ? 1 : 2;
            onSettled(face);
        }, 5000);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [rollTrigger]);

    useFrame((_, delta) => {
        if (!rbRef.current || hasSettled.current || rollTrigger === 0) return;

        const linVel = rbRef.current.linvel();
        const angVel = rbRef.current.angvel();
        const speed = Math.hypot(linVel.x, linVel.y, linVel.z);
        const angSpeed = Math.hypot(angVel.x, angVel.y, angVel.z);

        if (speed < 0.15 && angSpeed < 0.15) {
            settledTimer.current += delta;
            if (settledTimer.current > 0.6) {
                if (hasSettled.current) return;
                hasSettled.current = true;
                setGlowing(false);

                if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }

                const rot = rbRef.current.rotation();
                const quat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
                let face = getTopFace(quat);
                if (mode === '1-2') face = face <= 3 ? 1 : 2;

                // Try to play settle sound without crashing
                try {
                    import('../../hooks/useSound.js').then((m) => m.SFX.diceSettle());
                } catch {/* ignore */ }

                onSettled(face);
            }
        } else {
            settledTimer.current = 0;
        }
    });

    return (
        <RigidBody
            ref={rbRef}
            restitution={0.45}
            friction={0.65}
            linearDamping={0.4}
            angularDamping={0.3}
            position={startPos}
            colliders="cuboid"
        >
            <mesh castShadow receiveShadow>
                <boxGeometry args={[0.8, 0.8, 0.8]} />
                <meshStandardMaterial
                    color={color}
                    roughness={0.3}
                    metalness={0.3}
                    emissive={glowing ? color : '#000000'}
                    emissiveIntensity={glowing ? 0.5 : 0}
                />
            </mesh>
        </RigidBody>
    );
}

// ── Simple walled tray (no CuboidCollider – just flat box RigidBodies) ─────────

function DiceTray() {
    return (
        <group>
            {/* Floor */}
            <RigidBody type="fixed" position={[0, 0, 0]} colliders="cuboid">
                <mesh receiveShadow>
                    <boxGeometry args={[8, 0.3, 5]} />
                    <meshStandardMaterial color="#0d0d24" roughness={0.9} transparent opacity={0.9} />
                </mesh>
            </RigidBody>
            {/* Left wall */}
            <RigidBody type="fixed" position={[-4, 1, 0]} colliders="cuboid">
                <mesh>
                    <boxGeometry args={[0.3, 2, 5]} />
                    <meshStandardMaterial color="#1a1a38" transparent opacity={0.5} />
                </mesh>
            </RigidBody>
            {/* Right wall */}
            <RigidBody type="fixed" position={[4, 1, 0]} colliders="cuboid">
                <mesh>
                    <boxGeometry args={[0.3, 2, 5]} />
                    <meshStandardMaterial color="#1a1a38" transparent opacity={0.5} />
                </mesh>
            </RigidBody>
            {/* Front wall */}
            <RigidBody type="fixed" position={[0, 1, 2.5]} colliders="cuboid">
                <mesh>
                    <boxGeometry args={[8, 2, 0.3]} />
                    <meshStandardMaterial color="#1a1a38" transparent opacity={0.5} />
                </mesh>
            </RigidBody>
            {/* Back wall */}
            <RigidBody type="fixed" position={[0, 1, -2.5]} colliders="cuboid">
                <mesh>
                    <boxGeometry args={[8, 2, 0.3]} />
                    <meshStandardMaterial color="#1a1a38" transparent opacity={0.5} />
                </mesh>
            </RigidBody>
            {/* Glowing border lines */}
            <mesh position={[0, 0.16, 0]}>
                <boxGeometry args={[7.8, 0.02, 4.6]} />
                <meshStandardMaterial color="#5c7cfa" emissive="#5c7cfa" emissiveIntensity={1.5} transparent opacity={0.6} />
            </mesh>
        </group>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface DicePhysicsProps {
    rollTrigger: number;
    onRollResult?: (d1: number, d2: number) => void;
    mode: '1-2' | '1-6';
}

export default function DicePhysics({ rollTrigger, onRollResult, mode }: DicePhysicsProps) {
    const results = useRef<{ d1: number | null; d2: number | null }>({ d1: null, d2: null });

    useEffect(() => {
        results.current = { d1: null, d2: null };
    }, [rollTrigger]);

    function handleSettle(which: 'd1' | 'd2', value: number) {
        results.current[which] = value;
        if (results.current.d1 !== null && results.current.d2 !== null) {
            const { d1, d2 } = results.current;
            results.current = { d1: null, d2: null };
            onRollResult?.(d1, d2);
        }
    }

    return (
        <group position={[0, 1, 5]}>
            <DiceTray />
            <SingleDie
                startPos={[-1.5, 3, 0]}
                color="#5c7cfa"
                rollTrigger={rollTrigger}
                mode={mode}
                onSettled={(v) => handleSettle('d1', v)}
            />
            <SingleDie
                startPos={[1.5, 3, 0]}
                color="#f59e0b"
                rollTrigger={rollTrigger}
                mode={mode}
                onSettled={(v) => handleSettle('d2', v)}
            />
        </group>
    );
}
