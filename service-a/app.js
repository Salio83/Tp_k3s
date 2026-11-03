const express = require("express");

const app = express();

// Address of the next service, always provided by the environment.
const NEXT_URL = process.env.NEXT_URL;
if (!NEXT_URL) throw new Error("NEXT_URL is not set");

app.get("/", async (req, res) => {
  try {
    const r = await fetch(`${NEXT_URL}/`, { signal: AbortSignal.timeout(5000) });
    res.json([{ name: "Service a" }, ...(await r.json())]);
  } catch {
    res.status(502).json({ error: "service suivant indisponible" });
  }
});

app.listen(8082, "0.0.0.0", () => console.log("Service a sur http://localhost:8082"));
