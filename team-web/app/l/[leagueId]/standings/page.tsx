import StandingsTable from "@/components/StandingsTable";
import { getLeagueData } from "@/lib/leagueService";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

export default async function StandingsPage({ params }: { params: { leagueId: string } }) {

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

    const { info, standings } = leagueData;

    return (
        <div className="container mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/l/${params.leagueId}`} className="p-3 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                    <FaArrowLeft />
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-white italic tracking-wide">
                        {info.name}
                    </h1>
                    <p className="text-slate-400 font-medium">Official Standings</p>
                </div>
            </div>

            <StandingsTable standings={standings} />
        </div>
    );
}
