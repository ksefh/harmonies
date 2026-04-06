// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAEqJSc6hicZFTg1E6z8Hhm6zfKjzt-pns",
  authDomain: "harmonies-5bb38.firebaseapp.com",
  databaseURL: "https://harmonies-5bb38-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "harmonies-5bb38",
  storageBucket: "harmonies-5bb38.firebasestorage.app",
  messagingSenderId: "613302848430",
  appId: "1:613302848430:web:57dbe3f3f71f873e65563f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);