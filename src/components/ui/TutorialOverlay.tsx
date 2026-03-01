import { useState } from 'react';
import { SFX } from '../../hooks/useSound.js';

const STEPS = [
    {
        emoji: '🎯',
        title: 'Goal: Avoid Blots!',
        body: 'A "blot" is when any disk is ALONE at a location. If that happens after your turn, the game ends.',
    },
    {
        emoji: '🔵',
        title: '5 Disks at Location 0',
        body: 'You start with 5 disks stacked at slot 0. Keeping disks together (2+) is safe. A solo disk = instant game over.',
    },
    {
        emoji: '🎲',
        title: 'Roll the Dice',
        body: 'Press "🎲 Roll Dice". If you roll doubles (e.g. 2+2), you must move 4 disks. Otherwise move 2 disks.',
    },
    {
        emoji: '👆',
        title: 'Select a Move Slot',
        body: 'After rolling, you see move slots like "+1" or "+2". Tap a slot to "arm" it (it lights up). Then click a disk to move it by that amount.',
    },
    {
        emoji: '↩️',
        title: 'Undo is Your Friend',
        body: 'Made a mistake? Press ↩ Undo to step back one move within the same turn. Plan carefully before confirming all moves!',
    },
    {
        emoji: '🏆',
        title: 'Score = Turns Survived',
        body: 'Your score is how many turns you last before a blot. Challenge: can you survive 10+ turns? Good luck!',
    },
];

interface TutorialOverlayProps {
    onClose: () => void;
}

export default function TutorialOverlay({ onClose }: TutorialOverlayProps) {
    const [step, setStep] = useState(0);
    const isLast = step === STEPS.length - 1;

    function next() {
        SFX.select();
        if (isLast) { onClose(); return; }
        setStep((s) => s + 1);
    }

    function prev() {
        SFX.select();
        setStep((s) => Math.max(0, s - 1));
    }

    const current = STEPS[step];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(5,5,16,0.88)', backdropFilter: 'blur(16px)' }}
        >
            <div
                className="w-full max-w-sm rounded-3xl p-7 animate-slide-up text-center"
                style={{
                    background: 'linear-gradient(135deg, #0f0f24 0%, #141438 100%)',
                    border: '1px solid rgba(92,124,250,0.35)',
                    boxShadow: '0 0 60px rgba(92,124,250,0.18), 0 25px 60px rgba(0,0,0,0.6)',
                }}
            >
                {/* Step indicator dots */}
                <div className="flex justify-center gap-1.5 mb-6">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className="w-2 h-2 rounded-full transition-all duration-300"
                            style={{ background: i === step ? '#5c7cfa' : 'rgba(92,124,250,0.25)', transform: i === step ? 'scale(1.3)' : 'scale(1)' }}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="text-6xl mb-5">{current.emoji}</div>
                <h2 className="text-2xl font-bold text-white mb-3">{current.title}</h2>
                <p className="text-gray-300 text-sm leading-relaxed mb-8">{current.body}</p>

                {/* Navigation */}
                <div className="flex gap-3">
                    {step > 0 && (
                        <button
                            onClick={prev}
                            className="px-5 py-3 rounded-xl text-gray-400 hover:text-white font-semibold transition-all"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            ← Back
                        </button>
                    )}
                    <button
                        onClick={next}
                        className="flex-1 py-3 rounded-xl font-bold text-base bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-500 hover:to-primary-400 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary-600/30"
                    >
                        {isLast ? '🎮 Start Playing!' : 'Next →'}
                    </button>
                </div>

                {/* Skip */}
                <button
                    onClick={() => { SFX.select(); onClose(); }}
                    className="mt-4 text-gray-600 text-xs hover:text-gray-400 transition-colors"
                >
                    Skip tutorial
                </button>
            </div>
        </div>
    );
}
