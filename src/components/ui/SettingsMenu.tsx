import { useGameStore } from '../../game/gameStore.js';

interface SettingsMenuProps {
    onClose: () => void;
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between py-3">
            <span className="text-gray-300 font-medium">{label}</span>
            <button
                onClick={() => onChange(!value)}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${value ? 'bg-primary-500' : 'bg-gray-700'}`}
            >
                <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${value ? 'left-6' : 'left-0.5'}`}
                />
            </button>
        </div>
    );
}

export default function SettingsMenu({ onClose }: SettingsMenuProps) {
    const { settings, setDiceMode, setSoundEnabled, setMusicEnabled, setQuality } = useGameStore();

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(5,5,16,0.85)', backdropFilter: 'blur(16px)' }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded-3xl p-6 animate-slide-up"
                style={{
                    background: 'linear-gradient(135deg, #0f0f24 0%, #141428 100%)',
                    border: '1px solid rgba(92,124,250,0.3)',
                    boxShadow: '0 0 40px rgba(92,124,250,0.15), 0 25px 50px rgba(0,0,0,0.5)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">⚙️ Settings</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl transition-colors">×</button>
                </div>

                {/* Dice Mode */}
                <div className="mb-4">
                    <div className="text-gray-400 text-xs uppercase tracking-widest mb-3">Dice Mode</div>
                    <div className="grid grid-cols-2 gap-2">
                        {(['1-2', '1-6'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setDiceMode(mode)}
                                className={`py-2.5 rounded-xl font-semibold text-sm transition-all ${settings.diceMode === mode
                                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {mode === '1-2' ? '⚁ Simple (1-2)' : '🎲 Standard (1-6)'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quality */}
                <div className="mb-4">
                    <div className="text-gray-400 text-xs uppercase tracking-widest mb-3">Graphics Quality</div>
                    <div className="grid grid-cols-3 gap-2">
                        {(['low', 'medium', 'high'] as const).map((q) => (
                            <button
                                key={q}
                                onClick={() => setQuality(q)}
                                className={`py-2 rounded-xl font-semibold text-xs capitalize transition-all ${settings.quality === q
                                        ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/30'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {q === 'low' ? '⚡ Low' : q === 'medium' ? '✨ Med' : '💎 High'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Toggles */}
                <div className="border-t border-gray-800 pt-2">
                    <Toggle label="🔊 Sound Effects" value={settings.soundEnabled} onChange={setSoundEnabled} />
                    <Toggle label="🎵 Background Music" value={settings.musicEnabled} onChange={setMusicEnabled} />
                </div>

                <button
                    onClick={onClose}
                    className="mt-4 w-full py-3 rounded-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-500 hover:to-primary-400 transition-all hover:scale-[1.02]"
                >
                    Save & Close
                </button>
            </div>
        </div>
    );
}
