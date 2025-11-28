import { Facebook, Instagram, Twitter } from 'lucide-react';
import Link from 'next/link';
/* eslint-disable @next/next/no-img-element */

export default function Footer() {
    return (
        <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <img src="/logo.png" alt="StatKeeper Logo" className="h-12 w-auto" />
                            <span className="font-bold text-xl text-gray-900">StatKeeper</span>
                        </Link>
                        <p className="text-gray-500 max-w-xs mb-6">
                            Empowering athletes and coaches with professional-grade analytics tools.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-pink-600 transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-blue-800 transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
                        <ul className="space-y-3 text-gray-600">
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Download</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Changelog</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
                        <ul className="space-y-3 text-gray-600">
                            <li><a href="#" className="hover:text-blue-600 transition-colors">About</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Contact</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} StatKeeper. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm text-gray-500">
                        <a href="#" className="hover:text-gray-900">Privacy Policy</a>
                        <a href="#" className="hover:text-gray-900">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
