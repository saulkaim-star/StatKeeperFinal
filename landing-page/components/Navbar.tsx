import { Facebook } from 'lucide-react';
import Link from 'next/link';
/* eslint-disable @next/next/no-img-element */

export default function Navbar() {
    return (
        <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center gap-2">
                            <img src="/logo.png" alt="StatKeeper Logo" className="h-12 w-auto rounded-2xl" />
                            <span className="font-bold text-xl text-white">StatKeeper</span>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="#features" className="text-gray-300 hover:text-primary transition-colors font-medium">
                            Features
                        </Link>
                        <Link href="#demo" className="text-gray-300 hover:text-primary transition-colors font-medium">
                            Demo
                        </Link>
                        <Link href="#testimonials" className="text-gray-300 hover:text-primary transition-colors font-medium">
                            Reviews
                        </Link>
                        <a
                            href="https://www.facebook.com/profile.php?id=61584932816998"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2"
                        >
                            <Facebook className="w-5 h-5 fill-current" /> Follow us on Facebook
                        </a>
                    </div>
                </div>
            </div>
        </nav>
    );
}
