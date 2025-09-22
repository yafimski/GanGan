import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Default state (all items start in "to-garden")
const DEFAULT_ITEMS = [
  "onesie-long",
  "milk-frozen",
  "onesie-short",
  "pants-long",
  "pants-short",
  "apron",
  "bedsheet",
  "blanket",
  "wipes",
  "diapers",
  "pacifier",
  "socks",
  "food-box",
  "diaper-cream",
  "coat",
  "hat"
];

let itemsState = {
  "to-garden": DEFAULT_ITEMS.map((id) => ({ id, qty: 1 })),
  "to-home": []
};
let notesState = [];

// === Routes ===
app.get("/api/items", (req, res) => {
  res.json(itemsState);
});

app.post("/api/items", (req, res) => {
  itemsState = req.body;
  res.json({ ok: true });
});

app.get("/api/notes", (req, res) => {
  res.json(notesState);
});

app.post("/api/notes", (req, res) => {
  notesState = req.body;
  res.json({ ok: true });
});

// === Start server ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
