import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDFEhgMr0R_PCRdfzADlR69ehpLKDhdG-U",
    authDomain: "baseballapp-v2.firebaseapp.com",
    projectId: "baseballapp-v2",
    storageBucket: "baseballapp-v2.firebasestorage.app",
    messagingSenderId: "128709869165",
    appId: "1:128709869165:web:b249865ccb07c404988964",
    measurementId: "G-4GCKM2L55W"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { auth, db };

