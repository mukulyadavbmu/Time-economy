// script.js
import { db, auth } from "./firebase-config.js";
import {
  ref,
  set,
  get,
  update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Expose functions to window for onclicks
window.login = login;
window.register = register;
window.logout = logout;
window.addActivity = addActivity;
window.removeActivity = removeActivity;
window.doActivity = doActivity;
window.takeLoan = takeLoan;
window.repayLoan = repayLoan;
window.weeklyInterest = weeklyInterest;

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "";
    document.getElementById("user_display").textContent = user.email.split("@")[0];
    await loadUserData();
  } else {
    currentUser = null;
    document.getElementById("auth").style.display = "";
    document.getElementById("app").style.display = "none";
  }
});

async function register() {
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;
  if (!email || !password) {
    alert("Enter email and password");
    return;
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Initialize user data in DB
    await set(ref(db, "users/" + uid), {
      tokens: 1,
      credit_score: 1,
      max_loan: 10,
      loan: 0,
      activities: [],
      history: []
    });

  } catch (error) {
    alert(error.message);
  }
}

async function login() {
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert(error.message);
  }
}

async function logout() {
  await signOut(auth);
}

async function loadUserData() {
  if (!currentUser) return;

  const userDataRef = ref(db, "users/" + currentUser.uid);
  const snapshot = await get(userDataRef);

  if (snapshot.exists()) {
    window.userData = snapshot.val();
    render();
  } else {
    alert("User data not found.");
  }
}

async function saveUserData() {
  if (!currentUser) return;

  await update(ref(db, "users/" + currentUser.uid), window.userData);
  render();
}

function render() {
  const user = window.userData;
  if (!user) return;

  document.getElementById("tokens").textContent = user.tokens;
  document.getElementById("credit_score").textContent = user.credit_score;
  document.getElementById("loan").textContent = user.loan;

  const activitiesList = document.getElementById("activities");
  activitiesList.innerHTML = "";
  user.activities.forEach((act, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${act.name}</strong> 
      <button onclick="doActivity(${i})">${act.tokens > 0 ? '+' : ''}${act.tokens}</button> 
      <button onclick="removeActivity(${i})">Remove</button>`;
    activitiesList.appendChild(li);
  });

  const historyList = document.getElementById("history");
  historyList.innerHTML = "";
  user.history.slice(-20).reverse().forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    historyList.appendChild(li);
  });
}

function addActivity() {
  const name = document.getElementById("activity_name").value.trim();
  const tokens = parseInt(document.getElementById("activity_tokens").value, 10);
  if (!name || isNaN(tokens)) {
    alert("Enter activity and token");
    return;
  }
  window.userData.activities.push({ name, tokens });
  saveUserData();
}

function removeActivity(idx) {
  window.userData.activities.splice(idx, 1);
  saveUserData();
}

function doActivity(idx) {
  const act = window.userData.activities[idx];
  let prevTokens = window.userData.tokens;
  window.userData.tokens += act.tokens;

  if (window.userData.tokens < 0) {
    if (window.userData.tokens < -window.userData.max_loan) {
      window.userData.tokens = -window.userData.max_loan;
    }
  }
  window.userData.history.push(
    `${new Date().toLocaleString()}: Activity "${act.name}" (${act.tokens > 0 ? "+" : ""}${act.tokens}) | Tokens: ${prevTokens} -> ${window.userData.tokens}`
  );
  saveUserData();
}

function takeLoan() {
  if (window.userData.loan >= window.userData.max_loan) {
    alert("Reached max loan!");
    return;
  }
  window.userData.loan++;
  window.userData.tokens++;
  window.userData.history.push(
    `${new Date().toLocaleString()}: Loan taken (+1). Loan: ${window.userData.loan}`
  );
  saveUserData();
}

function repayLoan() {
  if (window.userData.loan === 0 || window.userData.tokens <= 0) {
    alert("No loan/insufficient tokens");
    return;
  }
  window.userData.loan--;
  window.userData.tokens--;
  window.userData.history.push(
    `${new Date().toLocaleString()}: Loan repaid (-1). Loan: ${window.userData.loan}`
  );
  if (window.userData.loan === 0) window.userData.credit_score++;
  saveUserData();
}

function weeklyInterest() {
  if (window.userData.loan > 0) {
    let interest = Math.ceil(window.userData.loan * 0.5);
    window.userData.loan += interest;
    window.userData.history.push(
      `${new Date().toLocaleString()}: Weekly interest applied (+${interest}). Loan: ${window.userData.loan}`
    );
    window.userData.credit_score = Math.max(1, window.userData.credit_score - 1);
    saveUserData();
  } else {
    alert("No outstanding loan");
  }
}