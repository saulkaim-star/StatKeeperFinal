import Image from 'next/image';
import { FaFire } from 'react-icons/fa';

interface PlayerProps {
    playerName: string;
    playerNumber?: string | number;
    playerPosition?: string;
    photoURL?: string | null;
    avg?: string | number;
    ops?: string | number;
    hits?: string | number;
}

interface PlayerCardWebProps {
    player: PlayerProps;
    teamLogo?: string | null;
    badgeText?: string;
}

export default function PlayerCardWeb({ player, teamLogo, badgeText }: PlayerCardWebProps) {
    // Logic to show placeholder "Pro" stats if the player has 0 stats
    const pAvg = Number(player.avg) || 0;
    const pHits = Number(player.hits) || 0;
    const pOps = Number(player.ops) || 0;
    const isZeroStats = pAvg === 0 && pHits === 0 && pOps === 0;

    const displayAvg = isZeroStats ? '.430' : (player.avg || '.000');
    const displayHits = isZeroStats ? '10' : (player.hits || '0');
    const displayOps = isZeroStats ? '1.200' : (player.ops || '.000');

    return (
        <div className="relative w-full aspect-[9/16] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.2)] flex flex-col hover:border-yellow-400 hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all duration-300">

            {/* Ambient Glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none" />

            {/* MVP / Badge Sticker */}
            {badgeText && (
                <div className="absolute top-0 right-0 z-20">
                    <div className="bg-yellow-500 text-slate-900 text-xs font-black px-3 py-1 rounded-bl-xl shadow-lg border-l border-b border-yellow-400">
                        {badgeText}
                    </div>
                </div>
            )}

            {/* Header - Compact */}
            <div className="px-3 pt-3 pb-1 flex items-center gap-2 z-10 mt-1">
                <div className="w-10 h-10 bg-slate-800 rounded-full border border-white/10 overflow-hidden relative flex-shrink-0 shadow-sm">
                    {teamLogo ? (
                        <Image src={teamLogo} alt="Team Logo" fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">Logo</div>
                    )}
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <h2 className="text-sm font-black text-white tracking-wide uppercase leading-tight truncate">
                        {player.playerName}
                    </h2>
                    <p className="text-slate-400 font-bold text-[10px] leading-tight mt-0.5 truncate">
                        {player.playerNumber ? `#${player.playerNumber} • ` : ''}{player.playerPosition || 'Player'}
                    </p>
                </div>
            </div>

            {/* Main Photo Area - Compact Margins */}
            <div className="flex-1 mx-3 my-1 relative rounded-xl overflow-hidden border border-slate-700 bg-slate-800/50">
                {player.photoURL ? (
                    <Image
                        src={player.photoURL}
                        alt={player.playerName}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl opacity-50">👤</span>
                    </div>
                )}
            </div>

            {/* Stats Grid - Neon Outline Style */}
            <div className="px-3 mt-3 mb-4 grid grid-cols-3 gap-2 z-10">
                {/* AVG - Green Neon */}
                <div className="rounded-lg p-1.5 flex flex-col items-center justify-center border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3),inset_0_0_10px_rgba(16,185,129,0.1)] bg-emerald-500/10 backdrop-blur-sm group-hover:scale-105 transition-transform duration-300">
                    <span className="text-sm font-black text-white leading-none drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]">{displayAvg}</span>
                    <span className="text-[8px] font-bold text-emerald-400 tracking-widest mt-0.5 opacity-80">AVG</span>
                </div>

                {/* HITS - Orange Neon w/ Fire */}
                <div className="rounded-lg p-1.5 flex flex-col items-center justify-center border border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3),inset_0_0_10px_rgba(249,115,22,0.1)] bg-orange-500/10 backdrop-blur-sm group-hover:scale-105 transition-transform duration-300 relative">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-slate-900 px-1 rounded-full">
                        <FaFire className="text-orange-500 text-[10px] animate-pulse" />
                    </div>
                    <span className="text-sm font-black text-white leading-none drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]">{displayHits}</span>
                    <span className="text-[8px] font-bold text-orange-400 tracking-widest mt-0.5 opacity-80">HITS</span>
                </div>

                {/* OPS - Blue Neon */}
                <div className="rounded-lg p-1.5 flex flex-col items-center justify-center border border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3),inset_0_0_10px_rgba(59,130,246,0.1)] bg-blue-500/10 backdrop-blur-sm group-hover:scale-105 transition-transform duration-300">
                    <span className="text-sm font-black text-white leading-none drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]">{displayOps}</span>
                    <span className="text-[8px] font-bold text-blue-400 tracking-widest mt-0.5 opacity-80">OPS</span>
                </div>
            </div>
            {/* Branding Footer - Logo + Text */}
            <div className="flex items-center justify-center gap-2 pb-3 z-10 opacity-80">
                <div className="w-5 h-5 relative shadow-sm">
                    <Image src="/logo.png" alt="SK" fill className="object-contain rounded-full" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 tracking-widest">StatKeeper</span>
            </div>

        </div>
    );
}
