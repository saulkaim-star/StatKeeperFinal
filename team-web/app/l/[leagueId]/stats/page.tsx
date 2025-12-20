import LeagueStatsClient from "@/components/LeagueStatsClient";
import { getLeagueData } from "@/lib/leagueService";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

export default async function LeagueStatsPage({ params }: { params: { leagueId: string } }) {
    const leagueData = await getLeagueData(params.leagueId);

    if (!leagueData) {
        return <div className="p-8 text-center text-white">League not found</div>;
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-20">
            {/* Header Removed */}
            <div className="flex items-center gap-4">
                <Link href={`/l/${params.leagueId}`} className="p-3 bg-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-slate-700">
                    <FaArrowLeft />
                </Link>
            </div>

            {/* Stats Table Client Component */}
            <LeagueStatsClient players={leagueData.leaguePlayerStats} />
        </div>
    );
}
