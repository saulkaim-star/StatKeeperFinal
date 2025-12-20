import LeagueGalleryClient from "@/components/LeagueGalleryClient";
import { getLeagueData } from "@/lib/leagueService";
import Link from "next/link";

export default async function GalleryPage({ params }: { params: { leagueId: string } }) {

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

    const { info } = leagueData;

    return (
        <div className="container mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Removed as requested */}

            <LeagueGalleryClient leagueId={params.leagueId} />
        </div>
    );
}
