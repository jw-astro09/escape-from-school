import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { auth, db } from "./firebase.js";

const form = document.querySelector("#question-form");
const loginNotice = document.querySelector("#login-notice");
const list = document.querySelector("#question-list");
let user = null;
let isAdmin = false;
let latestSnapshot = null;
let authReady = false;

loginNotice.addEventListener("click", () => {
  document.querySelector(".account-button")?.click();
});

function escapeText(value) {
  const span = document.createElement("span");
  span.textContent = value || "";
  return span.innerHTML;
}

function renderQuestion(id, data) {
  const date = data.createdAt?.toDate?.().toLocaleDateString("ko-KR") || "방금 전";
  const answer = data.answer
    ? `<div class="answer"><span>ADMIN ANSWER</span><p>${escapeText(data.answer).replaceAll("\n", "<br>")}</p></div>`
    : `<p class="waiting">답변을 기다리고 있습니다.</p>`;
  const adminForm = isAdmin
    ? `<form class="answer-form" data-id="${id}"><textarea maxlength="1600" placeholder="관리자 답변을 입력하세요.">${escapeText(data.answer || "")}</textarea><button class="button" type="submit">답변 저장</button></form>`
    : "";
  return `<article class="question-card"><div class="question-meta"><span>QUESTION</span><time>${date}</time></div><h2>${escapeText(data.title)}</h2><p class="question-body">${escapeText(data.body).replaceAll("\n", "<br>")}</p><p class="question-author">${escapeText(data.authorName || "익명")}</p>${answer}${adminForm}</article>`;
}

function renderQuestions(snapshot) {
  latestSnapshot = snapshot;
  if (snapshot.empty) {
    list.innerHTML = '<p class="empty-state">아직 등록된 질문이 없습니다. 첫 질문을 남겨 주세요.</p>';
    return;
  }
  list.innerHTML = snapshot.docs.map((item) => renderQuestion(item.id, item.data())).join("");
}

onSnapshot(query(collection(db, "questions"), orderBy("createdAt", "desc")), renderQuestions, () => {
  list.innerHTML = '<p class="empty-state">질문을 불러오지 못했습니다. Firebase 설정을 확인해 주세요.</p>';
});

async function refreshUser(nextUser) {
  authReady = true;
  user = nextUser;
  isAdmin = false;
  if (user) {
    try {
      isAdmin = (await getDoc(doc(db, "admins", user.uid))).exists();
    } catch {
      isAdmin = false;
    }
  }
  form.hidden = !user;
  loginNotice.hidden = Boolean(user);
  form.querySelector("button[type='submit']").disabled = !user;
  if (user) document.querySelector("#question-author").textContent = user.displayName || user.email;
  if (latestSnapshot) renderQuestions(latestSnapshot);
}

onAuthStateChanged(auth, refreshUser);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const currentUser = auth.currentUser;
  if (!authReady || !currentUser || !user || currentUser.uid !== user.uid) {
    alert("질문을 등록하려면 먼저 로그인하세요.");
    form.hidden = true;
    loginNotice.hidden = false;
    return;
  }

  const values = new FormData(form);
  const title = values.get("title").trim();
  const body = values.get("body").trim();
  if (!title || !body) return;

  const submit = form.querySelector("button");
  submit.disabled = true;
  try {
    await currentUser.getIdToken();
    await addDoc(collection(db, "questions"), {
      title,
      body,
      authorId: currentUser.uid,
      authorName: currentUser.displayName || currentUser.email,
      createdAt: serverTimestamp()
    });
    form.reset();
  } catch (error) {
    if (error.code === "permission-denied") {
      alert("로그인한 계정만 질문을 등록할 수 있습니다. 다시 로그인해 주세요.");
    } else {
      alert("질문을 등록하지 못했습니다. 잠시 후 다시 시도하세요.");
    }
  } finally {
    submit.disabled = false;
  }
});

list.addEventListener("submit", async (event) => {
  if (!event.target.matches(".answer-form") || !isAdmin) return;
  event.preventDefault();
  const formElement = event.target;
  const submit = formElement.querySelector("button");
  submit.disabled = true;
  try {
    await updateDoc(doc(db, "questions", formElement.dataset.id), {
      answer: formElement.querySelector("textarea").value.trim(),
      answeredAt: serverTimestamp(),
      answeredBy: user.uid
    });
  } catch {
    alert("답변을 저장하지 못했습니다. 관리자 설정을 확인해 주세요.");
  } finally {
    submit.disabled = false;
  }
});
