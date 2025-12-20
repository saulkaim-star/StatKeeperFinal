"use client";
import { useState } from 'react';
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";

interface PlayerStats {
    id: string;
    playerName: string;
    playerNumber?: string | number;
    playerPosition?: string;
    photoURL?: string | null;
    teamName?: string;
    teamLogo?: string | null;

    // Counting Stats
    gp?: number;
    ab: number;
    r: number;
    h: number;
    doubles: number;
    triples: number;
    homeruns: number; // Changed from hr to homeruns to match internal types if needed, but display is HR
    rbi: number;
    bb?: number; // walks
    walks?: number;
    k: number;
    sb?: number;
    hbp?: number;
    sf?: number;

    // Rate Stats
    avg?: string;
    obp?: string;
    slg?: string;
    ops?: string;
    [key: string]: any;
}

type SortKey = keyof PlayerStats;

export default function LeagueStatsClient({ players }: { players: any[] }) {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
        key: 'avg',
        direction: 'desc'
    });

    // Normalize data slightly to ensure keys match
    const normalizedPlayers: PlayerStats[] = players.map(p => ({
        ...p,
        h: p.hits,      // Ensure h alias exists
        hr: p.homeruns, // Ensure hr alias exists
        bb: p.walks,    // Ensure bb alias exists
    }));

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const sortedPlayers = [...normalizedPlayers].sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        // 1. Text Sorting (Player Name, Team Name)
        if (sortConfig.key === 'playerName' || sortConfig.key === 'teamName') {
            const strA = String(valA || "").toLowerCase();
            const strB = String(valB || "").toLowerCase();
            if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        }

        // 2. Numeric Sorting (Stats)
        const numA = typeof valA === 'string' ? parseFloat(valA) : (valA || 0);
        const numB = typeof valB === 'string' ? parseFloat(valB) : (valB || 0);

        if (numA < numB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (numA > numB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ colKey }: { colKey: string }) => {
        if (sortConfig.key !== colKey) return <FaSort className="ml-1 text-slate-600 inline" size={10} />;
        return sortConfig.direction === 'asc'
            ? <FaSortUp className="ml-1 text-blue-400 inline" size={10} />
            : <FaSortDown className="ml-1 text-blue-400 inline" size={10} />;
    };

    const headers: { key: string; label: string; tooltip?: string }[] = [
        { key: 'teamName', label: 'Team' },
        { key: 'ab', label: 'AB' },
        // { key: 'r', label: 'R' }, // Removed as requested
        { key: 'h', label: 'H' },
        { key: 'doubles', label: '2B' },
        { key: 'triples', label: '3B' },
        { key: 'hr', label: 'HR' },
        { key: 'rbi', label: 'RBI' },
        { key: 'bb', label: 'BB' },
        { key: 'k', label: 'K' },
        { key: 'avg', label: 'AVG' },
        { key: 'obp', label: 'OBP' },
        { key: 'slg', label: 'SLG' },
        { key: 'ops', label: 'OPS' },
    ];

    return (
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
                        {sortedPlayers.map((player) => (
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
                                        {h.key === 'teamName' ? (
                                            <div className="flex items-center justify-start gap-2 pl-2">
                                                {player.teamLogo && <img src={player.teamLogo} className="w-5 h-5 rounded-full object-cover bg-slate-800" />}
                                                <span className="hidden sm:inline text-xs text-slate-400">{player.teamName}</span>
                                            </div>
                                        ) : (
                                            player[h.key]
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {players.length === 0 && (
                <div className="text-center py-12 text-slate-500 italic">
                    No stats available for this season yet.
                </div>
            )}
        </div>
    );
}
