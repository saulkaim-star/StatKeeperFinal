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
    return (
        <div className="relative w-full aspect-[9/16] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50 flex flex-col">

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
            <div className="px-4 pt-3 pb-1 flex items-center gap-3 z-10 mt-1">
                <div className="w-16 h-16 bg-slate-800 rounded-full border border-white/10 overflow-hidden relative flex-shrink-0">
                    {teamLogo ? (
                        <Image src={teamLogo} alt="Team Logo" fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">Logo</div>
                    )}
                </div>
                <div>
                    <h2 className="text-xl font-black text-white tracking-wide uppercase leading-none">
                        {player.playerName}
                    </h2>
                    <p className="text-slate-400 font-bold text-sm mt-0.5">
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
            <div className="px-3 mt-3 mb-4 grid grid-cols-3 gap-3 z-10">
                {/* AVG - Green Neon */}
                <div className="rounded-xl p-2 flex flex-col items-center justify-center border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4),inset_0_0_15px_rgba(16,185,129,0.15)] bg-emerald-500/10 backdrop-blur-sm group-hover:scale-105 transition-transform duration-300">
                    <span className="text-lg sm:text-2xl font-black text-white leading-none drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]">{player.avg || '.000'}</span>
                    <span className="text-[10px] font-bold text-emerald-400 tracking-widest mt-1 drop-shadow-[0_0_2px_rgba(16,185,129,0.8)]">AVG</span>
                </div>

                {/* HITS - Orange Neon w/ Fire */}
                <div className="rounded-xl p-2 flex flex-col items-center justify-center border-2 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4),inset_0_0_15px_rgba(249,115,22,0.15)] bg-orange-500/10 backdrop-blur-sm group-hover:scale-105 transition-transform duration-300 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 px-1 border-t-0 border-l-0 border-r-0 border-b-0 rounded-full">
                        <FaFire className="text-orange-500 text-sm animate-pulse drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]" />
                    </div>
                    <span className="text-lg sm:text-2xl font-black text-white leading-none drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]">{player.hits || '0'}</span>
                    <span className="text-[10px] font-bold text-orange-400 tracking-widest mt-1 drop-shadow-[0_0_2px_rgba(249,115,22,0.8)]">HITS</span>
                </div>

                {/* OPS - Blue Neon */}
                <div className="rounded-xl p-2 flex flex-col items-center justify-center border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4),inset_0_0_15px_rgba(59,130,246,0.15)] bg-blue-500/10 backdrop-blur-sm group-hover:scale-105 transition-transform duration-300">
                    <span className="text-lg sm:text-2xl font-black text-white leading-none drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]">{player.ops || '.000'}</span>
                    <span className="text-[10px] font-bold text-blue-400 tracking-widest mt-1 drop-shadow-[0_0_2px_rgba(59,130,246,0.8)]">OPS</span>
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
