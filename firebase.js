import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBPZ3zZ01x3mKPoeqp7JzFEGU4mruab6bw",
  authDomain: "escape-2026.firebaseapp.com",
  projectId: "escape-2026",
  storageBucket: "escape-2026.firebasestorage.app",
  messagingSenderId: "723561499781",
  appId: "1:723561499781:web:7e7041d13059f232c22dec",
  measurementId: "G-MS4Y3EJD9F"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
