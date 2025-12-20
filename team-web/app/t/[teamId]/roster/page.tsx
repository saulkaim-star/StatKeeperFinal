"use client";
import PlayerCardWeb from "@/components/PlayerCardWeb";
import { db } from '@/lib/firebase';
import { calculateAvg, calculateOPS } from "@/lib/helpers";
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

interface Player {
    id: string;
    playerName: string;
    playerNumber?: string | number;
    playerPosition?: string;
    photoURL?: string | null;
    avg?: string | number;
    ops?: string | number;
    hits?: string | number;
    // Accumulators
    ab?: number;
    bb?: number;
    hbp?: number;
    sf?: number;
    doubles?: number;
    triples?: number;
    hr?: number;
    [key: string]: any;
}

export default function RosterPage({ params }: { params: { teamId: string } }) {
    const [roster, setRoster] = useState<Player[]>([]);
    const [teamLogo, setTeamLogo] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const teamId = params.teamId;
        if (!teamId) return;

        // 1. Fetch Team Logo
        const fetchTeamInfo = async () => {
            try {
                const tDoc = await getDoc(doc(db, 'teams', teamId));
                if (tDoc.exists()) {
                    const d = tDoc.data();
                    setTeamLogo(d.logoURL || d.photoURL || null);
                }
            } catch (e) { }
        };
        fetchTeamInfo();

        // 2. Real-time Roster Listener needed for base list
        const unsubscribe = onSnapshot(collection(db, 'teams', teamId, 'roster'), async (snapshot) => {
            const basePlayers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Init stats
                hits: 0, ab: 0, bb: 0, hbp: 0, sf: 0, doubles: 0, triples: 0, hr: 0
            })) as Player[];

            // 3. FETCH GAMES & CALCULATE STATS
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

                // Create a Map for easy stats update
                const statsMap = new Map<string, Player>();
                basePlayers.forEach(p => statsMap.set(p.id, { ...p }));

                // Aggregate
                uniqueGames.forEach((game) => {
                    const isHome = String(game.homeTeamId) === String(teamIdStr);
                    const boxScore = isHome ? game.homeBoxScore : game.awayBoxScore;

                    if (Array.isArray(boxScore)) {
                        boxScore.forEach((stat: any) => {
                            if (stat.id && statsMap.has(stat.id)) {
                                const p = statsMap.get(stat.id)!;
                                p.hits = Number(p.hits) + (Number(stat.game_hits) || 0);
                                p.ab = Number(p.ab) + (Number(stat.game_ab) || 0);
                                p.bb = Number(p.bb) + (Number(stat.game_bb) || 0);
                                p.hbp = Number(p.hbp) + (Number(stat.game_hbp) || 0); // Assuming these fields exist or are named similarly
                                p.sf = Number(p.sf) + (Number(stat.game_sf) || 0);
                                p.doubles = Number(p.doubles) + (Number(stat.game_doubles) || 0); // 2B
                                p.triples = Number(p.triples) + (Number(stat.game_triples) || 0); // 3B
                                p.hr = Number(p.hr) + (Number(stat.game_hr) || 0);
                                statsMap.set(stat.id, p);
                            }
                        });
                    }
                });

                // Final Calc
                const finalRoster = Array.from(statsMap.values()).map(p => ({
                    ...p,
                    avg: calculateAvg(Number(p.hits), Number(p.ab)),
                    ops: calculateOPS(
                        Number(p.hits), Number(p.ab), Number(p.bb), Number(p.hbp), Number(p.sf),
                        Number(p.doubles), Number(p.triples), Number(p.hr)
                    )
                }));

                setRoster(finalRoster);

            } catch (error) {
                console.error("Stats Calc Error:", error);
                setRoster(basePlayers); // Fallback to just list without stats
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [params.teamId]);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white italic tracking-wide uppercase">
                    Active Roster
                </h1>
                <p className="text-slate-400 mt-2 text-sm font-bold tracking-widest uppercase">
                    Meet the squad ({roster.length} players)
                </p>
            </div>

            {roster.length === 0 ? (
                <p className="text-slate-500 italic">No players found in this roster.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {roster.map(player => (
                        <div key={player.id} className="transform hover:scale-105 transition-transform duration-300">
                            <PlayerCardWeb player={player} teamLogo={teamLogo} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
