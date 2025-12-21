import PlayerCardWeb from "@/components/PlayerCardWeb";
import ScheduleList from "@/components/ScheduleList";
import SpotlightReel from "@/components/SpotlightReel";
import { getLeagueData } from "@/lib/leagueService";
import Link from "next/link";
import { FaCalendarAlt, FaChartBar, FaFire, FaListOl } from "react-icons/fa";

// Since it's an async Server Component, we can fetch data directly
export default async function LeagueHome({ params }: { params: { leagueId: string } }) {

    // Fetch Data
    const leagueData = await getLeagueData(params.leagueId);

    if (!leagueData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center">
                <h1 className="text-4xl font-bold text-slate-500">League Not Found</h1>
                <Link href="/" className="mt-4 text-blue-400 hover:underline">Return to Home</Link>
            </div>
        );
    }

    const { info, games, standings, leagueLeaders, topBatters, recentPosts } = leagueData;

    // Filter Games
    const completedGames = games.filter(g => g.status === 'completed').reverse(); // Most recent first
    const upcomingGames = games.filter(g => g.status !== 'completed');

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

            {/* 1. Compact Hero */}
            <section className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl group">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900/20 opacity-80" />
                {info.logoUrl && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 opacity-5 pointer-events-none transform translate-x-12">
                        <img src={info.logoUrl} className="w-full h-full object-contain grayscale" />
                    </div>
                )}

                <div className="relative z-10 flex items-center p-6 md:p-8 gap-6">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-800 border-4 border-slate-700 shadow-xl overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                        {info.logoUrl ? (
                            <img src={info.logoUrl} alt={info.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">🏆</div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight leading-none mb-2">
                            {info.name}
                        </h1>
                        <p className="text-emerald-400 font-bold text-sm tracking-widest uppercase flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Official League Portal
                        </p>
                    </div>


                </div>
            </section>

            {/* 2. Photo Roll (Moved to Top) */}
            {recentPosts.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            Latest Photos
                        </h2>
                    </div>
                    <div className="overflow-x-auto pb-6 -mx-4 px-4 custom-scrollbar snap-x">
                        <div className="flex gap-3">
                            {recentPosts.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/t/${post.teamId}/gallery?postId=${post.id}`}
                                    className="min-w-[140px] md:min-w-[180px] snap-center group relative aspect-[9/14] rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-lg"
                                >
                                    {post.type === 'video' ? (
                                        <video src={post.mediaUrl} className="w-full h-full object-cover opacity-80" />
                                    ) : (
                                        <img src={post.mediaUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                    <div className="absolute bottom-2 left-2 right-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-5 h-5 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
                                                {post.userPhotoUrl ? (
                                                    <img src={post.userPhotoUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-600"></div>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-200 truncate">{post.userName}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 3. Recent Results */}
            {completedGames.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FaFire className="text-orange-500" /> Recent Results
                        </h2>
                    </div>
                    <div className="overflow-x-auto pb-4 -mx-4 px-4 custom-scrollbar snap-x">
                        <div className="flex gap-4 min-w-max">
                            {completedGames.slice(0, 6).map(game => (
                                <div key={game.id} className="w-[280px] snap-center">
                                    <ScheduleList games={[game]} variant="matchup" title="" gridClassName="grid-cols-1" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 3. Standings & Top Batters Split Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Standings Table */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FaListOl className="text-emerald-400" /> Standings
                        </h2>
                        {/* <Link href={`/l/${params.leagueId}/standings`} className="text-xs font-bold text-blue-400 hover:text-white">Full Table</Link> */}
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg h-[450px]">
                        <div className="overflow-x-auto h-full">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-800/30 sticky top-0 backdrop-blur-md z-10">
                                    <tr>
                                        <th className="px-6 py-4">Team</th>
                                        <th className="px-4 py-4 text-center">W</th>
                                        <th className="px-4 py-4 text-center">L</th>
                                        <th className="px-4 py-4 text-center">T</th>
                                        <th className="px-4 py-4 text-center">PCT</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {standings.slice(0, 10).map((team, index) => (
                                        <tr key={team.teamId} className={`hover:bg-slate-800/40 transition-colors ${index < 4 ? 'bg-emerald-500/5' : ''}`}>
                                            <td className="px-6 py-4 font-medium text-white">
                                                <div className="flex items-center gap-4">
                                                    <span className={`text-sm font-bold w-6 ${index < 4 ? 'text-emerald-400' : 'text-slate-500'}`}>{index + 1}</span>
                                                    <Link href={`/t/${team.teamId}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                                                        <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden flex-shrink-0 border border-slate-600">
                                                            {team.logoURL ? (
                                                                <img src={team.logoURL} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="flex items-center justify-center w-full h-full text-xs">⚾</div>
                                                            )}
                                                        </div>
                                                        <span className="truncate max-w-[150px] sm:max-w-xs text-base hover:text-blue-400 hover:underline">{team.teamName}</span>
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold text-white text-base">{team.wins}</td>
                                            <td className="px-4 py-4 text-center text-slate-400 text-base">{team.losses}</td>
                                            <td className="px-4 py-4 text-center text-slate-400 text-base">{team.ties}</td>
                                            <td className="px-4 py-4 text-center font-bold text-emerald-400 text-base">
                                                {team.gamesPlayed > 0 ? (team.wins / team.gamesPlayed).toFixed(3).replace(/^0/, '') : '.000'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Top Batters Table */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FaChartBar className="text-yellow-500" /> Top Avg
                        </h2>
                        <Link href={`/l/${params.leagueId}/stats`} className="text-xs font-bold text-blue-400 hover:text-white">View Full Stats</Link>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col h-[450px]">
                        <div className="overflow-y-auto custom-scrollbar flex-grow">
                            <table className="w-full text-sm text-left relative">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-800/90 sticky top-0 z-10 backdrop-blur-sm">
                                    <tr>
                                        <th className="px-6 py-4">Player</th>
                                        <th className="px-4 py-4 text-center">Avg</th>
                                        <th className="px-4 py-4 text-center">H</th>
                                        <th className="px-4 py-4 text-center">AB</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {topBatters.slice(0, 10).map((player, index) => (
                                        <tr key={player.id} className="hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-3 font-medium text-white">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-sm font-bold w-6 ${index < 3 ? 'text-yellow-500' : 'text-slate-500'}`}>{index + 1}</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold truncate max-w-[120px]">{player.playerName}</span>
                                                        <div className="flex items-center gap-1 text-xs text-slate-400">
                                                            {player.teamLogo && <img src={player.teamLogo} className="w-6 h-6 rounded-full" />}
                                                            {player.teamName}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center font-black text-yellow-400 text-base">{parseFloat(player.avg || "0").toFixed(3).replace(/^0/, '')}</td>
                                            <td className="px-4 py-3 text-center text-slate-300">{player.hits}</td>
                                            <td className="px-4 py-3 text-center text-slate-400">{player.ab}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>

            {/* 4. League Leaders Section - Full Width, 3 Columns Centered */}
            <section className="space-y-4 mt-12">
                <div className="flex items-center px-2">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FaChartBar className="text-purple-500" /> Stat Leaders
                    </h2>
                </div>

                <div className="flex flex-wrap justify-center gap-6 w-full">
                    {leagueLeaders.slice(0, 3).map((leader) => (
                        <div key={leader.stat} className="w-[45%] md:w-[30%] lg:w-[22%] max-w-[280px] transform hover:scale-105 transition-transform duration-300 relative group">
                            <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold text-center bg-slate-800/50 py-1 rounded-lg border border-slate-700/50 mb-2">
                                {leader.stat} Leader
                            </div>
                            {leader.player ? (
                                <div className="hover:scale-105 transition-transform duration-300 h-full relative group">
                                    <div className="absolute -top-3 -right-2 z-20 rotate-12 animate-pulse">
                                        <div className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-black font-black text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.6)] border-2 border-white ring-2 ring-yellow-400/50 flex items-center gap-1">
                                            <span>👑</span> MVP #{['Batting Average', 'Home Runs', 'OPS'][['avg', 'hr', 'ops'].indexOf(leader.stat)] ? (['avg', 'hr', 'ops'].indexOf(leader.stat) + 1) : ''}
                                        </div>
                                    </div>
                                    <PlayerCardWeb player={leader.player} teamLogo={leader.teamLogo} />
                                </div>
                            ) : (
                                <div className="aspect-[9/16] bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center p-4 text-center shadow-lg h-full">
                                    <div className="text-3xl font-black text-slate-700 mb-2">{leader.value}</div>
                                    <div className="text-sm text-slate-500 font-bold">{leader.name}</div>
                                    <div className="text-xs text-slate-600 mt-2">No Player Data</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* 5. Upcoming Games */}
            {upcomingGames.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FaCalendarAlt className="text-blue-400" /> Upcoming Games
                        </h2>
                        <Link href={`/l/${params.leagueId}/schedule`} className="text-xs font-bold text-blue-400 hover:text-white">View All</Link>
                    </div>
                    <div className="overflow-x-auto pb-4 -mx-4 px-4 custom-scrollbar snap-x">
                        <div className="flex gap-4 min-w-max">
                            {upcomingGames.slice(0, 6).map(game => (
                                <div key={game.id} className="w-[280px] snap-center">
                                    <ScheduleList games={[game]} variant="matchup" title="" gridClassName="grid-cols-1" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 6. Spotlight Reel (Bottom) */}
            <SpotlightReel
                players={topBatters.map(p => ({ ...p, fetchedTeamLogo: p.teamLogo || null }))}
                title={`${info.name} Top Players`}
                subtitle="League Stars"
            />

        </div>
    );
}
