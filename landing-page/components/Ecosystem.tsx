import { ClipboardList, User, Users } from 'lucide-react';

export default function Ecosystem() {
    return (
        <section className="py-24 bg-slate-900/50 border-y border-slate-800/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
                        The perfect ecosystem for your league
                    </h2>
                    <p className="text-lg text-gray-400">
                        The ultimate tool for amateur leagues that want the professional experience, without the professional-level work.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Organizers */}
                    <div className="bg-card p-8 rounded-2xl shadow-lg shadow-black/20 border border-card-border text-center hover:bg-slate-800 transition-all group">
                        <div className="w-16 h-16 bg-slate-800 text-primary rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform ring-1 ring-slate-700">
                            <ClipboardList className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Organizers</h3>
                        <p className="text-gray-400 mb-6">
                            Create the league and watch the stats run themselves. No more manual data entry or spreadsheets.
                        </p>
                        <div className="relative w-full aspect-[9/16] max-w-[180px] mx-auto rounded-[2rem] overflow-hidden shadow-2xl border-4 border-primary shadow-primary/20">
                            <img src="/images/organizer-demo.jpg" alt="Organizer App Interface" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
                        </div>
                    </div>

                    {/* Managers */}
                    <div className="bg-card p-8 rounded-2xl shadow-xl shadow-black/40 border border-primary/30 text-center relative transform md:-translate-y-4 hover:shadow-primary/10 transition-all">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-slate-900 px-4 py-1 rounded-full text-sm font-bold shadow-lg shadow-primary/20">
                            Most Popular
                        </div>
                        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-primary/30">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Managers</h3>
                        <p className="text-gray-300 mb-6">
                            Score the game from their phone with simple taps. It's intuitive, fast, and requires no paper needed.
                        </p>
                        <div className="relative w-full aspect-[9/16] max-w-[180px] mx-auto rounded-[2rem] overflow-hidden shadow-2xl border-4 border-primary shadow-primary/30">
                            <img src="/images/manager-demo.jpg" alt="Manager App Interface" className="w-full h-full object-cover" />
                        </div>
                    </div>

                    {/* Players */}
                    <div className="bg-card p-8 rounded-2xl shadow-lg shadow-black/20 border border-card-border text-center hover:bg-slate-800 transition-all group">
                        <div className="w-16 h-16 bg-slate-800 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform ring-1 ring-slate-700">
                            <User className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Players</h3>
                        <p className="text-gray-400 mb-6">
                            See their stats updated right after their at-bat. Track progress and compare with league leaders instantly.
                        </p>
                        <div className="relative w-full aspect-[9/16] max-w-[180px] mx-auto rounded-[2rem] overflow-hidden shadow-2xl border-4 border-primary shadow-primary/20">
                            <img src="/images/player-demo.jpg" alt="Player App Interface" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                </div>
            </div>

            {/* View Live Example Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-16 px-4">
                <a
                    href="https://team-web-steel.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-full border border-slate-700 hover:border-slate-500 transition-all shadow-lg hover:shadow-xl"
                >
                    <span>👀</span>
                    <span>View Live League Example</span>
                </a>
                <a
                    href="https://team-web-steel.vercel.app/t/10Eq7V2tmbePVZmq7U2b"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary hover:bg-yellow-400 text-slate-900 font-bold rounded-full border border-yellow-600 hover:border-yellow-500 transition-all shadow-lg shadow-yellow-500/20 hover:shadow-xl"
                >
                    <span>⚾</span>
                    <span>View Example Team</span>
                </a>
            </div>
        </section>
    );
}
