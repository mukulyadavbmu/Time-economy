// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAmX2UgNxcZOGZ-k2A1gFCHeGycGzbdUAk",
  authDomain: "time-economy-fec38.firebaseapp.com",
  databaseURL: "https://time-economy-fec38-default-rtdb.firebaseio.com",
  projectId: "time-economy-fec38",
  storageBucket: "time-economy-fec38.appspot.com",
  messagingSenderId: "215783320976",
  appId: "1:215783320976:web:d38e9162cb8cc324311715",
  measurementId: "G-EBLNF1Z5KE"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { app, db, auth };