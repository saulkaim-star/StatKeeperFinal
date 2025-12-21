import { BarChart2, FileX, Globe, Smartphone, Trophy, Zap } from 'lucide-react';

const features = [
    {
        icon: <FileX className="w-6 h-6" />,
        title: "No More Paperwork",
        description: "Completely replace dugout paperwork. Log each player's at-bat with just a few taps on your phone."
    },
    {
        icon: <Zap className="w-6 h-6" />,
        title: "Real-time Magic",
        description: "The moment plays are logged, StatKeeper compiles every player's individual stats (AVG, HR, H) instantly."
    },
    {
        icon: <Trophy className="w-6 h-6" />,
        title: "League Leaders",
        description: "Automatically generates the 'League Leaders' board as stats are updated. Know who's on top immediately."
    },
    {
        icon: <BarChart2 className="w-6 h-6" />,
        title: "Live Standings",
        description: "Calculates and updates the W-L-T Standings as soon as the game ends. No manual calculations needed."
    },
    {
        icon: <Globe className="w-6 h-6" />,
        title: "Professional Web Portal",
        description: "Publishes everything to a professional web portal for all to see. Give your league a pro feel."
    },
    {
        icon: <Smartphone className="w-6 h-6" />,
        title: "Simple for Managers",
        description: "It's not a complicated scoring system. It's an ultra-fast way to capture outs, hits, HRs, and strikeouts."
    }
];

export default function Features() {
    return (
        <section id="features" className="py-24 bg-background relative overflow-hidden">
            {/* Decoración de fondo sutil */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
                        The smartest way to run your league
                    </h2>
                    <p className="text-lg text-gray-400">
                        Why rely on an official scorekeeper or waste time tallying stats on paper sheets? StatKeeper automates the entire process.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="p-8 rounded-2xl bg-card hover:bg-slate-800 transition-all border border-card-border hover:border-primary/30 group shadow-lg hover:shadow-primary/5">
                            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ring-1 ring-primary/20">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-gray-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
