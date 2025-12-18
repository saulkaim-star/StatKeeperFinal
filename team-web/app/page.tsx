import Link from 'next/link';
import { FaArrowRight, FaBaseballBall, FaTrophy } from 'react-icons/fa';

// Mock Data for consistent display without backend
const CURRENT_LEAGUE = {
  id: 'mock-league-123',
  name: 'Liga Invernal 2024',
  season: 'Temporada Regular'
};

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 font-sans selection:bg-blue-500 selection:text-white text-white">

      {/* Navbar Simple */}
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-white/10 border border-white/20 p-1 flex items-center justify-center">
                {/* Logo placeholder if image is missing */}
                <FaBaseballBall className="text-white text-xl" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                StatKeeper Web
              </span>
            </div>
            <div className="flex gap-4">
              <a href="#" className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors">
                League Rules
              </a>
              <a href="#" className="text-sm font-medium text-blue-400 hover:text-blue-300">
                Download App
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 border-b border-slate-800">
        <div className="absolute inset-0 bg-blue-600/10 opacity-50 blur-3xl rounded-full -top-40 -right-40 w-96 h-96"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Live Updates
          </div>

          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 sm:text-6xl sm:tracking-tight lg:text-7xl mb-6">
            {CURRENT_LEAGUE.name}
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-400 leading-relaxed">
            The official hub for stats, standings, and live scores. Follow your team's journey to the championship.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <Link href={`/liga/${CURRENT_LEAGUE.id}`} className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-900/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
              View Standings <FaArrowRight />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats / Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-8 rounded-3xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-all group">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FaTrophy className="text-2xl text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Live Standings</h3>
            <p className="text-slate-400">Real-time updates to league tables as games finished.</p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-all group">
            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FaBaseballBall className="text-2xl text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Player Stats</h3>
            <p className="text-slate-400">Detailed tracking of batting averages, home runs, ERA, and more.</p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-all group">
            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-2xl text-purple-400 font-bold">VS</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Match Schedules</h3>
            <p className="text-slate-400">Never miss a game with complete season calendars and venue info.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} StatKeeper. Powered by Next.js & React Native.
          </p>
        </div>
      </footer>
    </div>
  );
}
