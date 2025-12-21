"use client";
import SpotlightReel from "@/components/SpotlightReel";
import { db } from "@/lib/firebase";
import { calculateAvg, calculateOPS } from "@/lib/helpers";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaMobileAlt } from "react-icons/fa";

interface TeamResult {
  id: string;
  teamName: string;
  managerName?: string;
  photoURL?: string;
}

export default function LandingPage() {
  const [recentTeams, setRecentTeams] = useState<TeamResult[]>([]);
  const [recentLeagues, setRecentLeagues] = useState<any[]>([]);
  const [spotlightPlayers, setSpotlightPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Leagues (Smart Hybrid Sort: Logo Priority + Fill)
        const leaguesQuery = query(collection(db, "competitions"), limit(50));
        const leaguesSnap = await getDocs(leaguesQuery);
        const allLeagues = leaguesSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || "Unnamed League",
          logoUrl: doc.data().logoUrl
        }));

        const leaguesWithLogo = allLeagues.filter(l => l.logoUrl);
        const leaguesNoLogo = allLeagues.filter(l => !l.logoUrl);
        // Combine: Logos first, then fill with others up to 10
        const sortedLeagues = [...leaguesWithLogo, ...leaguesNoLogo].slice(0, 10);
        setRecentLeagues(sortedLeagues);

        // 2. Fetch Teams (Smart Hybrid Sort: Logo Priority + Fill)
        const teamsQuery = query(collection(db, "teams"), limit(50));
        const teamsSnap = await getDocs(teamsQuery);
        const allTeams = teamsSnap.docs.map(doc => ({
          id: doc.id,
          teamName: doc.data().teamName || "Unnamed Team",
          managerName: doc.data().managerName,
          photoURL: doc.data().photoURL
        }));

        const teamsWithLogo = allTeams.filter(t => t.photoURL);
        const teamsNoLogo = allTeams.filter(t => !t.photoURL);
        // Combine: Logos first, then fill with others up to 10
        const sortedTeams = [...teamsWithLogo, ...teamsNoLogo].slice(0, 10);
        setRecentTeams(sortedTeams);

        // 3. Fetch Spotlight Players (Teams-First Hybrid Strategy)
        try {
          // A. Fetch a large batch of teams (Hybrid: Get mostly with logos, but fill if needed)
          const teamsBatchQuery = query(collection(db, "teams"), limit(50));
          const teamsBatchSnap = await getDocs(teamsBatchQuery);

          const allTeamsRaw = teamsBatchSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

          // Hybrid Sort Teams: Logo First -> Then No Logo
          const tWith = allTeamsRaw.filter(t => t.photoURL);
          const tWithout = allTeamsRaw.filter(t => !t.photoURL);
          const candidateTeams = [...tWith, ...tWithout].slice(0, 15); // Take top 15 candidates for pool

          // B. Fetch Players from these prioritized teams
          const allPlayers: any[] = [];

          await Promise.all(candidateTeams.map(async (team) => {
            try {
              const rosterQuery = query(collection(db, "teams", team.id, "roster"), limit(5));
              const rosterSnap = await getDocs(rosterQuery);

              const teamPlayers = rosterSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                teamId: team.id,
                fetchedTeamLogo: team.photoURL // Attach logo (or undefined)
              }));

              allPlayers.push(...teamPlayers);
            } catch (e) {
              console.error(`Error fetching roster for team ${team.id}`, e);
            }
          }));

          // C. Calculate stats
          const playersWithStats = allPlayers.map(p => ({
            ...p,
            avg: calculateAvg(Number(p.hits || 0), Number(p.ab || 0)),
            ops: calculateOPS(
              Number(p.hits || 0), Number(p.ab || 0), Number(p.bb || 0), Number(p.hbp || 0), Number(p.sf || 0),
              Number(p.doubles || 0), Number(p.triples || 0), Number(p.hr || 0)
            )
          }));

          // D. Sort by Performance (OPS) with Hybrid Priority
          // Priority 1: Player Photo | Priority 2: Team Logo | Priority 3: OPS
          const performanceSorted = playersWithStats.sort((a, b) => {
            const hasPhotoA = !!a.photoURL;
            const hasPhotoB = !!b.photoURL;
            if (hasPhotoA && !hasPhotoB) return -1;
            if (!hasPhotoA && hasPhotoB) return 1;

            const hasLogoA = !!a.fetchedTeamLogo;
            const hasLogoB = !!b.fetchedTeamLogo;
            if (hasLogoA && !hasLogoB) return -1;
            if (!hasLogoA && hasLogoB) return 1;

            return parseFloat(b.ops) - parseFloat(a.ops);
          });

          // E. Diversity Filter: Max 2 players per team
          const teamCounts: { [key: string]: number } = {};
          const diversePlayers: any[] = [];

          for (const player of performanceSorted) {
            if (diversePlayers.length >= 10) break;

            const tid = player.teamId;
            const count = teamCounts[tid] || 0;

            if (count < 2) {
              diversePlayers.push(player);
              teamCounts[tid] = count + 1;
            }
          }

          setSpotlightPlayers(diversePlayers);
        } catch (e) {
          console.warn("Could not fetch spotlight players:", e);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSelectTeam = (teamId: string) => {
    router.push(`/t/${teamId}`);
  };

  const handleSelectLeague = (leagueId: string) => {
    router.push(`/l/${leagueId}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0f172a] text-white font-sans overflow-x-hidden">

      {/* Hero Section - Ultra Compact & Minimalist */}
      <section className="relative w-full py-4 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Real App Logo - Rounded as requested */}
          <div className="w-24 h-24 mb-2 drop-shadow-2xl">
            <img src="/logo.png" alt="StatKeeper Logo" className="w-full h-full object-contain rounded-2xl" />
          </div>

          <h1 className="text-4xl md:text-5xl font-black italic tracking-wide text-white drop-shadow-lg mb-1">
            StatKeeper
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-lg mb-3">
            The professional platform for amateur leagues.
          </p>

          {/* Download App CTA */}
          <a
            href="https://statkeeperweb.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-10 py-1.5 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all flex items-center gap-2 group text-sm"
          >
            <FaMobileAlt className="text-base group-hover:rotate-12 transition-transform" />
            <span>Download App</span>
          </a>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-10 pb-12">

          <div className="container mx-auto px-4 flex flex-col gap-10">
            {/* Leagues Section - Top Priority */}
            {recentLeagues.length > 0 && (
              <section>
                <div className="flex justify-between items-center mb-2 px-1">
                  <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Active Leagues</h2>
                  {/* Scroll Hint Restored */}
                  <span className="text-[10px] text-slate-600 uppercase tracking-widest hidden md:block animate-pulse">Scroll →</span>
                </div>

                <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar snap-x">
                  {recentLeagues.map((league) => (
                    <div
                      key={league.id}
                      onClick={() => handleSelectLeague(league.id)}
                      className="min-w-[240px] md:min-w-[280px] snap-start p-3 cursor-pointer group flex items-center gap-3 !bg-slate-900 !rounded-3xl !shadow-2xl !border-2 !border-yellow-500/30 !shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:!border-yellow-400 hover:!shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all duration-300"
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 overflow-hidden flex-shrink-0">
                        {league.logoUrl ? (
                          <img src={league.logoUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">🏆</div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">{league.name}</h3>
                        <p className="text-[10px] text-slate-500 uppercase">View Standings</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Teams Section */}
            <section>
              <div className="flex justify-between items-center mb-2 px-1">
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Active Teams</h2>
                <span className="text-[10px] text-slate-600 uppercase tracking-widest hidden md:block animate-pulse">Scroll →</span>
              </div>

              <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar snap-x">
                {recentTeams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => handleSelectTeam(team.id)}
                    className="min-w-[200px] md:min-w-[240px] snap-start p-4 cursor-pointer group flex flex-col items-center text-center !bg-slate-900 !rounded-3xl !shadow-2xl !border-2 !border-yellow-500/30 !shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:!border-yellow-400 hover:!shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all duration-300"
                  >
                    <div className="w-16 h-16 mb-2 rounded-full bg-slate-900 border-2 border-slate-700 overflow-hidden flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                      {team.photoURL ? (
                        <img src={team.photoURL} alt={team.teamName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">⚾</span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">
                      {team.teamName}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                      {team.managerName || 'StatKeeper'}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* View Demo Button - Requested 'Below Users' */}
            <div className="flex justify-center mt-2 pb-4">
              <a
                href="https://statkeeperweb.vercel.app/#demo"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-2 rounded-full border border-slate-600 bg-slate-800/50 text-slate-300 font-semibold hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2 text-sm backdrop-blur-md"
              >
                <span>🎥</span>
                <span>View Demo</span>
              </a>
            </div>
          </div>

          {/* Player Spotlight Reel - Refactored */}
          <SpotlightReel players={spotlightPlayers} />

        </div>
      )}

      {/* Background Decorations */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
