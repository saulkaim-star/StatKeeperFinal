"use client";
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { FaCalendarAlt, FaChartBar, FaHome, FaImages, FaUsers } from 'react-icons/fa';

export default function Navbar() {
    const pathname = usePathname();
    const params = useParams();

    const teamId = params?.teamId as string;
    const leagueId = params?.leagueId as string;

    // Determine Context
    const isTeamContext = pathname?.startsWith('/t/') && teamId;
    const isLeagueContext = pathname?.startsWith('/l/') && leagueId;

    let links: { name: string; href: string; icon: any }[] = [];
    let homeLink = "/";
    let brandName = "StatKeeper";

    if (isTeamContext) {
        homeLink = `/t/${teamId}`;
        links = [
            { name: 'Home', href: `/t/${teamId}`, icon: FaHome },
            { name: 'Roster', href: `/t/${teamId}/roster`, icon: FaUsers },
            { name: 'Gallery', href: `/t/${teamId}/gallery`, icon: FaImages },
            { name: 'Schedule', href: `/t/${teamId}/schedule`, icon: FaCalendarAlt },
            { name: 'Stats', href: `/t/${teamId}/stats`, icon: FaChartBar },
        ];
    } else if (isLeagueContext) {
        homeLink = `/l/${leagueId}`;
        brandName = "StatKeeper"; // Could fetch real name dynamically if needed
        links = [
            { name: 'Home', href: `/l/${leagueId}`, icon: FaHome },
            { name: 'Stats', href: `/l/${leagueId}/stats`, icon: FaChartBar },
            { name: 'Schedule', href: `/l/${leagueId}/schedule`, icon: FaCalendarAlt },
            { name: 'Gallery', href: `/l/${leagueId}/feed`, icon: FaImages },
        ];
    }

    if (!isTeamContext && !isLeagueContext) {
        return (
            <nav className="bg-slate-900 border-b border-white/10 p-4 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-xl font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                        <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-full" />
                        StatKeeper
                    </Link>
                </div>
            </nav>
        );
    }

    return (
        <nav className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between h-16 items-center">
                    {/* Brand */}
                    <Link href={homeLink} className={`flex items-center gap-2 text-xl font-black italic tracking-wide text-white hover:text-blue-400 transition-colors`}>
                        <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-full" />
                        {brandName}
                    </Link>

                    {/* Links */}
                    <div className="flex gap-6">
                        {links.map(link => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors
                                        ${isActive ? 'text-blue-400' : 'text-slate-400 hover:text-white'}
                                    `}
                                >
                                    <span className="text-lg mb-0.5"><link.icon /></span>
                                    <span className="hidden md:block">{link.name}</span>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
}
