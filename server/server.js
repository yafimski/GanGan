import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI; // put in Render env vars
const client = new MongoClient(uri);

let db, itemsCol, notesCol;

// Default items for first-time setup
const DEFAULT_ITEMS = [
  "milk-frozen",
  "onesie-long",
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
  "water-bottle",
  "coat",
  "hat"
];

async function initDB() {
  await client.connect();
  db = client.db("BabyOrganizer");
  itemsCol = db.collection("items");
  notesCol = db.collection("notes");

  // Seed items if empty
  const count = await itemsCol.countDocuments();
  if (count === 0) {
    const docs = DEFAULT_ITEMS.map((id) => ({
      id,
      qty: 1,
      status: "none" // default state
    }));
    await itemsCol.insertMany(docs);
  }
}

// === Items ===
app.get("/api/items", async (req, res) => {
  const docs = await itemsCol.find().toArray();
  res.json(docs); // flat array
});

app.post("/api/items", async (req, res) => {
  const { id, qty, status } = req.body;
  if (!id) return res.status(400).json({ error: "Missing id" });

  await itemsCol.updateOne({ id }, { $set: { qty, status: status || "none" } }, { upsert: true });
  res.json({ ok: true });
});

// === Notes ===
app.get("/api/notes", async (req, res) => {
  const docs = await notesCol.find().toArray();
  res.json(docs);
});

app.post("/api/notes", async (req, res) => {
  const note = req.body; // { id, text }
  await notesCol.insertOne(note);
  res.json(note);
});

app.put("/api/notes/:id", async (req, res) => {
  const { id } = req.params;
  const note = req.body;
  await notesCol.updateOne({ id }, { $set: note });
  res.json({ ok: true });
});

app.delete("/api/notes/:id", async (req, res) => {
  const { id } = req.params;
  await notesCol.deleteOne({ id });
  res.json({ ok: true });
});

// === Start ===
const PORT = process.env.PORT || 5000;
initDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
});
