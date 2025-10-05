
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCBC3535BkCE50FniCAQ8yHiEVDZVbGfOY",
  authDomain: "zoe-ab4cb.firebaseapp.com",
  projectId: "zoe-ab4cb",
  storageBucket: "zoe-ab4cb.firebasestorage.app",
  messagingSenderId: "1020997980583",
  appId: "1:1020997980583:web:19319707bc4950e1696682",
  measurementId: "G-PXKLDYTRTC"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const googleProvider = new GoogleAuthProvider();