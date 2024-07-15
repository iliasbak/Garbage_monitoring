// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBqUXSIpfih7kO7GxNepa8HMQxheFTucVo",
    authDomain: "garbagecollector-66a17.firebaseapp.com",
    projectId: "garbagecollector-66a17",
    storageBucket: "garbagecollector-66a17.appspot.com",
    messagingSenderId: "139227519455",
    appId: "1:139227519455:web:2f803557a975e0004a4c6a"
  };

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIREBASE_DB = getFirestore(FIREBASE_APP);