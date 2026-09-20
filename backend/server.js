const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./db");

dotenv.config();
connectDB();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Helpdesk+ backend is running!"
  });
});

app.listen(PORT, () => {
  console.log(`Helpdesk+ backend running on http://localhost:${PORT}`);
});