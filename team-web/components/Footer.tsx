
export default function Footer() {
    return (
        <footer className="w-full py-8 mt-12 border-t border-slate-800 bg-slate-950/30">
            <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-2">
                <p className="text-slate-500 text-sm font-medium">
                    &copy; {new Date().getFullYear()} StatKeeper. All rights reserved.
                </p>
                <p className="text-slate-600 text-[10px] uppercase tracking-widest font-bold">
                    Official Team Portal
                </p>
            </div>
        </footer>
    );
}
