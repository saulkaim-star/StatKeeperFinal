"use client";
import ScheduleList from "@/components/ScheduleList";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function TeamSchedulePage({ params }: { params: { teamId: string } }) {
    const [upcomingGames, setUpcomingGames] = useState<any[]>([]);
    const [pastGames, setPastGames] = useState<any[]>([]);
    const [teamName, setTeamName] = useState("");
    const [loading, setLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!params.teamId) return;

            const logs: string[] = [];
            const addLog = (msg: string) => logs.push(msg);

            try {
                // 1. Fetch Team Name
                try {
                    const teamDoc = await getDoc(doc(db, "teams", params.teamId));
                    if (teamDoc.exists()) {
                        setTeamName(teamDoc.data().teamName || "Team");
                    }
                } catch (e) { console.error("Team fetch error", e); }

                const teamIdStr = params.teamId;
                const teamIdNum = Number(params.teamId);
                const allGames: any[] = [];

                // --- Strategy 1: LOCAL GAMES (teams/{id}/games) ---
                try {
                    const localQ = query(collection(db, 'teams', params.teamId, 'games'));
                    const localSnap = await getDocs(localQ);
                    addLog(`Local Subcollection: Found ${localSnap.size} games.`);
                    localSnap.forEach(d => allGames.push({ id: d.id, ...d.data() }));
                } catch (e: any) {
                    addLog(`Local Fetch Error: ${e.code || e.message}`);
                }

                // --- Strategy 2: LEAGUE GAMES via REVERSE LOOKUP ---
                let foundCompetitionId = null;
                try {
                    const compTeamQ1 = query(collection(db, 'competition_teams'), where('teamId', '==', teamIdStr));
                    const compTeamSnap1 = await getDocs(compTeamQ1);

                    if (!compTeamSnap1.empty) {
                        foundCompetitionId = compTeamSnap1.docs[0].data().competitionId;
                        addLog(`Found Competition ID via String: ${foundCompetitionId}`);
                    } else if (!isNaN(teamIdNum)) {
                        const compTeamQ2 = query(collection(db, 'competition_teams'), where('teamId', '==', teamIdNum));
                        const compTeamSnap2 = await getDocs(compTeamQ2);
                        if (!compTeamSnap2.empty) {
                            foundCompetitionId = compTeamSnap2.docs[0].data().competitionId;
                            addLog(`Found Competition ID via Number: ${foundCompetitionId}`);
                        }
                    }
                } catch (e: any) {
                    addLog(`Reverse Lookup Error: ${e.code || e.message}`);
                }

                if (foundCompetitionId) {
                    try {
                        const leagueQ = query(collection(db, 'competition_games'), where('competitionId', '==', foundCompetitionId));
                        const leagueSnap = await getDocs(leagueQ);
                        addLog(`League Games (CompID): Found ${leagueSnap.size} games.`);

                        leagueSnap.forEach(d => {
                            const data = d.data();
                            if (String(data.homeTeamId) === String(teamIdStr) || String(data.awayTeamId) === String(teamIdStr)) {
                                allGames.push({ id: d.id, ...data });
                            }
                        });
                    } catch (e: any) {
                        addLog(`League Fetch Error: ${e.code || e.message}`);
                    }
                } else {
                    addLog("No Competition ID found. Skipping restricted league query.");
                }

                // Dedup by ID
                const uniqueGames = Array.from(new Map(allGames.map(item => [item.id, item])).values());
                addLog(`Total Unique Games: ${uniqueGames.length}`);

                // --- 3. FETCH TEAM LOGOS ---
                // Collect IDs
                const teamIdsToFetch = new Set<string>();
                uniqueGames.forEach(g => {
                    if (g.homeTeamId) teamIdsToFetch.add(String(g.homeTeamId));
                    if (g.awayTeamId) teamIdsToFetch.add(String(g.awayTeamId));
                });

                // Fetch Logos
                const logoMap: { [key: string]: string } = {};
                if (teamIdsToFetch.size > 0) {
                    try {
                        const logoPromises = Array.from(teamIdsToFetch).map(async (tid) => {
                            try {
                                const tDoc = await getDoc(doc(db, 'teams', tid));
                                if (tDoc.exists()) {
                                    // Check all possible logo fields
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
                        addLog(`Fetched logos for ${Object.keys(logoMap).length} teams.`);
                    } catch (e: any) {
                        addLog(`Logo Fetch Error: ${e.message}`);
                    }
                }

                const now = new Date();

                // Helper for status
                const isFinal = (status: string) => {
                    const s = (status || '').toLowerCase();
                    return s === 'final' || s === 'completed';
                };

                // ROBUST DATE PARSER
                const parseDate = (g: any) => {
                    const raw = g.gameDate || g.date;
                    if (!raw) return null;
                    if (raw.toDate) return raw.toDate();
                    if (raw.seconds) return new Date(raw.seconds * 1000);
                    return new Date(raw);
                };

                const formattedGames = uniqueGames.map((g: any) => {
                    const dateObj = parseDate(g);
                    // Use fetched logo OR existing one OR safe fallback (null, handled by component)
                    const homeLogo = logoMap[String(g.homeTeamId)] || g.homeTeamLogo || null;
                    const awayLogo = logoMap[String(g.awayTeamId)] || g.awayTeamLogo || null;

                    return {
                        id: g.id,
                        gameDate: dateObj ? dateObj.toISOString() : new Date().toISOString(),
                        status: isFinal(g.status) ? 'completed' : 'scheduled',
                        homeTeamName: g.homeTeamName,
                        homeTeamLogo: homeLogo,
                        homeScore: g.homeScore,
                        awayTeamName: g.awayTeamName,
                        awayTeamLogo: awayLogo,
                        awayScore: g.awayScore,
                        isValidDate: !!dateObj,
                        location: g.location
                    };
                });

                // Split into Upcoming vs Past
                const upcoming = formattedGames.filter(g => {
                    const d = new Date(g.gameDate);
                    return g.isValidDate && d >= now && g.status !== 'completed';
                }).sort((a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime());

                const past = formattedGames.filter(g => {
                    const d = new Date(g.gameDate);
                    return g.isValidDate && (g.status === 'completed' || d < now);
                }).sort((a, b) => new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime());

                setUpcomingGames(upcoming);
                setPastGames(past);
                setDebugInfo(logs);

            } catch (error: any) {
                console.error("Critical Error fetching schedule:", error);
                addLog(`Critical: ${error.message}`);
                setDebugInfo(logs);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params.teamId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header - Simplified */}


            <div className="space-y-8">
                {/* Upcoming */}
                {upcomingGames.length > 0 && (
                    <ScheduleList
                        games={upcomingGames}
                        title="Upcoming Games"
                        cardClassName="!bg-slate-900 !rounded-3xl !shadow-2xl !border-2 !border-yellow-500/30 !shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:!border-yellow-400 hover:!shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all duration-300"
                    />
                )}

                {/* Past Results */}
                <ScheduleList
                    games={pastGames}
                    title="Final Results"
                    cardClassName="!bg-slate-900 !rounded-3xl !shadow-2xl !border-2 !border-yellow-500/30 !shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:!border-yellow-400 hover:!shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all duration-300"
                />

                {/* Feedback / Empty State */}
                {upcomingGames.length === 0 && pastGames.length === 0 && (
                    <div className="text-center py-12 bg-slate-800/20 rounded-2xl border border-slate-800 border-dashed">
                        <p className="text-slate-500">No games found for this team.</p>
                        <div className="mt-4 text-[10px] text-slate-600 font-mono text-left max-w-md mx-auto bg-black/20 p-4 rounded">
                            <p className="font-bold mb-1">Debug Logs:</p>
                            {debugInfo.map((l, i) => <div key={i}>{l}</div>)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
