import { Team } from '@/types';
import Link from 'next/link';
import { FaTrophy } from 'react-icons/fa';

interface StandingsTableProps {
    standings: Team[];
    competitionId?: string; // Optional now since links go to /t/ directly
}

export default function StandingsTable({ standings }: StandingsTableProps) {
    if (!standings || standings.length === 0) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm shadow-xl rounded-2xl p-8 text-center border border-slate-700">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-700 mb-4">
                    <FaTrophy className="text-slate-500 text-xl" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-1">No Standings Yet</h2>
                <p className="text-slate-400 text-sm">Standings data will appear here once games are played.</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-slate-700">
            <div className="px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FaTrophy className="text-yellow-500" />
                    League Standings
                </h2>
                <span className="text-xs font-medium text-emerald-400 bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-500/30 shadow-sm">
                    Regular Season
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700/50">
                    <thead>
                        <tr className="bg-slate-900/50 text-slate-400">
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Rank</th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Team</th>
                            <th scope="col" className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-emerald-400">W</th>
                            <th scope="col" className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-red-400">L</th>
                            <th scope="col" className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">T</th>
                            <th scope="col" className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-blue-400">AVG</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {standings.map((team, index) => (
                            <tr key={team.teamId} className="hover:bg-blue-600/10 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-bold w-12 text-center group-hover:text-white transition-colors">
                                    {index + 1}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link
                                        href={`/t/${team.teamId}`}
                                        className="flex items-center gap-3 group-hover:translate-x-1 transition-transform duration-200"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-400 font-bold text-xs overflow-hidden shadow-sm">
                                            {team.logoURL ? (
                                                <img src={team.logoURL} alt={team.teamName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-lg">⚾</span>
                                            )}
                                        </div>
                                        <span className="text-sm font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                                            {team.teamName}
                                        </span>
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-emerald-400">{team.wins}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-red-400/80">{team.losses}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-slate-500">{team.ties}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono font-bold text-blue-400">
                                    {team.teamStats?.avg || '.000'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
