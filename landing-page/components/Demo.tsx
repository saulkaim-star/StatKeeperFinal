
export default function Demo() {
    return (
        <section id="demo" className="py-24 bg-gray-900 text-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    <div className="order-2 lg:order-1">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
                            See it in action
                        </h2>
                        <p className="text-lg text-gray-400 mb-8">
                            Watch how easy it is to track a game with StatKeeper. Our intuitive interface ensures you never miss a moment while recording stats.
                        </p>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-lg">1</div>
                                <div>
                                    <h3 className="font-semibold text-xl mb-2">Setup in seconds</h3>
                                    <p className="text-gray-400">Create a match, select lineups, and start the clock. It's that fast.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-lg">2</div>
                                <div>
                                    <h3 className="font-semibold text-xl mb-2">One-tap tracking</h3>
                                    <p className="text-gray-400">Record shots, fouls, and goals with a single tap on the screen.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-lg">3</div>
                                <div>
                                    <h3 className="font-semibold text-xl mb-2">Instant reports</h3>
                                    <p className="text-gray-400">Get a full match report immediately after the final whistle.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="order-1 lg:order-2 relative flex justify-center">
                        {/* Video Embed */}
                        <div className="w-full max-w-[320px] aspect-[9/16] bg-gray-900 rounded-[2rem] overflow-hidden shadow-2xl border-8 border-gray-800 relative">
                            <iframe
                                width="100%"
                                height="100%"
                                src="https://www.youtube.com/embed/LOgeOHxd5rY?start=4&rel=0"
                                title="StatKeeper Demo"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute inset-0 w-full h-full"
                            ></iframe>
                        </div>

                        {/* Decorative background blur */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[500px] bg-blue-600/20 blur-3xl -z-10 rounded-full"></div>
                    </div>

                </div>
            </div>
        </section>
    );
}
