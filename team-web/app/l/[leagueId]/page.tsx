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
        <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-2 md:px-4">

            {/* 1. Centered Hero (Team Style) */}
            <section className="text-center py-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden group mx-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-all duration-1000" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 md:w-28 md:h-28 relative rounded-3xl bg-slate-800 border-2 border-slate-700 shadow-xl mb-3 overflow-hidden transform hover:scale-105 transition-transform duration-300">
                        {info.logoUrl ? (
                            <img src={info.logoUrl} alt={info.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">🏆</div>
                        )}
                    </div>
                    <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white mb-1 uppercase drop-shadow-lg px-4">
                        {info.name}
                    </h1>
                    <p className="text-emerald-400 font-bold text-xs tracking-widest uppercase flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Official League Portal
                    </p>
                </div>
            </section>

            {/* 2. Recent Results (Gold Border) */}
            {completedGames.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <FaFire className="text-orange-500" /> Recent Results
                        </h2>
                    </div>
                    <div className="overflow-x-auto pb-6 -mx-2 px-2 custom-scrollbar snap-x">
                        <div className="flex gap-4 min-w-max">
                            {completedGames.slice(0, 6).map(game => (
                                <div key={game.id} className="w-[260px] snap-center relative bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:border-yellow-400 hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all duration-300">
                                    <ScheduleList
                                        games={[game]}
                                        variant="matchup"
                                        title=""
                                        gridClassName="grid-cols-1"
                                        cardClassName="!border-0 !bg-transparent !shadow-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 3. Standings (Podium + Pursuit) */}
            <section className="space-y-3">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <FaListOl className="text-emerald-400" /> Standings
                    </h2>
                </div>

                {/* THE PODIUM (Top 3) */}
                <div className="flex flex-wrap justify-center items-end gap-3 mb-6 min-h-[140px]">
                    {standings.length > 1 && standings[1] && (
                        <div className="order-1 w-[28%] max-w-[130px] flex flex-col items-center">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-slate-400 bg-slate-800 shadow-[0_0_20px_rgba(148,163,184,0.3)] overflow-hidden relative mb-2 transform hover:scale-110 transition-transform">
                                {standings[1].logoURL ? <img src={standings[1].logoURL} className="w-full h-full object-cover" /> : <span className="text-2xl flex items-center justify-center w-full h-full">🥈</span>}
                                <div className="absolute bottom-0 w-full bg-slate-400 text-slate-900 text-[9px] font-black text-center py-0.5">2ND</div>
                            </div>
                            <h3 className="text-[10px] md:text-xs font-bold text-white text-center truncate w-full">{standings[1].teamName}</h3>
                            <p className="text-emerald-400 font-black text-xs">{standings[1].wins}W - {standings[1].losses}L</p>
                        </div>
                    )}

                    {standings.length > 0 && standings[0] && (
                        <div className="order-2 w-[35%] max-w-[150px] flex flex-col items-center -mt-4 z-10">
                            <div className="text-xl mb-1 animate-bounce">👑</div>
                            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-yellow-400 bg-slate-800 shadow-[0_0_30px_rgba(250,204,21,0.5)] overflow-hidden relative mb-2 transform hover:scale-110 transition-transform">
                                {standings[0].logoURL ? <img src={standings[0].logoURL} className="w-full h-full object-cover" /> : <span className="text-3xl flex items-center justify-center w-full h-full">🥇</span>}
                                <div className="absolute bottom-0 w-full bg-yellow-400 text-yellow-900 text-[10px] font-black text-center py-1">1ST PLACE</div>
                            </div>
                            <h3 className="text-xs md:text-sm font-black text-white text-center truncate w-full">{standings[0].teamName}</h3>
                            <p className="text-yellow-400 font-black text-base">{standings[0].wins}W - {standings[0].losses}L</p>
                        </div>
                    )}

                    {standings.length > 2 && standings[2] && (
                        <div className="order-3 w-[28%] max-w-[130px] flex flex-col items-center">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-amber-700 bg-slate-800 shadow-[0_0_20px_rgba(180,83,9,0.3)] overflow-hidden relative mb-2 transform hover:scale-110 transition-transform">
                                {standings[2].logoURL ? <img src={standings[2].logoURL} className="w-full h-full object-cover" /> : <span className="text-2xl flex items-center justify-center w-full h-full">🥉</span>}
                                <div className="absolute bottom-0 w-full bg-amber-700 text-amber-100 text-[9px] font-black text-center py-0.5">3RD</div>
                            </div>
                            <h3 className="text-[10px] md:text-xs font-bold text-white text-center truncate w-full">{standings[2].teamName}</h3>
                            <p className="text-emerald-400 font-black text-xs">{standings[2].wins}W - {standings[2].losses}L</p>
                        </div>
                    )}
                </div>

                {/* THE CHASE (Rest of the teams) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg p-3 space-y-2">
                    {standings.slice(3).map((team, index) => {
                        const total = team.gamesPlayed || 1;
                        const winPct = (team.wins / total) * 100;

                        return (
                            <div key={team.teamId} className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors group">
                                <span className="text-slate-500 font-bold text-xs w-4">{index + 4}</span>

                                <Link href={`/t/${team.teamId}`} className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex-shrink-0 border border-slate-600 relative">
                                    {team.logoURL ? <img src={team.logoURL} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-[10px]">⚾</div>}
                                </Link>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <Link href={`/t/${team.teamId}`} className="text-xs font-bold text-white truncate hover:text-blue-400">{team.teamName}</Link>
                                        <span className="text-[10px] font-mono text-slate-400">{team.wins}-{team.losses}-{team.ties}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden flex">
                                        <div className="h-full bg-emerald-500" style={{ width: `${winPct}%` }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {standings.length <= 3 && standings.length > 0 && (
                        <div className="text-center text-slate-500 text-[10px] italic py-1">Only {standings.length} teams in the league.</div>
                    )}
                    {standings.length === 0 && (
                        <div className="text-center text-slate-500 text-xs py-4">No standings data available yet.</div>
                    )}
                </div>
            </section>

            {/* 4. League Leaders Section */}
            <section className="space-y-3 mt-4">
                <div className="flex items-center px-2">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <FaChartBar className="text-purple-500" /> Stat Leaders
                    </h2>
                </div>

                <div className="flex flex-wrap justify-center gap-4 w-full">
                    {leagueLeaders.slice(0, 3).map((leader) => (
                        <div key={leader.stat} className="w-[45%] md:w-[30%] lg:w-[22%] max-w-[260px] transform hover:scale-105 transition-transform duration-300 relative group">
                            <div className="text-[9px] text-emerald-400 uppercase tracking-widest font-bold text-center bg-slate-800/50 py-0.5 rounded-lg border border-slate-700/50 mb-1">
                                {leader.stat} Leader
                            </div>
                            {leader.player ? (
                                <div className="hover:scale-105 transition-transform duration-300 h-full relative group">
                                    <div className="absolute -top-2 -right-1 z-20 rotate-12 animate-pulse">
                                        <div className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-black font-black text-[9px] px-2 py-0.5 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)] border border-white ring-1 ring-yellow-400/50 flex items-center gap-1">
                                            <span>👑</span> MVP
                                        </div>
                                    </div>
                                    <PlayerCardWeb player={leader.player} teamLogo={leader.teamLogo} />
                                </div>
                            ) : (
                                <div className="aspect-[9/16] bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center justify-center p-3 text-center shadow-lg h-full">
                                    <div className="text-2xl font-black text-slate-700 mb-1">{leader.value}</div>
                                    <div className="text-xs text-slate-500 font-bold">{leader.name}</div>
                                    <div className="text-[10px] text-slate-600 mt-1">No Data</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* 5. Top 10 Avg (Spotlight Reel) */}
            <SpotlightReel
                players={topBatters.map(p => ({ ...p, fetchedTeamLogo: p.teamLogo || null }))}
                title="Top 10 Avg"
                subtitle="League Leaders"
            />

            {/* 6. Upcoming Games (Gold Border) */}
            {upcomingGames.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <FaCalendarAlt className="text-blue-400" /> Upcoming Games
                        </h2>
                        <Link href={`/l/${params.leagueId}/schedule`} className="text-[10px] font-bold text-blue-400 hover:text-white">View All</Link>
                    </div>
                    <div className="overflow-x-auto pb-6 -mx-2 px-2 custom-scrollbar snap-x">
                        <div className="flex gap-4 min-w-max">
                            {upcomingGames.slice(0, 6).map(game => (
                                <div key={game.id} className="w-[260px] snap-center relative bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:border-yellow-400 hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all duration-300">
                                    <ScheduleList
                                        games={[game]}
                                        variant="matchup"
                                        title=""
                                        gridClassName="grid-cols-1"
                                        cardClassName="!border-0 !bg-transparent !shadow-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 7. Gallery / Latest Photos (Gold Border) */}
            {recentPosts.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            Latest Photos
                        </h2>
                    </div>
                    <div className="overflow-x-auto pb-6 -mx-2 px-2 custom-scrollbar snap-x">
                        <div className="flex gap-4">
                            {recentPosts.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/t/${post.teamId}/gallery?postId=${post.id}`}
                                    className="min-w-[120px] md:min-w-[160px] snap-center group relative aspect-[9/14] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:border-yellow-400 hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all duration-300"
                                >
                                    {post.type === 'video' ? (
                                        <video src={post.mediaUrl} className="w-full h-full object-cover opacity-80" />
                                    ) : (
                                        <img src={post.mediaUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                    <div className="absolute bottom-2 left-2 right-2">
                                        <div className="flex items-center gap-1 mb-1">
                                            <div className="w-4 h-4 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
                                                {post.userPhotoUrl ? (
                                                    <img src={post.userPhotoUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-600"></div>
                                                )}
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-200 truncate">{post.userName}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

        </div>
    );
}
