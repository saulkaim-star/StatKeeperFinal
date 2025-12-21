import { CheckCircle2 } from 'lucide-react';
/* eslint-disable @next/next/no-img-element */

export default function Hero() {
    return (
        <section className="pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-[100px] opacity-30"></div>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">

                    {/* Text Content */}
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-primary/20 text-primary text-sm font-semibold mb-6 backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                            </span>
                            Now Available on iOS & Android
                        </div>

                        <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
                            Baseball stats with <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                                no official scorekeeper
                            </span> and no paper.
                        </h1>

                        <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-lg">
                            Instant results for your league! StatKeeper is the smartest way to run your league's stats, designed to eliminate manual work.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-10">
                            <a
                                href="https://apps.apple.com/il/app/statkeeper-baseball/id6755344006"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 bg-primary text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20"
                            >
                                Download on iOS
                            </a>
                            <a
                                href="https://play.google.com/store/apps/details?id=com.baseballteamapp"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 bg-slate-800 text-white border border-slate-700 px-8 py-4 rounded-xl font-semibold hover:bg-slate-700 transition-all hover:border-slate-600"
                            >
                                Download for Android
                            </a>
                        </div>

                        <div className="flex items-center gap-6 text-sm font-medium text-gray-400">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                                <span>Free to start</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                                <span>No credit card required</span>
                            </div>
                        </div>
                    </div>

                    {/* Hero Image / Mockup Placeholder */}
                    <div className="relative lg:h-[600px] flex items-center justify-center">
                        {/* Abstract Background Shapes */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary rounded-full blur-[120px] opacity-20 animate-pulse"></div>

                        {/* Phone Mockup Placeholder */}
                        <div className="relative z-10 w-[300px] h-[600px] bg-black rounded-[2rem] border-4 border-primary shadow-2xl shadow-primary/20 overflow-hidden ring-1 ring-slate-700/50">
                            <div className="absolute top-0 w-full h-full bg-slate-900 flex items-center justify-center">
                                <img
                                    src="/scoring.jpg"
                                    alt="StatKeeper Scoring Interface"
                                    className="w-full h-full object-cover opacity-80"
                                />
                            </div>
                        </div>

                        {/* Floating Elements (Decorations) */}
                        <div className="absolute top-20 right-10 bg-slate-800/90 backdrop-blur-md p-4 rounded-2xl shadow-xl z-20 animate-bounce delay-700 border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center text-primary font-bold">W</div>
                                <div>
                                    <p className="text-xs text-gray-400">Win Rate</p>
                                    <p className="font-bold text-white">85%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
