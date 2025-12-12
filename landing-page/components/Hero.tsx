import { CheckCircle2 } from 'lucide-react';
/* eslint-disable @next/next/no-img-element */

export default function Hero() {
    return (
        <section className="pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

                    {/* Text Content */}
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Now Available on iOS & Android
                        </div>

                        <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-[1.1]">
                            Baseball stats with <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                no official scorekeeper
                            </span> and no paper.
                        </h1>

                        <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg">
                            Instant results for your league! StatKeeper is the smartest way to run your league's stats, designed to eliminate manual work.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-10">
                            <a
                                href="https://apps.apple.com/il/app/statkeeper-baseball/id6755344006"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-800 transition-all"
                            >
                                Download on iOS
                            </a>
                            <a
                                href="https://play.google.com/store/apps/details?id=com.baseballteamapp"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all hover:border-gray-300"
                            >
                                Download for Android
                            </a>
                        </div>

                        <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                <span>Free to start</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                <span>No credit card required</span>
                            </div>
                        </div>
                    </div>

                    {/* Hero Image / Mockup Placeholder */}
                    <div className="relative lg:h-[600px] flex items-center justify-center">
                        {/* Abstract Background Shapes */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>

                        {/* Phone Mockup Placeholder */}
                        <div className="relative z-10 w-[300px] h-[600px] bg-gray-900 rounded-[3rem] border-8 border-gray-900 shadow-2xl overflow-hidden">
                            <div className="absolute top-0 w-full h-full bg-gray-800 flex items-center justify-center">
                                <img
                                    src="/scoring.jpg"
                                    alt="StatKeeper Scoring Interface"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Floating Elements (Decorations) */}
                        <div className="absolute top-20 right-10 bg-white p-4 rounded-2xl shadow-xl z-20 animate-bounce delay-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">W</div>
                                <div>
                                    <p className="text-xs text-gray-500">Win Rate</p>
                                    <p className="font-bold text-gray-900">85%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
