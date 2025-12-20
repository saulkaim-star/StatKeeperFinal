"use client";
import { db } from '@/lib/firebase';
import { calculateAvg, calculateOBP, calculateOPS, calculateSLG } from "@/lib/helpers";
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";

interface PlayerStats {
    id: string;
    playerName: string;
    playerNumber?: string | number;
    playerPosition?: string;
    photoURL?: string | null;

    // Counting Stats
    gp: number; // Games Played
    ab: number;
    r: number;
    h: number;
    doubles: number;
    triples: number;
    hr: number;
    rbi: number;
    bb: number;
    k: number;
    sb: number;
    hbp: number;
    sf: number;

    // Rate Stats (Strings for display)
    avg: string;
    obp: string;
    slg: string;
    ops: string;
}

type SortKey = keyof PlayerStats;

export default function TeamStatsPage({ params }: { params: { teamId: string } }) {
    const [stats, setStats] = useState<PlayerStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
        key: 'avg',
        direction: 'desc'
    });

    useEffect(() => {
        const teamId = params.teamId;
        if (!teamId) return;

        // Fetch Roster first to establish the player list
        const unsubscribe = onSnapshot(collection(db, 'teams', teamId, 'roster'), async (snapshot) => {
            const basePlayers: { [key: string]: PlayerStats } = {};

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                basePlayers[doc.id] = {
                    id: doc.id,
                    playerName: data.playerName || data.name || "Unknown",
                    playerNumber: data.playerNumber || data.number,
                    playerPosition: data.playerPosition || data.position,
                    photoURL: data.photoURL || data.profilePicture || data.photoUrl,
                    gp: 0, ab: 0, r: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, k: 0, sb: 0, hbp: 0, sf: 0,
                    avg: ".000", obp: ".000", slg: ".000", ops: ".000"
                };
            });

            // FETCH GAMES & CALCULATE
            try {
                const allGames: any[] = [];
                const teamIdStr = teamId;
                const teamIdNum = Number(teamId);

                // Strategy A: Local Games
                try {
                    const localQ = query(collection(db, 'teams', teamId, 'games'));
                    const localSnap = await getDocs(localQ);
                    localSnap.forEach(d => allGames.push({ id: d.id, ...d.data() }));
                } catch (e) { }

                // Strategy B: League Games
                let foundCompetitionId = null;
                try {
                    const compTeamQ1 = query(collection(db, 'competition_teams'), where('teamId', '==', teamIdStr));
                    const compTeamSnap1 = await getDocs(compTeamQ1);
                    if (!compTeamSnap1.empty) foundCompetitionId = compTeamSnap1.docs[0].data().competitionId;
                    else if (!isNaN(teamIdNum)) {
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
                    } catch (e) { }
                }

                // Dedup Games
                const uniqueGames = Array.from(new Map(allGames.map(item => [item.id, item])).values());

                // Create working map
                const statsMap = { ...basePlayers };

                uniqueGames.forEach((game) => {
                    const isHome = String(game.homeTeamId) === String(teamIdStr);
                    const boxScore = isHome ? game.homeBoxScore : game.awayBoxScore;

                    if (Array.isArray(boxScore)) {
                        boxScore.forEach((stat: any) => {
                            if (stat.id && statsMap[stat.id]) {
                                const p = statsMap[stat.id];

                                // Increment Stats
                                const g_hits = Number(stat.game_hits) || 0;
                                const g_ab = Number(stat.game_ab) || 0;
                                const g_bb = Number(stat.game_bb) || 0;
                                const g_hbp = Number(stat.game_hbp) || 0;
                                const g_sf = Number(stat.game_sf) || 0;

                                p.gp += 1;
                                p.ab += g_ab;
                                p.r += Number(stat.game_runs) || Number(stat.game_r) || 0;
                                p.h += g_hits;
                                p.doubles += Number(stat.game_doubles) || Number(stat.game_2b) || 0;
                                p.triples += Number(stat.game_triples) || Number(stat.game_3b) || 0;
                                p.hr += Number(stat.game_hr) || Number(stat.game_homeruns) || 0;
                                p.rbi += Number(stat.game_rbi) || 0;
                                p.bb += g_bb;
                                p.k += Number(stat.game_so) || Number(stat.game_k) || 0;
                                p.sb += Number(stat.game_sb) || 0;
                                p.hbp += g_hbp;
                                p.sf += g_sf;
                            }
                        });
                    }
                });

                // Final Rate Calculations
                const finalStats = Object.values(statsMap).map(p => {
                    // Filter out players with 0 GP if desired, but user might want to see whole roster.
                    // Actually, let's keep everyone but sorting will put 0s at bottom usually.
                    return {
                        ...p,
                        avg: calculateAvg(p.h, p.ab),
                        obp: calculateOBP(p.h, p.ab, p.bb, p.hbp, p.sf),
                        slg: calculateSLG(p.h, p.ab, p.doubles, p.triples, p.hr),
                        ops: calculateOPS(p.h, p.ab, p.bb, p.hbp, p.sf, p.doubles, p.triples, p.hr)
                    };
                });

                setStats(finalStats);

            } catch (error) {
                console.error("Stats Calculation Error:", error);
                // Fallback to base players (all 0s)
                setStats(Object.values(basePlayers));
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [params.teamId]);

    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const sortedStats = [...stats].sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        // Handle string rates vs number counts
        const numA = typeof valA === 'string' ? parseFloat(valA) : valA;
        const numB = typeof valB === 'string' ? parseFloat(valB) : valB;

        if (numA < numB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (numA > numB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ colKey }: { colKey: SortKey }) => {
        if (sortConfig.key !== colKey) return <FaSort className="ml-1 text-slate-600 inline" size={10} />;
        return sortConfig.direction === 'asc'
            ? <FaSortUp className="ml-1 text-blue-400 inline" size={10} />
            : <FaSortDown className="ml-1 text-blue-400 inline" size={10} />;
    };

    const headers: { key: SortKey; label: string; tooltip?: string }[] = [
        { key: 'gp', label: 'GP' },
        { key: 'ab', label: 'AB' },
        { key: 'r', label: 'R' },
        { key: 'h', label: 'H' },
        { key: 'doubles', label: '2B' },
        { key: 'triples', label: '3B' },
        { key: 'hr', label: 'HR' },
        { key: 'rbi', label: 'RBI' },
        { key: 'bb', label: 'BB' },
        { key: 'k', label: 'SO' },
        { key: 'sb', label: 'SB' },
        { key: 'avg', label: 'AVG' },
        { key: 'obp', label: 'OBP' },
        { key: 'slg', label: 'SLG' },
        { key: 'ops', label: 'OPS' },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Header Removed as requested ("Team Statistics - Season stats...") */}

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800">
                        <thead>
                            <tr className="bg-slate-950 text-slate-400">
                                <th
                                    className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider sticky left-0 z-10 bg-slate-950 border-r border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.3)] min-w-[180px] cursor-pointer hover:text-white transition-colors"
                                    onClick={() => handleSort('playerName')}
                                >
                                    Player <SortIcon colKey="playerName" />
                                </th>
                                {headers.map(h => (
                                    <th
                                        key={h.key}
                                        className="px-3 py-4 text-center text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                                        onClick={() => handleSort(h.key)}
                                        title={h.tooltip}
                                    >
                                        {h.label} <SortIcon colKey={h.key} />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {sortedStats.map((player) => (
                                <tr key={player.id} className="hover:bg-slate-800/60 transition-colors group">
                                    <td className="px-4 py-3 whitespace-nowrap sticky left-0 z-10 bg-slate-900 group-hover:bg-slate-800/60 border-r border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {player.photoURL ? (
                                                    <img src={player.photoURL} alt={player.playerName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[10px] text-slate-500 font-mono">#{player.playerNumber || '-'}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <span className="block text-sm font-bold text-slate-200 truncate max-w-[140px] group-hover:text-blue-400 transition-colors">
                                                    {player.playerName}
                                                </span>
                                                <span className="text-[10px] text-slate-500 block">
                                                    {player.playerPosition || 'Player'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {headers.map(h => (
                                        <td key={h.key} className={`px-3 py-3 whitespace-nowrap text-center text-sm font-medium ${['avg', 'ops', 'obp', 'slg'].includes(h.key) ? 'text-blue-400 font-mono' : 'text-slate-300'
                                            }`}>
                                            {player[h.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {stats.length === 0 && (
                <div className="text-center py-12 text-slate-500 italic">
                    No stats available for this season yet.
                </div>
            )}
        </div>
    );
}
