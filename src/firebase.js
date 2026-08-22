import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAerY1jBobrWlqAcMWbq_kLk0yll4rTH8E",
  authDomain: "hotel-reservation-5d30d.firebaseapp.com",
  projectId: "hotel-reservation-5d30d",
  storageBucket: "hotel-reservation-5d30d.firebasestorage.app",
  messagingSenderId: "849266155537",
  appId: "1:849266155537:web:ea4e1b141ce723b444d1b0",
  measurementId: "G-7D5FW14GDK"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export { app, db, analytics };