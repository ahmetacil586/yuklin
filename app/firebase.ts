import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB7jKOf_Fvy6Wabx5q-PXqMXzVJo1xC_zc",
  authDomain: "yuklin-85889.firebaseapp.com",
  projectId: "yuklin-85889",
  storageBucket: "yuklin-85889.firebasestorage.app",
  messagingSenderId: "891065665145",
  appId: "1:891065665145:web:01af9100d319f5e675f6a8",
  measurementId: "G-TP3J0G953H",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;