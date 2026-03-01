import { QRCodeSVG as QRCode } from 'qrcode.react';


interface QRCodeDisplayProps {
    roomCode: string;
    joinUrl: string;
}

export default function QRCodeDisplay({ roomCode, joinUrl }: QRCodeDisplayProps) {
    return (
        <div
            className="rounded-2xl p-6 text-center"
            style={{
                background: 'rgba(10,10,25,0.8)',
                border: '1px solid rgba(92,124,250,0.3)',
                boxShadow: '0 0 30px rgba(92,124,250,0.1)',
            }}
        >
            <h3 className="text-white font-bold text-lg mb-4">📱 Scan to Join</h3>

            {/* QR Code */}
            <div
                className="inline-block p-4 rounded-2xl mb-4"
                style={{ background: '#ffffff' }}
            >
                <QRCode value={joinUrl} size={180} level="H" includeMargin={false} />
            </div>

            {/* Room code */}
            <div className="mb-3">
                <div className="text-gray-400 text-xs uppercase tracking-widest mb-1">Room Code</div>
                <div
                    className="text-4xl font-black text-primary-300 tracking-[0.3em]"
                    style={{ textShadow: '0 0 20px rgba(92,124,250,0.5)' }}
                >
                    {roomCode}
                </div>
            </div>

            {/* URL */}
            <div className="text-gray-500 text-xs break-all">{joinUrl}</div>

            {/* Copy button */}
            <button
                onClick={() => navigator.clipboard.writeText(joinUrl)}
                className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold bg-primary-900/60 text-primary-300 hover:bg-primary-700/60 border border-primary-600/40 transition-all"
            >
                Copy Link
            </button>
        </div>
    );
}
