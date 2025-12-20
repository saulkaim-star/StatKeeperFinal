import ScheduleList from "@/components/ScheduleList";
import { getLeagueData } from "@/lib/leagueService";
import Link from "next/link";

export default async function SchedulePage({ params }: { params: { leagueId: string } }) {

    // Fetch Data
    const leagueData = await getLeagueData(params.leagueId);

    if (!leagueData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center">
                <h1 className="text-4xl font-bold text-slate-500">League Not Found</h1>
                <Link href="/" className="mt-4 text-blue-400 hover:underline">Return to Home</Link>
            </div>
        );
    }

    const { info, games } = leagueData;

    const now = new Date();
    const upcomingGames = games.filter(g => {
        const d = new Date(g.gameDate);
        return !g.status || g.status === 'scheduled' || (d >= now && g.status !== 'completed' && g.status !== 'final');
    }).sort((a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime());

    const pastGames = games.filter(g => {
        const d = new Date(g.gameDate);
        return g.status === 'completed' || g.status === 'final' || d < now;
    }).sort((a, b) => new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime());

    return (
        <div className="container mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-8">
                {/* Upcoming */}
                {upcomingGames.length > 0 && (
                    <ScheduleList games={upcomingGames} title="Upcoming Games" />
                )}

                {/* Past Results */}
                {pastGames.length > 0 && (
                    <ScheduleList games={pastGames} title="Final Results" />
                )}

                {games.length === 0 && (
                    <div className="text-center py-12 text-slate-500">No games found.</div>
                )}
            </div>
        </div>
    );
}
