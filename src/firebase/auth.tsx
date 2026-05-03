import React from 'react';
import { auth, googleProvider } from './firebase-config'; // Adjust path as needed
import { getAuth, GoogleAuthProvider, signInWithPopup, type UserCredential } from "firebase/auth";

const AuthButton: React.FC = () => {
  const handleGoogleSignIn = async () => {
    try {
      const result: UserCredential = await signInWithPopup(auth, googleProvider);
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      // The signed-in user info.
      const user = result.user;

      console.log("Signed in user:", user);
      console.log("Google Access Token:", token);
      // You can now redirect the user or update UI
    } catch (error: any) {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);

      console.error("Error during Google Sign-In:", errorMessage, errorCode, email, credential);
    }
  };

  return (
    <button onClick={handleGoogleSignIn}>
      Sign in with Google
    </button>
  );
};

export default AuthButton;