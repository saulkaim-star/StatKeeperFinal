import { ClipboardList, User, Users } from 'lucide-react';

export default function Ecosystem() {
    return (
        <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
                        The perfect ecosystem for your league
                    </h2>
                    <p className="text-lg text-gray-600">
                        The ultimate tool for amateur leagues that want the professional experience, without the professional-level work.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Organizers */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ClipboardList className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Organizers</h3>
                        <p className="text-gray-600 mb-6">
                            Create the league and watch the stats run themselves. No more manual data entry or spreadsheets.
                        </p>
                        <div className="relative w-full aspect-[9/16] max-w-[180px] mx-auto rounded-xl overflow-hidden shadow-lg border-4 border-gray-900/5">
                            <img src="/images/organizer-demo.jpg" alt="Organizer App Interface" className="w-full h-full object-cover" />
                        </div>
                    </div>

                    {/* Managers */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center relative transform md:-translate-y-4 md:shadow-xl border-blue-100 hover:shadow-2xl transition-all">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                            Most Popular
                        </div>
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Managers</h3>
                        <p className="text-gray-600 mb-6">
                            Score the game from their phone with simple taps. It's intuitive, fast, and requires no paper needed.
                        </p>
                        <div className="relative w-full aspect-[9/16] max-w-[180px] mx-auto rounded-xl overflow-hidden shadow-lg border-4 border-blue-100">
                            <img src="/images/manager-demo.jpg" alt="Manager App Interface" className="w-full h-full object-cover" />
                        </div>
                    </div>

                    {/* Players */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <User className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Players</h3>
                        <p className="text-gray-600 mb-6">
                            See their stats updated right after their at-bat. Track progress and compare with league leaders instantly.
                        </p>
                        <div className="relative w-full aspect-[9/16] max-w-[180px] mx-auto rounded-xl overflow-hidden shadow-lg border-4 border-gray-900/5">
                            <img src="/images/player-demo.jpg" alt="Player App Interface" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
