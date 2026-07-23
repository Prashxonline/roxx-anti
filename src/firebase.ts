import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, onValue, push, set, update, remove, query, orderByChild, equalTo, limitToLast, off } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyBN-D0qqhjaP8lmSY_h1nCQibyozdHV4MQ",
  authDomain: "roxx-anti.firebaseapp.com",
  databaseURL: "https://roxx-anti-default-rtdb.firebaseio.com",
  projectId: "roxx-anti",
  storageBucket: "roxx-anti.firebasestorage.app",
  messagingSenderId: "956928220380",
  appId: "1:956928220380:android:f24387acafe104c6ad2819"
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

export { db, ref, get, onValue, push, set, update, remove, query, orderByChild, equalTo, limitToLast, off }
