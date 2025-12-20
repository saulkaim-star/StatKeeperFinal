import { Game } from '@/types';
import Link from 'next/link';
import { FaCalendarAlt } from 'react-icons/fa';

interface ScheduleListProps {
    games: Game[];
    viewAllLink?: string;
    title?: string;
    gridClassName?: string;
    variant?: 'list' | 'matchup';
}

export default function ScheduleList({ games, viewAllLink, title = "Recent Games", gridClassName, variant = 'list' }: ScheduleListProps) {
    if (!games || games.length === 0) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm shadow-xl rounded-2xl p-6 text-center border border-slate-700">
                <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
                <p className="text-slate-400 text-sm">No scheduled games yet.</p>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            });
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div>
            {title && (
                <div className="flex items-center justify-between mb-4 px-1">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FaCalendarAlt className="text-blue-400" />
                        {title}
                    </h2>
                    {viewAllLink && (
                        <Link href={viewAllLink} className="text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline">
                            VIEW ALL
                        </Link>
                    )}
                </div>
            )}

            <div className={gridClassName || "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"}>
                {games.map((game) => (
                    <div key={game.id} className="bg-slate-800/50 backdrop-blur-sm shadow-lg rounded-2xl p-4 border border-slate-700 hover:bg-slate-800 transition-all group">
                        <div className="flex justify-between items-center mb-2">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${game.status === 'completed'
                                ? 'bg-slate-700 text-slate-300'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                {game.status === 'completed' ? 'Final' : 'Scheduled'}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                                <span>{formatDate(game.gameDate).split(',')[0]}</span>
                                <span className="text-slate-700">•</span>
                                <span className="text-slate-400">{formatDate(game.gameDate).split(',')[1]}</span>
                                {game.location && (
                                    <>
                                        <span className="text-slate-700">•</span>
                                        <span>{game.location}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {variant === 'matchup' ? (
                            // HORIZONTAL / MATCHUP LAYOUT (Side-by-Side)
                            <div className="flex flex-row items-center justify-around gap-4 py-2">
                                {/* Away Team (Left) */}
                                <div className="flex flex-col items-center gap-2 flex-1">
                                    <div className="w-16 h-16 rounded-full bg-slate-700 border-2 border-slate-600 overflow-hidden flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        {game.awayTeamLogo ? (
                                            <img src={game.awayTeamLogo} alt="Away" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-2xl">⚾</span>
                                        )}
                                    </div>
                                    <span className={`text-xs font-bold truncate max-w-[100px] text-center ${game.awayScore !== undefined && game.homeScore !== undefined && Number(game.awayScore) > Number(game.homeScore) ? 'text-white' : 'text-slate-400'}`}>
                                        {game.awayTeamName || 'Away'}
                                    </span>
                                </div>

                                {/* Center Score/VS */}
                                <div className="flex flex-col items-center justify-center shrink-0">
                                    {game.status === 'completed' ? (
                                        <div className="flex items-center gap-3">
                                            <span className={`text-3xl font-black ${Number(game.awayScore) > Number(game.homeScore) ? 'text-emerald-400' : 'text-slate-600'}`}>{game.awayScore}</span>
                                            <span className="text-slate-600 font-bold text-sm">-</span>
                                            <span className={`text-3xl font-black ${Number(game.homeScore) > Number(game.awayScore) ? 'text-emerald-400' : 'text-slate-600'}`}>{game.homeScore}</span>
                                        </div>
                                    ) : (
                                        <span className="text-2xl font-black text-slate-700">VS</span>
                                    )}
                                </div>

                                {/* Home Team (Right) */}
                                <div className="flex flex-col items-center gap-2 flex-1">
                                    <div className="w-16 h-16 rounded-full bg-slate-700 border-2 border-slate-600 overflow-hidden flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        {game.homeTeamLogo ? (
                                            <img src={game.homeTeamLogo} alt="Home" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-2xl">⚾</span>
                                        )}
                                    </div>
                                    <span className={`text-xs font-bold truncate max-w-[100px] text-center ${game.homeScore !== undefined && game.homeScore !== undefined && Number(game.homeScore) > Number(game.awayScore) ? 'text-white' : 'text-slate-400'}`}>
                                        {game.homeTeamName || 'Home'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            // DEFAULT VERTICAL LAYOUT
                            <div className="space-y-4">
                                {/* Away Team */}
                                <div className="flex justify-between items-center group/team">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-700 border border-slate-600 overflow-hidden flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            {game.awayTeamLogo ? (
                                                <img src={game.awayTeamLogo} alt="Away" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-lg">⚾</span>
                                            )}
                                        </div>
                                        <span className={`text-base font-bold truncate max-w-[120px] ${game.awayScore !== undefined && game.homeScore !== undefined && Number(game.awayScore) > Number(game.homeScore) ? 'text-white' : 'text-slate-400'}`}>
                                            {game.awayTeamName || 'Away'}
                                        </span>
                                    </div>
                                    <span className={`text-2xl font-black ${game.awayScore !== undefined && game.homeScore !== undefined && Number(game.awayScore) > Number(game.homeScore) ? 'text-emerald-400' : 'text-slate-600'}`}>
                                        {game.awayScore ?? '-'}
                                    </span>
                                </div>

                                {/* Home Team */}
                                <div className="flex justify-between items-center group/team">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-700 border border-slate-600 overflow-hidden flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            {game.homeTeamLogo ? (
                                                <img src={game.homeTeamLogo} alt="Home" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-lg">⚾</span>
                                            )}
                                        </div>
                                        <span className={`text-base font-bold truncate max-w-[120px] ${game.homeScore !== undefined && game.homeScore !== undefined && Number(game.homeScore) > Number(game.awayScore) ? 'text-white' : 'text-slate-400'}`}>
                                            {game.homeTeamName || 'Home'}
                                        </span>
                                    </div>
                                    <span className={`text-2xl font-black ${game.awayScore !== undefined && game.homeScore !== undefined && Number(game.homeScore) > Number(game.awayScore) ? 'text-emerald-400' : 'text-slate-600'}`}>
                                        {game.homeScore ?? '-'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
