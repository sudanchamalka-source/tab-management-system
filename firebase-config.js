// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB9ePI2tVEqwS_Vm0buE7fbGdxAXV7adM4",
  authDomain: "tab-management-system.firebaseapp.com",
  projectId: "tab-management-system",
  storageBucket: "tab-management-system.firebasestorage.app",
  messagingSenderId: "218928494113",
  appId: "1:218928494113:web:c25d0a247b410e7f7f1560",
  measurementId: "G-Z6DSP00NZK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
