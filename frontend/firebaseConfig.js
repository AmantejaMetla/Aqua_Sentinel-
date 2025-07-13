// Firebase configuration for AquaSentinel
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyAS_jiKziqD0RFNFpgqrkU1p5jk3z1tVos",
  authDomain: "aquasentinel-8b5e9.firebaseapp.com",
  projectId: "aquasentinel-8b5e9",
  storageBucket: "aquasentinel-8b5e9.appspot.com",
  messagingSenderId: "1101645452924",
  appId: "1:1101645452924:web:a0b6f02adca27bb30262b9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firestore Database and get a reference to the service
export const db = getFirestore(app);

export default app; 