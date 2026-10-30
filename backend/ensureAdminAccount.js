const crypto = require("crypto");
const { promisify } = require("util");
const User = require("./models/User");
const scrypt = promisify(crypto.scrypt);

async function ensureAdminAccount() {
  const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || "");

  // Admin creation is opt-in via backend/.env; never expose a public admin registration form.
  if (!email && !password) return;
  if (!email || !password) {
    throw new Error("Set both ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env, or remove both.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("ADMIN_EMAIL must be a valid email address.");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters long.");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== "Administrator") {
      existing.role = "Administrator";
      await existing.save();
    }
    return;
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  await User.create({
    name: "Administrator",
    email,
    passwordHash: `${salt}:${derived.toString("hex")}`,
    role: "Administrator"
  });
  console.log(`Initial administrator account created for ${email}`);
}

module.exports = ensureAdminAccount;
