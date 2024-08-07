import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth'; 

const firebaseConfig = {
  apiKey: "AIzaSyBD6nMjGMA_ysA2hyzPsmhyyt1snUgOkUU",
  authDomain: "trailbillingsoftware.firebaseapp.com",
  projectId: "trailbillingsoftware",
  storageBucket: "trailbillingsoftware.appspot.com",
  messagingSenderId: "608199826183",
  appId: "1:608199826183:web:766875a3bf93a0bdf803a2"                                                                                                
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app); 
const storage = getStorage(app); 
const auth = getAuth(app); 

export { db, storage, auth }; 
