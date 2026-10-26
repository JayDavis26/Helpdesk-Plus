const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const connectDB = require("./db");
const ticketRoutes = require("./routes/ticketRoutes");
const authRoutes = require("./routes/authRoutes");
const ensureAdminAccount = require("./ensureAdminAccount");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Helpdesk+ backend is running!" });
});

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from backend/.env");
    }
    if (!process.env.AUTH_TOKEN_SECRET || process.env.AUTH_TOKEN_SECRET.length < 32) {
      throw new Error("AUTH_TOKEN_SECRET must be set in backend/.env to a random value of at least 32 characters.");
    }
    await connectDB();
    await ensureAdminAccount();
    app.listen(PORT, () => {
      console.log(`Helpdesk+ backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
