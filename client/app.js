const API_BASE =
  location.hostname === "localhost" ? "http://localhost:5000/api" : "https://gan-organizer-server.onrender.com/api";

// Hebrew items list with emoji icons
const ITEMS = [
  { id: "milk-frozen", icon: "❄️🍼", label: "חלב אם קפוא" },
  { id: "onesie-long", icon: "👕", label: "אוברול ארוך" },
  { id: "onesie-short", icon: "👕", label: "אוברול קצר" },
  { id: "pants-long", icon: "👖", label: "מכנסיים ארוכים" },
  { id: "pants-short", icon: "🩳", label: "מכנסיים קצרים" },
  { id: "apron", icon: "🧑‍🍳", label: "סינר" },
  { id: "bedsheet", icon: "🛏️", label: "סדין" },
  { id: "blanket", icon: "🧣", label: "שמיכה" },
  { id: "wipes", icon: "🧻", label: "מגבונים" },
  { id: "diapers", icon: "🧷", label: "חיתולים" },
  { id: "pacifier", icon: "🧸", label: "מוצץ" },
  { id: "socks", icon: "🧦", label: "גרביים" },
  { id: "food-box", icon: "🥡", label: "קופסת אוכל לתינוק" },
  { id: "diaper-cream", icon: "🧴", label: "קרם חיתולים" }
];

// --- State ---
let state = { "to-garden": [], "to-home": [] };
let notes = [];

// --- API helpers ---
async function loadItems() {
  const res = await fetch(`${API_BASE}/items`);
  const data = await res.json();
  if (!data["to-garden"] || !data["to-home"] || data["to-garden"].length === 0) {
    return { "to-garden": ITEMS.map(({ id }) => ({ id, qty: 1 })), "to-home": [] };
  }
  return data;
}

async function saveItems() {
  await fetch(`${API_BASE}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state)
  });
}

async function loadNotes() {
  const res = await fetch(`${API_BASE}/notes`);
  return await res.json();
}
async function saveNotes() {
  await fetch(`${API_BASE}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(notes)
  });
}

// --- DOM helpers ---
const $ = (sel) => document.querySelector(sel);

const toGarden = $("#to-garden");
const toHome = $("#to-home");
const notesBtn = $("#notesBtn");
const modal = $("#notesModal");
const notesList = $("#notesList");
const noteInput = $("#noteInput");
const addNoteBtn = $("#addNoteBtn");
const tpl = $("#itemTemplate");

function getItemMeta(id) {
  return ITEMS.find((i) => i.id === id);
}

function render() {
  toGarden.innerHTML = "";
  toHome.innerHTML = "";

  for (const side of ["to-garden", "to-home"]) {
    const container = side === "to-garden" ? toGarden : toHome;
    for (const { id, qty } of state[side]) {
      const node = tpl.content.firstElementChild.cloneNode(true);
      const meta = getItemMeta(id);
      node.dataset.id = id;
      node.querySelector(".icon").textContent = meta.icon;
      node.querySelector(".label").textContent = meta.label;
      node.querySelector(".qty").textContent = `x${qty}`;

      node.querySelector(".qty").onclick = () => cycleQty(id);
      node.querySelector(".swap").onclick = () => moveItem(id);

      container.appendChild(node);
    }
  }
  saveItems();
}

function moveItem(id) {
  const from = state["to-garden"].some((x) => x.id === id) ? "to-garden" : "to-home";
  const to = from === "to-garden" ? "to-home" : "to-garden";
  const idx = state[from].findIndex((x) => x.id === id);
  if (idx === -1) return;
  const [item] = state[from].splice(idx, 1);
  state[to].unshift(item);
  render();
}

function cycleQty(id) {
  const side = state["to-garden"].some((x) => x.id === id) ? "to-garden" : "to-home";
  const item = state[side].find((x) => x.id === id);
  item.qty = item.qty >= 4 ? 1 : item.qty + 1;
  render();
}

// --- Notes ---
notesBtn.addEventListener("click", () => {
  modal.showModal();
  modal.style.height = window.innerHeight + "px";
});

modal.querySelector(".close").addEventListener("click", () => modal.close());
addNoteBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const text = noteInput.value.trim();
  if (!text) return;
  notes.unshift({ id: crypto.randomUUID(), text });
  noteInput.value = "";
  renderNotes();
  saveNotes();
});

function renderNotes() {
  notesList.innerHTML = "";
  for (const n of notes) {
    const row = document.createElement("div");
    row.className = "ticket clay";
    const input = document.createElement("input");
    input.value = n.text;
    input.addEventListener("input", () => {
      n.text = input.value;
      saveNotes();
    });
    const del = document.createElement("button");
    del.className = "btn del";
    del.textContent = "מחק";
    del.addEventListener("click", () => {
      notes = notes.filter((x) => x.id !== n.id);
      renderNotes();
      saveNotes();
    });
    row.append(input, del);
    notesList.appendChild(row);
  }
}

// --- Boot ---
(async function init() {
  state = await loadItems();
  notes = await loadNotes();
  render();
  renderNotes();
})();
