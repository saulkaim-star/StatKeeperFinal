import PlayerCardWeb from './PlayerCardWeb';

interface Player {
    id: string;
    playerName: string;
    playerNumber?: string | number;
    playerPosition?: string;
    photoURL?: string | null;
    avg?: string | number;
    hits?: string | number;
    ops?: string | number;
    ab?: string | number;
    fetchedTeamLogo?: string;
    [key: string]: any;
}

interface SpotlightReelProps {
    players: Player[];
    title?: string;
    subtitle?: string;
}

export default function SpotlightReel({ players, title = "Player Spotlight", subtitle = "Top Performers" }: SpotlightReelProps) {
    if (!players || players.length === 0) return null;

    return (
        <section className="w-full overflow-hidden bg-slate-900/30 py-6 border-y border-slate-800/30 mt-8 mb-8">
            <div className="container mx-auto px-4 mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest pl-1">{title}</h2>
                <span className="text-[10px] text-slate-600 uppercase tracking-widest hidden md:block">{subtitle}</span>
            </div>

            <div className="relative w-full flex overflow-x-auto pt-6 pb-6 gap-6 px-4 custom-scrollbar snap-x">
                {players.map((player, idx) => (
                    <div key={player.id} className="min-w-[140px] md:min-w-[160px] snap-center relative group">
                        {/* Floating MVP Badge - ONLY FOR TOP 3 */}
                        {idx < 3 && (
                            <div className="absolute -top-3 -right-2 z-20 rotate-12 group-hover:animate-pulse">
                                <div className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-black font-black text-[9px] px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.6)] border border-white ring-1 ring-yellow-400/50 flex items-center gap-1">
                                    <span>👑</span> MVP
                                </div>
                            </div>
                        )}
                        <PlayerCardWeb
                            player={{
                                playerName: player.playerName,
                                playerPosition: player.playerPosition,
                                photoURL: player.photoURL,
                                avg: player.avg,
                                hits: player.hits,
                                ops: player.ops,
                                playerNumber: player.playerNumber
                            }}
                            teamLogo={player.fetchedTeamLogo}
                            badgeText=""
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}
