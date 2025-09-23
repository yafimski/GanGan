const API_BASE =
  location.hostname === "localhost" ? "http://localhost:5000/api" : "https://gan-organizer-server.onrender.com/api";

// Hebrew items list with emoji icons
const ITEMS = [
  { id: "milk-frozen", icon: "❄️", label: "חלב אם קפוא" },
  { id: "onesie-long", icon: "👕", label: "ג'דיי ארוך" },
  { id: "onesie-short", icon: "👕", label: "ג'דיי קצר" },
  { id: "pants-long", icon: "👖", label: "מכנסיים ארוכים" },
  { id: "pants-short", icon: "🩳", label: "מכנסיים קצרים" },
  { id: "apron", icon: "🧑‍🍳", label: "סינר" },
  { id: "bedsheet", icon: "🛏️", label: "סדין" },
  { id: "blanket", icon: "🧣", label: "שמיכה" },
  { id: "wipes", icon: "🧻", label: "מגבונים" },
  { id: "diapers", icon: "🩲", label: "חיתולים" },
  { id: "pacifier", icon: "🪷", label: "מוצץ" },
  { id: "socks", icon: "🧦", label: "גרביים" },
  { id: "food-box", icon: "🫙", label: "מחלק תמל" },
  { id: "diaper-cream", icon: "🧴", label: "קרם חיתולים" },
  { id: "coat", icon: "🧥", label: "מעיל" },
  { id: "hat", icon: "🧢", label: "כובע" }
];

// --- State ---
let state = { "to-garden": [], "to-home": [] };
let notes = [];

// --- Items API ---
async function loadItems() {
  const res = await fetch(`${API_BASE}/items`);
  state = await res.json();
  render();
}

async function saveItem(id, qty, side) {
  await fetch(`${API_BASE}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, qty, side })
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
  await fetch(`${API_BASE}/notes/${id}`, { method: "DELETE" });
}

// --- DOM ---
const $ = (s) => document.querySelector(s);
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

      node.querySelector(".qty").onclick = async () => {
        const newQty = qty >= 4 ? 1 : qty + 1;
        await saveItem(id, newQty, side);
        await loadItems();
      };

      node.querySelector(".swap").onclick = async () => {
        const newSide = side === "to-garden" ? "to-home" : "to-garden";
        await saveItem(id, qty, newSide);
        await loadItems();
      };

      container.appendChild(node);
    }
  }
}

// --- Notes DOM ---
notesBtn.addEventListener("click", () => modal.showModal());
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
});

function renderNotes() {
  notesList.innerHTML = "";
  for (const n of notes) {
    const row = document.createElement("div");
    row.className = "ticket clay";

    const input = document.createElement("input");
    input.value = n.text;
    input.addEventListener("input", async () => {
      n.text = input.value;
      await updateNote(n);
    });

    const del = document.createElement("button");
    del.className = "btn del";
    del.textContent = "מחק";
    del.addEventListener("click", async () => {
      await deleteNote(n.id);
      notes = notes.filter((x) => x.id !== n.id);
      renderNotes();
    });

    row.append(input, del);
    notesList.appendChild(row);
  }
}

// --- Boot ---
(async function init() {
  await loadItems();
  await loadNotes();
})();
