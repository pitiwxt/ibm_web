import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket.js';
import { useGameStore } from '../game/gameStore.js';
import { buildMoveSlots, rollDice } from '../game/gameRules.js';
import { SFX, toggleMusic, unlockAudio } from '../hooks/useSound.js';
import GameScene from '../components/3d/GameScene.js';
import HUD from '../components/ui/HUD.js';
import GameOverModal from '../components/ui/GameOverModal.js';
import NicknameInput from '../components/ui/NicknameInput.js';
import SettingsMenu from '../components/ui/SettingsMenu.js';
import TutorialOverlay from '../components/ui/TutorialOverlay.js';

export default function ClientPage() {
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();
    const socket = useSocket();

    const { phase, turn, room, selectDisk, undoLastMove, setPhase, settings } = useGameStore();
    const [rollTrigger, setRollTrigger] = useState(0);
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showTutorial, setShowTutorial] = useState(true);
    const [joined, setJoined] = useState(!!room);
    // For visual dice display
    const [rollingAnim, setRollingAnim] = useState(false);
    const [d1Shown, setD1Shown] = useState<number | undefined>();
    const [d2Shown, setD2Shown] = useState<number | undefined>();
    const rollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevPhase = useRef<string>(phase);

    const code = roomCode ?? room?.code ?? '';

    // Sync score with server whenever turn changes
    useEffect(() => {
        if (!room || !code) return;
        socket.emit('score-update', {
            roomCode: code,
            score: turn,
            status: phase === 'gameover' ? 'blotted' : 'alive',
        });
    }, [turn, phase]);

    // Play/stop background music based on settings
    useEffect(() => {
        toggleMusic(settings.musicEnabled);
    }, [settings.musicEnabled]);

    // Sound on phase transitions
    useEffect(() => {
        if (prevPhase.current === 'selecting' && phase === 'idle') {
            SFX.turnSuccess();
        }
        if (phase === 'gameover' && prevPhase.current !== 'gameover') {
            SFX.blot();
        }
        prevPhase.current = phase;
    }, [phase]);

    function handleRoll() {
        if (phase !== 'idle') return;
        unlockAudio();
        SFX.roll();

        // 1. Compute dice values immediately (reliable)
        const roll = rollDice(settings.diceMode);

        // 2. Start visual spinning animation
        setRollingAnim(true);
        setRollTrigger((t) => t + 1);
        setPhase('rolling');

        // 3. After 2 seconds show result, update game state
        if (rollTimer.current) clearTimeout(rollTimer.current);
        rollTimer.current = setTimeout(() => {
            setD1Shown(roll.d1);
            setD2Shown(roll.d2);
            setRollingAnim(false);
            const slots = buildMoveSlots(roll);
            useGameStore.setState({ currentRoll: roll, moveSlots: slots, phase: 'selecting', moveHistory: [] });
        }, 2000);
    }

    function handleDiskClick(diskId: string) {
        if (selectedSlot === null) return;
        SFX.diskMove();
        selectDisk(diskId, selectedSlot);
        setSelectedSlot(null);
    }

    function handleSlotSelect(i: number) {
        setSelectedSlot((prev) => (prev === i ? null : i));
    }

    if (!joined) {
        return (
            <NicknameInput
                roomCode={code}
                onJoined={() => setJoined(true)}
            />
        );
    }

    return (
        <div className="fixed inset-0 overflow-hidden" onClick={unlockAudio}>
            {/* 3D Game Scene */}
            <div className="absolute inset-0">
                <GameScene
                    rollTrigger={rollTrigger}
                    onDiskClick={handleDiskClick}
                    selectableSlotIndex={selectedSlot}
                    rolling={rollingAnim}
                    d1Value={d1Shown}
                    d2Value={d2Shown}
                />
            </div>

            {/* Top HUD bar */}
            <div
                className="absolute top-0 inset-x-0 z-20 px-4 py-3 flex items-center justify-between"
                style={{ background: 'rgba(5,5,16,0.7)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(92,124,250,0.15)' }}
            >
                <div className="flex items-center gap-2">
                    <span className="text-xl">🎲</span>
                    <span className="text-white font-bold text-sm hidden sm:block">Backgammon Survival</span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Music toggle */}
                    <button
                        onClick={() => {
                            unlockAudio();
                            useGameStore.setState((s) => ({
                                ...s,
                                settings: { ...s.settings, musicEnabled: !s.settings.musicEnabled },
                            }));
                        }}
                        className="text-base px-2 py-1 rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
                        title={settings.musicEnabled ? 'Music On' : 'Music Off'}
                    >
                        {settings.musicEnabled ? '🎵' : '🔇'}
                    </button>
                    {room && (
                        <span
                            className="text-xs px-2 py-1 rounded-lg text-primary-300 font-mono"
                            style={{ background: 'rgba(92,124,250,0.15)' }}
                        >
                            {room.nickname}
                        </span>
                    )}
                    <button
                        onClick={() => navigate('/')}
                        className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                    >
                        ✕ Leave
                    </button>
                </div>
            </div>

            {/* Bottom HUD */}
            <HUD
                onRoll={handleRoll}
                onUndo={undoLastMove}
                onOpenSettings={() => setShowSettings(true)}
                onHowToPlay={() => setShowTutorial(true)}
                selectableSlotIndex={selectedSlot}
                onSlotSelect={handleSlotSelect}
            />

            {/* Modals */}
            {phase === 'gameover' && <GameOverModal onReturn={() => navigate('/')} />}
            {showSettings && <SettingsMenu onClose={() => setShowSettings(false)} />}
            {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
        </div>
    );
}
