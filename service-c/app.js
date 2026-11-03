const express = require("express");
const fs = require("fs");

const app = express();

// The counter lives in a file so it can be kept in a Docker volume.
const COUNTER_FILE = process.env.COUNTER_FILE || "./counter.txt";

const readCounter = () => {
  try {
    return parseInt(fs.readFileSync(COUNTER_FILE, "utf8"), 10) || 0;
  } catch {
    return 0;
  }
};

app.get("/", (req, res) => {
  const count = readCounter() + 1;
  fs.writeFileSync(COUNTER_FILE, String(count));
  res.json([{ name: "Service c", count }]);
});

app.listen(8080, "0.0.0.0", () => console.log("Service c sur http://localhost:8080"));
