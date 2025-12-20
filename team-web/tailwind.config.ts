import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                slate: {
                    800: '#1e293b',
                    900: '#0f172a',
                },
                emerald: {
                    500: '#10b981',
                },
                blue: {
                    500: '#3b82f6',
                    600: '#2563eb',
                }
            },
        },
    },
    plugins: [],
};
export default config;
