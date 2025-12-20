"use client";
import { db } from "@/lib/firebase";
import { collection, collectionGroup, getDocs, limit, query } from "firebase/firestore";
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

        // 1. Fetch Leagues
        const leaguesQuery = query(collection(db, "competitions"), limit(10));
        const leaguesSnap = await getDocs(leaguesQuery);
        const leagues = leaguesSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || "Unnamed League",
          logoUrl: doc.data().logoUrl
        }));
        setRecentLeagues(leagues);

        // 2. Fetch Teams
        const teamsQuery = query(collection(db, "teams"), limit(10));
        const teamsSnap = await getDocs(teamsQuery);
        const teams = teamsSnap.docs.map(doc => ({
          id: doc.id,
          teamName: doc.data().teamName || "Unnamed Team",
          managerName: doc.data().managerName,
          photoURL: doc.data().photoURL
        }));
        setRecentTeams(teams);

        // 3. Fetch Spotlight Players (Filter strategy)
        try {
          // Fetch more so we can filter client-side for photos without risking empty list if we used strictly 'where' without index
          const playersQuery = query(collectionGroup(db, 'roster'), limit(24));
          const playersSnap = await getDocs(playersQuery);
          const players = playersSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            teamId: doc.ref.parent.parent?.id
          })) as any[];

          // Sort: Players with photos get priority
          const sortedPlayers = players.sort((a, b) => {
            const hasPhotoA = !!a.photoURL;
            const hasPhotoB = !!b.photoURL;
            if (hasPhotoA && !hasPhotoB) return -1;
            if (!hasPhotoA && hasPhotoB) return 1;
            return 0;
          }).slice(0, 10); // Display top 10

          setSpotlightPlayers(sortedPlayers);
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
            <img src="/logo.png" alt="StatKeeper Logo" className="w-full h-full object-contain rounded-3xl" />
          </div>

          <h1 className="text-4xl md:text-5xl font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-purple-400 drop-shadow-lg mb-1">
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
                      className="min-w-[240px] md:min-w-[280px] snap-start bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3 cursor-pointer hover:bg-slate-800/80 transition-all group flex items-center gap-3"
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
                    className="min-w-[200px] md:min-w-[240px] snap-start bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 cursor-pointer hover:bg-slate-800/60 transition-all group flex flex-col items-center text-center"
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
          </div>

          {/* Player Spotlight Reel - Moved to Bottom */}
          {spotlightPlayers.length > 0 && (
            <section className="w-full overflow-hidden bg-slate-900/30 py-6 border-y border-slate-800/30 mt-4">
              <div className="container mx-auto px-4 mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest pl-1">Player Spotlight</h2>
                <span className="text-[10px] text-slate-600 uppercase tracking-widest hidden md:block">Top Performers</span>
              </div>

              <div className="relative w-full flex overflow-x-auto pb-4 gap-3 px-4 custom-scrollbar snap-x">
                {spotlightPlayers.map((player) => (
                  <div key={player.id} className="min-w-[140px] md:min-w-[160px] snap-center">
                    {/* Vertical Reel Card */}
                    <div className="aspect-[9/16] w-full bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700/50 relative group cursor-pointer hover:border-purple-500/50 transition-all hover:scale-[1.02] duration-300">
                      {player.photoURL ? (
                        <img src={player.photoURL} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-600 gap-2">
                          <span className="text-4xl">👤</span>
                          {/* Small hint if no photo */}
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-90" />

                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-white font-bold text-xs leading-tight truncate">{player.playerName}</h3>
                        <p className="text-[10px] text-purple-400 font-medium truncate">{player.playerPosition || "Athlete"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
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
