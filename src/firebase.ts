// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDmpkqSPGFxBlaWOuHg5J4q1zrvPZaxTzo',
  authDomain: 'senda-quest-490422.firebaseapp.com',
  projectId: 'senda-quest-490422',
  storageBucket: 'senda-quest-490422.firebasestorage.app',
  messagingSenderId: '955233598736',
  appId: '1:955233598736:web:1651f6ed9623d6012c7995',
  measurementId: 'G-YT67N2W7WW',
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
