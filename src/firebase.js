import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyDy_v3Z7Skq_OSA87F4UMsgfEgCv8oQDoE",
  authDomain: "appcrisi.firebaseapp.com",
  databaseURL: "https://appcrisi-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "appcrisi",
  storageBucket: "appcrisi.firebasestorage.app",
  messagingSenderId: "474165776971",
  appId: "1:474165776971:web:f7a1eb7867ad0b970eb3ce"
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)