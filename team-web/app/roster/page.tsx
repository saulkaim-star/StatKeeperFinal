"use client";
import PlayerCardWeb from "@/components/PlayerCardWeb";
import { TEAM_ID } from '@/lib/config';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
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
    status?: string;
}

export default function RosterPage() {
    const [roster, setRoster] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Warning if no ID configured
        if (TEAM_ID === "YOUR_TEAM_ID_HERE") {
            console.warn("Please set your TEAM_ID in lib/config.ts");
            setLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(collection(db, 'teams', TEAM_ID, 'roster'), (snapshot) => {
            const players = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Player[];
            setRoster(players);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching roster:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (TEAM_ID === "YOUR_TEAM_ID_HERE") {
        return (
            <div className="p-8 text-center text-orange-400 border border-orange-500/50 rounded-xl bg-orange-900/20">
                <h2 className="text-xl font-bold">Configuration Needed</h2>
                <p>Please open <code>lib/config.ts</code> and paste your Team ID.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white italic tracking-wide">
                    Active Roster
                </h1>
                <p className="text-slate-400 mt-2">
                    Meet the squad ({roster.length} players).
                </p>
            </div>

            {roster.length === 0 ? (
                <p className="text-slate-500 italic">No players found in this roster.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {roster.map(player => (
                        <div key={player.id} className="transform hover:scale-105 transition-transform duration-300">
                            <PlayerCardWeb player={player} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
