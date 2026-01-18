// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, type UserCredential } from "firebase/auth";// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDZZtVCZ1F-8HccZVubvJ69AtRYXnw5Oak",
  authDomain: "musica-530c4.firebaseapp.com",
  projectId: "musica-530c4",
  storageBucket: "musica-530c4.firebasestorage.app",
  messagingSenderId: "613651965562",
  appId: "1:613651965562:web:a8e1ea6d963f9ac3083dc3",
  measurementId: "G-GWPR8X4QMJ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
