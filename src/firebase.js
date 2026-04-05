import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyDy_v3Z7Skq_OSA87F4UMsgfEgCv8oQDoE",
  authDomain: "appcrisi.firebaseapp.com",
  databaseURL: "https://appcrisi-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "appcrisi",
  storageBucket: "appcrisi.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)