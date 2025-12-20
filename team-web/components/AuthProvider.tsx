"use client";
import { signInAnonymously } from "firebase/auth";
import { useEffect } from "react";
import { auth } from "../lib/firebase";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Sign in anonymously to allow Firestore reads
        signInAnonymously(auth).catch((error) => {
            console.error("Anonymous auth failed", error);
        });
    }, []);

    return <>{children}</>;
}
