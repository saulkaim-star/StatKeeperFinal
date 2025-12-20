"use client";
import PlayerCardWeb from "@/components/PlayerCardWeb";
import ScheduleList from "@/components/ScheduleList";
import { db } from "@/lib/firebase";
import { calculateAvg, calculateOPS } from "@/lib/helpers";
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaCalendarAlt, FaChartBar, FaImages } from "react-icons/fa";

interface TeamData {
    teamName: string;
    managerName?: string;
    photoURL?: string;
    bannerURL?: string;
    id: string;
}

interface Player {
    id: string;
    playerName: string;
    playerNumber?: string | number;
    playerPosition?: string;
    photoURL?: string | null;
    avg?: string | number;
    hits?: string | number;
    ab?: string | number;
    [key: string]: any;
}

export default function TeamHome({ params }: { params: { teamId: string } }) {
    const [team, setTeam] = useState<TeamData | null>(null);
    const [topPlayers, setTopPlayers] = useState<Player[]>([]);
    const [teamPosts, setTeamPosts] = useState<any[]>([]);
    const [nextGame, setNextGame] = useState<any>(null);
    const [lastGame, setLastGame] = useState<any>(null);
    const [record, setRecord] = useState({ w: 0, l: 0, t: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!params.teamId) return;

        // 1. Team Info Listener
        const unsub = onSnapshot(doc(db, "teams", params.teamId), (docSnap) => {
            if (docSnap.exists()) {
                setTeam({ id: docSnap.id, ...docSnap.data() } as TeamData);
            }
        });

        // 2. Fetch Data
        const fetchDashboardData = async () => {
            try {
                // A. Posts (Feed)
                try {
                    const postsRef = collection(db, 'mediaPosts');
                    const postsQ = query(postsRef, where('teamId', '==', params.teamId));
                    const postsSnap = await getDocs(postsQ);
                    const fetchedPosts = postsSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })).sort((a: any, b: any) => {
                        const timeA = a.createdAt?.seconds || 0;
                        const timeB = b.createdAt?.seconds || 0;
                        return timeB - timeA;
                    });
                    setTeamPosts(fetchedPosts.slice(0, 10));
                } catch (e) { console.log('Feed fetch error', e); }

                // B. Roster for Stats
                const playersMap: { [key: string]: Player } = {};
                try {
                    const rosterRef = collection(db, 'teams', params.teamId, 'roster');
                    const rosterSnap = await getDocs(rosterRef);
                    rosterSnap.docs.forEach(doc => {
                        const d = doc.data();
                        playersMap[doc.id] = {
                            id: doc.id,
                            playerName: d.playerName || d.name || "Unknown",
                            playerNumber: d.playerNumber,
                            playerPosition: d.playerPosition,
                            photoURL: d.photoURL || d.profilePicture,
                            hits: 0, ab: 0, bb: 0, hbp: 0, sf: 0, doubles: 0, triples: 0, hr: 0
                        };
                    });
                } catch (e) { console.log('Roster fetch error', e); }

                // C. ROBUST GAME FETCHING
                const allGames: any[] = [];
                const teamIdStr = params.teamId;
                const teamIdNum = Number(params.teamId);

                // Strategy 1: Local Games
                try {
                    const localQ = query(collection(db, 'teams', params.teamId, 'games'));
                    const localSnap = await getDocs(localQ);
                    localSnap.forEach(d => allGames.push({ id: d.id, ...d.data() }));
                } catch (e) { console.log('Local games fetch error', e); }

                // Strategy 2: League Games via Reverse Lookup
                let foundCompetitionId = null;
                try {
                    const compTeamQ1 = query(collection(db, 'competition_teams'), where('teamId', '==', teamIdStr));
                    const compTeamSnap1 = await getDocs(compTeamQ1);
                    if (!compTeamSnap1.empty) {
                        foundCompetitionId = compTeamSnap1.docs[0].data().competitionId;
                    } else if (!isNaN(teamIdNum)) {
                        const compTeamQ2 = query(collection(db, 'competition_teams'), where('teamId', '==', teamIdNum));
                        const compTeamSnap2 = await getDocs(compTeamQ2);
                        if (!compTeamSnap2.empty) foundCompetitionId = compTeamSnap2.docs[0].data().competitionId;
                    }
                } catch (e) { }

                if (foundCompetitionId) {
                    try {
                        const leagueQ = query(collection(db, 'competition_games'), where('competitionId', '==', foundCompetitionId));
                        const leagueSnap = await getDocs(leagueQ);
                        leagueSnap.forEach(d => {
                            const data = d.data();
                            if (String(data.homeTeamId) === String(teamIdStr) || String(data.awayTeamId) === String(teamIdStr)) {
                                allGames.push({ id: d.id, ...data });
                            }
                        });
                    } catch (e) { console.log('League games fetch error', e); }
                }

                // Dedup
                const uniqueGames = Array.from(new Map(allGames.map(item => [item.id, item])).values());

                // --- FETCH TEAM LOGOS (Required for Cards) ---
                const teamIdsToFetch = new Set<string>();
                uniqueGames.forEach(g => {
                    if (g.homeTeamId) teamIdsToFetch.add(String(g.homeTeamId));
                    if (g.awayTeamId) teamIdsToFetch.add(String(g.awayTeamId));
                });

                const logoMap: { [key: string]: string } = {};
                if (teamIdsToFetch.size > 0) {
                    try {
                        const logoPromises = Array.from(teamIdsToFetch).map(async (tid) => {
                            try {
                                const tDoc = await getDoc(doc(db, 'teams', tid));
                                if (tDoc.exists()) {
                                    const d = tDoc.data();
                                    return { id: tid, logo: d.logoURL || d.logoUrl || d.photoURL };
                                }
                            } catch (e) { return null; }
                            return null;
                        });
                        const logoResults = await Promise.all(logoPromises);
                        logoResults.forEach(r => {
                            if (r && r.logo) logoMap[r.id] = r.logo;
                        });
                    } catch (e) { console.log('Logo fetch error', e); }
                }

                // Process Games
                const now = new Date();
                const parseDate = (g: any) => {
                    const raw = g.gameDate || g.date;
                    if (!raw) return null;
                    if (raw.toDate) return raw.toDate();
                    if (raw.seconds) return new Date(raw.seconds * 1000);
                    return new Date(raw);
                };

                const isFinal = (status: string) => {
                    const s = (status || '').toLowerCase();
                    return s === 'final' || s === 'completed';
                };

                const processedGames = uniqueGames.map((g: any) => {
                    const parsedDate = parseDate(g);
                    // Enrich with logos
                    const homeLogo = logoMap[String(g.homeTeamId)] || g.homeTeamLogo || null;
                    const awayLogo = logoMap[String(g.awayTeamId)] || g.awayTeamLogo || null;
                    return {
                        ...g,
                        gameDate: parsedDate ? parsedDate.toISOString() : new Date().toISOString(), // Standardize for ScheduleList
                        parsedDate: parsedDate,
                        isFinal: isFinal(g.status),
                        homeTeamLogo: homeLogo,
                        awayTeamLogo: awayLogo,
                    };
                });

                const sortedGames = processedGames.sort((a, b) => {
                    const tA = a.parsedDate ? a.parsedDate.getTime() : 0;
                    const tB = b.parsedDate ? b.parsedDate.getTime() : 0;
                    return tA - tB;
                });

                // Filter
                const pastGames = sortedGames.filter(g => g.isFinal || (g.parsedDate && g.parsedDate < now));
                const futureGames = sortedGames.filter(g => !g.isFinal && g.parsedDate && g.parsedDate >= now);

                setLastGame(pastGames.length > 0 ? pastGames[pastGames.length - 1] : null);
                setNextGame(futureGames.length > 0 ? futureGames[0] : null);

                // Calc Record
                let w = 0, l = 0, t = 0;
                pastGames.forEach((g: any) => {
                    if (g.isFinal) {
                        const isHome = String(g.homeTeamId) === String(params.teamId);
                        const homeScore = Number(g.homeScore);
                        const awayScore = Number(g.awayScore);
                        if (!isNaN(homeScore) && !isNaN(awayScore)) {
                            if (homeScore === awayScore) t++;
                            else if (isHome) homeScore > awayScore ? w++ : l++;
                            else awayScore > homeScore ? w++ : l++;
                        }
                    }
                });
                setRecord({ w, l, t });

                // Calc Stats
                uniqueGames.forEach((game: any) => {
                    const isHome = String(game.homeTeamId) === String(params.teamId);
                    const boxScore = isHome ? game.homeBoxScore : game.awayBoxScore;
                    if (Array.isArray(boxScore)) {
                        boxScore.forEach((stat: any) => {
                            if (stat.id && playersMap[stat.id]) {
                                const p = playersMap[stat.id];
                                p.hits = Number(p.hits) + (Number(stat.game_hits) || 0);
                                p.ab = Number(p.ab) + (Number(stat.game_ab) || 0);
                                p.bb = Number(p.bb) + (Number(stat.game_bb) || 0);
                                p.hbp = Number(p.hbp) + (Number(stat.game_hbp) || 0);
                                p.sf = Number(p.sf) + (Number(stat.game_sf) || 0);
                                p.doubles = Number(p.doubles) + (Number(stat.game_doubles) || 0);
                                p.triples = Number(p.triples) + (Number(stat.game_triples) || 0);
                                p.hr = Number(p.hr) + (Number(stat.game_hr) || 0);
                            }
                        });
                    }
                });

                const playersArray = Object.values(playersMap).map(p => ({
                    ...p,
                    avg: calculateAvg(Number(p.hits), Number(p.ab)),
                    ops: calculateOPS(
                        Number(p.hits), Number(p.ab), Number(p.bb), Number(p.hbp), Number(p.sf),
                        Number(p.doubles), Number(p.triples), Number(p.hr)
                    )
                }));

                const sortedStats = [...playersArray].sort((a, b) => parseFloat(String(b.avg)) - parseFloat(String(a.avg)));
                setTopPlayers(sortedStats.slice(0, 3));
                setLoading(false);

            } catch (e) {
                console.error("Dashboard error:", e);
                setLoading(false);
            }
        };

        fetchDashboardData();
        return () => unsub();
    }, [params.teamId]);


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!team) return <div className="text-center py-20">Team not found</div>;

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">

            {/* 1. Compact Hero */}
            <section className="text-center py-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-all duration-1000" />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 md:w-32 md:h-32 relative rounded-3xl bg-slate-800 border-2 border-slate-700 shadow-xl mb-3 overflow-hidden transform hover:scale-105 transition-transform duration-300">
                        {team.photoURL ? (
                            <img src={team.photoURL} alt={team.teamName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl">⚾</div>
                        )}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2 font-italic uppercase drop-shadow-lg">
                        {team.teamName}
                    </h1>

                    {/* Record Display */}
                    <div className="flex items-center gap-4 mb-2">
                        <div className="px-5 py-1.5 bg-slate-800/80 rounded-full border border-slate-600 backdrop-blur-sm shadow-lg">
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mr-2">Record</span>
                            <span className="text-white font-mono font-bold text-lg">{record.w} - {record.l} - {record.t}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Game widgets (Next / Last) USING ScheduleList Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    {lastGame ? (
                        <ScheduleList games={[lastGame]} title="Last Result" gridClassName="grid-cols-1" variant="matchup" />
                    ) : (
                        <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 text-center text-slate-500 text-sm italic">
                            No games played yet.
                        </div>
                    )}
                </div>
                <div>
                    {nextGame ? (
                        <ScheduleList games={[nextGame]} title="Next Game" gridClassName="grid-cols-1" variant="matchup" />
                    ) : (
                        <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 text-center text-slate-500 text-sm italic">
                            No upcoming games.
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Team Leaders (Reusing PlayerCardWeb) */}
            <section>
                <div className="flex justify-between items-center mb-4 px-1">
                    <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                        <FaChartBar className="text-emerald-400" /> Team Leaders
                    </h2>
                </div>

                <div className="flex flex-wrap justify-center gap-6">
                    {topPlayers.map((player, idx) => (
                        <div key={player.id} className="w-[45%] md:w-[30%] lg:w-[22%] max-w-[280px] transform hover:scale-105 transition-transform duration-300 relative group">
                            <div className="absolute -top-3 -right-2 z-20 rotate-12 animate-pulse">
                                <div className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-black font-black text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.6)] border-2 border-white ring-2 ring-yellow-400/50 flex items-center gap-1">
                                    <span>👑</span> MVP #{idx + 1}
                                </div>
                            </div>
                            <PlayerCardWeb player={player} teamLogo={team?.photoURL || null} />
                        </div>
                    ))}
                    {topPlayers.length === 0 && (
                        <div className="w-full text-center text-slate-500 text-sm py-4 bg-slate-900/50 rounded-xl">
                            No stats recorded yet.
                        </div>
                    )}
                </div>
            </section>

            {/* 4. Team Events (Feed) */}
            <section>
                <div className="flex justify-between items-center mb-3 px-1">
                    <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                        <FaImages className="text-purple-400" /> Team Events
                    </h2>
                </div>
                {teamPosts.length > 0 ? (
                    <div className="flex overflow-x-auto gap-3 pb-4 custom-scrollbar snap-x">
                        {teamPosts.map((post) => (
                            <div key={post.id} className="min-w-[140px] md:min-w-[160px] snap-center">
                                <Link href={`/t/${params.teamId}/gallery?postId=${post.id}`} className="block h-full">
                                    <div className="aspect-[9/16] w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700 relative group cursor-pointer hover:border-slate-500 transition-colors">
                                        {post.type === 'video' ? (
                                            <video src={post.mediaUrl} className="w-full h-full object-cover opacity-80" />
                                        ) : (
                                            <img src={post.mediaUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        )}
                                        {post.caption && (
                                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                                                <p className="text-white text-[10px] line-clamp-2">{post.caption}</p>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-8 text-center">
                        <p className="text-slate-500 text-sm italic">No photos or videos in gallery yet.</p>
                    </div>
                )}
            </section>

            {/* 5. Quick Links Grid */}
            <div className="grid grid-cols-2 gap-4">
                <Link href={`/t/${params.teamId}/gallery`} className="bg-slate-800/40 hover:bg-slate-800/60 p-4 rounded-2xl border border-slate-700 transition-all group text-center flex flex-col items-center justify-center gap-2">
                    <FaImages className="text-2xl text-purple-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-slate-300">Full Gallery</span>
                </Link>
                <Link href={`/t/${params.teamId}/schedule`} className="bg-slate-800/40 hover:bg-slate-800/60 p-4 rounded-2xl border border-slate-700 transition-all group text-center flex flex-col items-center justify-center gap-2">
                    <FaCalendarAlt className="text-2xl text-slate-500 group-hover:text-white transition-colors" />
                    <span className="text-sm font-bold text-slate-300">Full Schedule</span>
                </Link>
            </div>

        </div>
    );
}
