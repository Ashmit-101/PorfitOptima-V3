import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBRm155ffTeajQE5S44W4eaI5RsO_1AsGw",
  authDomain: "profitoptima-2192b.firebaseapp.com",
  projectId: "profitoptima-2192b",
  storageBucket: "profitoptima-2192b.firebasestorage.app",
  messagingSenderId: "274375916353",
  appId: "1:274375916353:web:b27d829045c6fa47c8ffc0"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export default app;