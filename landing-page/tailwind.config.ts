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
                background: "rgb(var(--background) / <alpha-value>)",
                foreground: "rgb(var(--foreground) / <alpha-value>)",
                primary: {
                    DEFAULT: "rgb(var(--primary) / <alpha-value>)",
                    glow: "rgb(var(--primary-glow) / <alpha-value>)",
                },
                card: {
                    DEFAULT: "rgb(var(--card-bg) / <alpha-value>)",
                    border: "rgb(var(--card-border) / <alpha-value>)",
                },
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "hero-glow": "conic-gradient(from 180deg at 50% 50%, #1e293b 0deg, #0f172a 180deg, #1e293b 360deg)",
            },
        },
    },
    plugins: [],
};
export default config;
