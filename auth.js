import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";

const loginButton = document.createElement("button");
loginButton.className = "account-button";
loginButton.type = "button";
loginButton.textContent = "로그인";

const links = document.querySelector(".links");
if (links) {
  const qaLink = document.createElement("a");
  qaLink.href = "qa.html";
  qaLink.textContent = "Q&A";
  if (location.pathname.endsWith("qa.html")) qaLink.classList.add("active");
  const githubLink = links.querySelector(".nav-github");
  links.insertBefore(qaLink, githubLink || null);
  links.insertBefore(loginButton, githubLink || null);
}

const dialog = document.createElement("dialog");
dialog.className = "auth-dialog";
dialog.innerHTML = `
  <button class="dialog-close" type="button" aria-label="닫기">×</button>
  <div class="eyebrow">MEMBER ACCESS</div>
  <h2>질문을 남기려면<br>로그인하세요.</h2>
  <p class="auth-copy">이메일 계정을 만들거나 Google 계정으로 로그인할 수 있습니다.</p>
  <button class="google-login" type="button">Google로 계속하기</button>
  <div class="auth-divider"><span>또는 이메일</span></div>
  <form class="email-login">
    <label>이메일<input name="email" type="email" autocomplete="email" required></label>
    <label>비밀번호<input name="password" type="password" autocomplete="current-password" minlength="6" required></label>
    <p class="auth-error" aria-live="polite"></p>
    <button class="button" type="submit">이메일로 로그인</button>
    <button class="text-button" type="button" data-action="signup">처음이라면 계정 만들기</button>
  </form>`;
document.body.append(dialog);

const closeDialog = () => dialog.close();
dialog.querySelector(".dialog-close").addEventListener("click", closeDialog);
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeDialog();
});

function showError(message) {
  dialog.querySelector(".auth-error").textContent = message;
}

function authMessage(error) {
  if (error.code === "auth/invalid-credential") return "이메일 또는 비밀번호를 확인하세요.";
  if (error.code === "auth/email-already-in-use") return "이미 사용 중인 이메일입니다. 로그인해 주세요.";
  if (error.code === "auth/weak-password") return "비밀번호는 6자 이상이어야 합니다.";
  if (error.code === "auth/popup-closed-by-user") return "Google 로그인 창이 닫혔습니다.";
  return "로그인 중 문제가 발생했습니다. 잠시 후 다시 시도하세요.";
}

loginButton.addEventListener("click", async () => {
  if (auth.currentUser) {
    await signOut(auth);
    return;
  }
  showError("");
  dialog.showModal();
});

dialog.querySelector(".google-login").addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
    closeDialog();
  } catch (error) {
    showError(authMessage(error));
  }
});

dialog.querySelector(".email-login").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    await signInWithEmailAndPassword(auth, form.get("email"), form.get("password"));
    closeDialog();
  } catch (error) {
    showError(authMessage(error));
  }
});

dialog.querySelector("[data-action='signup']").addEventListener("click", async () => {
  const form = new FormData(dialog.querySelector(".email-login"));
  const email = form.get("email");
  const password = form.get("password");
  if (!email || !password) {
    showError("이메일과 6자 이상의 비밀번호를 입력하세요.");
    return;
  }
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: email.split("@")[0] });
    closeDialog();
  } catch (error) {
    showError(authMessage(error));
  }
});

onAuthStateChanged(auth, async (user) => {
  let isAdmin = false;
  if (user) {
    try {
      isAdmin = (await getDoc(doc(db, "admins", user.uid))).exists();
    } catch {
      isAdmin = false;
    }
  }
  loginButton.textContent = user ? `${user.displayName || user.email} · 로그아웃` : "로그인";
  document.body.classList.toggle("signed-in", Boolean(user));
  window.dispatchEvent(new CustomEvent("escape-auth-change", { detail: { user, isAdmin } }));
});
