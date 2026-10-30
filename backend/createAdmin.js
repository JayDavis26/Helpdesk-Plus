const dotenv = require("dotenv");
const mongoose = require("mongoose");
const crypto = require("crypto");
const { promisify } = require("util");
const User = require("./models/User");

dotenv.config();

const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
}

async function createStaffAccount() {
  try {
    const role = String(process.argv[2] || "").trim();
    const email = String(process.argv[3] || "").trim().toLowerCase();
    const name = String(process.argv[4] || "").trim();
    const password = process.env.ADMIN_SETUP_PASSWORD;

    if (!["Administrator", "Support Agent"].includes(role)) {
      throw new Error(
        'Role must be "Administrator" or "Support Agent".'
      );
    }

    if (!email || !name || !password) {
      throw new Error(
        'Usage: ADMIN_SETUP_PASSWORD="YourStrongPassword" node createAdmin.js "Administrator" "admin@example.com" "Admin Name"'
      );
    }

    if (password.length < 12) {
      throw new Error("Password must be at least 12 characters long.");
    }

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from your backend .env file.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const existing = await User.findOne({ email });

    if (existing) {
      throw new Error(
        "An account with this email already exists. No account was changed."
      );
    }

    const user = await User.create({
      name,
      email,
      passwordHash: await hashPassword(password),
      role
    });

    console.log(`${role} account created successfully for ${user.email}`);
  } catch (error) {
    console.error("Setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

createStaffAccount();