const API_BASE = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? "http://localhost:5000/api"
  : "https://gan-organizer-server.onrender.com/api";
// const API_BASE =
//   location.hostname === "localhost" ? "http://localhost:3000/api" : "https://gan-organizer-server.onrender.com/api";

const ITEMS = [
  { id: "milk-frozen", icon: "❄️", label: "חלב אם קפוא", count: null },
  { id: "milk-bottle", icon: "🍼", label: "בקבוק לחלב", count: 1 },
  { id: "onesie-long", icon: "👕", label: "ג'דיי ארוך", count: null },
  { id: "onesie-short", icon: "👕", label: "ג'דיי קצר", count: null },
  { id: "pants-long", icon: "👖", label: "מכנסיים ארוכים", count: null },
  { id: "pants-short", icon: "🩳", label: "מכנסיים קצרים", count: null },
  { id: "apron", icon: "🧑‍🍳", label: "סינר", count: null },
  { id: "bedsheet", icon: "🛏️", label: "סדין", count: null },
  { id: "blanket", icon: "🧣", label: "שמיכה", count: null },
  { id: "wipes", icon: "🧻", label: "מגבונים", count: 1 },
  { id: "diapers", icon: "🩲", label: "חיתולים", count: 1 },
  { id: "pacifier", icon: "🪷", label: "מוצץ", count: null },
  { id: "socks", icon: "🧦", label: "גרביים", count: null },
  { id: "food-box", icon: "🫙", label: "מחלק תמל", count: 1 },
  { id: "diaper-cream", icon: "🧴", label: "קרם חיתולים", count: null },
  { id: "coat", icon: "🧥", label: "מעיל", count: null },
  { id: "hat", icon: "🧢", label: "כובע", count: null },
  { id: "water-bottle", icon: "🥤", label: "בקבוק מים", count: 1 }
];

// --- State ---
let state = [];
let notes = [];

// --- Items API ---
async function loadItems() {
  const res = await fetch(`${API_BASE}/items`);
  state = await res.json();
  render();
}

async function saveItem(id, qty, status) {
  await fetch(`${API_BASE}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, qty, status })
  });
}

// --- Notes API ---
async function loadNotes() {
  const res = await fetch(`${API_BASE}/notes`);
  notes = await res.json();
  renderNotes();
}

async function addNote(note) {
  await fetch(`${API_BASE}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note)
  });
}

async function updateNote(note) {
  await fetch(`${API_BASE}/notes/${note.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note)
  });
}

async function deleteNote(id) {
  await fetch(`${API_BASE}/notes/${id}`, {
    method: "DELETE"
  });
}

// --- DOM ---
const $ = (s) => document.querySelector(s);
const itemsContainer = $("#items");
const notesBtn = $("#notesBtn");
const modal = $("#notesModal");
const notesList = $("#notesList");
const notesEmpty = $("#notesEmpty");
const notesCount = $("#notesCount");
const noteInput = $("#noteInput");
const addNoteBtn = $("#addNoteBtn");
const tpl = $("#itemTemplate");

function getItemMeta(id) {
  return ITEMS.find((i) => i.id === id);
}

function render() {
  itemsContainer.innerHTML = "";

  for (const { id, qty, status } of state) {
    const node = tpl.content.firstElementChild.cloneNode(true);
    const meta = getItemMeta(id);
    node.dataset.id = id;
    node.dataset.status = status;

    node.querySelector(".icon").textContent = meta?.icon ?? "❓";
    node.querySelector(".label").textContent = meta?.label ?? id;

    const qtyBtn = node.querySelector(".qty");
    if (meta?.count == null) {
      qtyBtn.classList.add("hidden");
    } else {
      qtyBtn.textContent = `x${qty}`;
      qtyBtn.classList.remove("hidden");
    }

    // click to increment qty (wrap 1..4)
    qtyBtn.onclick = async () => {
      if (meta?.count == null) return;
      const newQty = qty >= 4 ? 1 : qty + 1;
      await saveItem(id, newQty, status);
      await loadItems();
    };

    // vertical status buttons
    const statusBtns = node.querySelectorAll(".status-column .st");
    statusBtns.forEach((btn) => {
      const s = btn.dataset.status;
      const isActive = s === status;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive);
      btn.disabled = isActive;
      btn.onclick = async () => {
        if (s === status) return;
        await saveItem(id, qty, s);
        await loadItems();
      };
    });
    itemsContainer.appendChild(node);
  }
}

// --- Notes DOM ---
notesBtn.addEventListener("click", () => {
  modal.showModal();
  setTimeout(() => noteInput?.focus(), 0);
});
modal.querySelector(".close").addEventListener("click", () => modal.close());

addNoteBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  const text = noteInput.value.trim();
  if (!text) return;
  const newNote = { id: crypto.randomUUID(), text };
  await addNote(newNote);
  notes.unshift(newNote);
  noteInput.value = "";
  renderNotes();
  const firstNote = notesList.querySelector(".note-text");
  if (firstNote) {
    firstNote.focus();
    firstNote.selectionStart = firstNote.value.length;
  }
});

noteInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addNoteBtn.click();
  }
});

function renderNotes() {
  notesList.innerHTML = "";

  if (notesCount) notesCount.textContent = notes.length;
  notesEmpty.hidden = notes.length !== 0;

  for (const n of notes) {
    const card = document.createElement("article");
    card.className = "note-card clay";

    const textArea = document.createElement("textarea");
    textArea.className = "note-text";
    textArea.value = n.text;
    textArea.placeholder = "רשמו כאן…";
    textArea.rows = 1;

    const autoResize = () => {
      textArea.style.height = "auto";
      textArea.style.height = `${textArea.scrollHeight}px`;
    };
    requestAnimationFrame(autoResize);

    let debounce;
    textArea.addEventListener("input", () => {
      n.text = textArea.value;
      autoResize();
      clearTimeout(debounce);
      debounce = setTimeout(() => updateNote(n), 400);
    });

    const actions = document.createElement("div");
    actions.className = "note-actions";

    const del = document.createElement("button");
    del.className = "btn icon danger";
    del.setAttribute("aria-label", "מחיקת פתק");
    del.textContent = "✖";
    del.addEventListener("click", async () => {
      notes = notes.filter((x) => x.id !== n.id);
      await deleteNote(n.id);
      renderNotes();
    });

    actions.appendChild(del);
    card.append(textArea, actions);
    notesList.appendChild(card);
  }
}

// --- Boot ---
(async function init() {
  await loadItems();
  await loadNotes();
})();
