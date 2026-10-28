const express = require("express");
const crypto = require("crypto");
const { promisify } = require("util");
const User = require("../models/User");

const router = express.Router();
const scrypt = promisify(crypto.scrypt);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function tokenFor(user) {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_TOKEN_SECRET must be set to a random value of at least 32 characters.");
  }
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: String(user._id),
    role: user.role,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8
  })).toString("base64url");
  const unsigned = `${header}.${payload}`;
  const signature = crypto.createHmac("sha256", secret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
}

async function passwordMatches(password, storedHash) {
  const [salt, expectedHex] = String(storedHash || "").split(":");
  if (!salt || !expectedHex) return false;
  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role
  };
}


function requireAdministrator(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const parts = token.split(".");
    const secret = process.env.AUTH_TOKEN_SECRET;
    if (!secret || secret.length < 32 || parts.length !== 3) {
      return res.status(401).json({ message: "Please sign in again." });
    }

    const unsigned = `${parts[0]}.${parts[1]}`;
    const expected = crypto.createHmac("sha256", secret).update(unsigned).digest();
    const supplied = Buffer.from(parts[2], "base64url");
    if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
      return res.status(401).json({ message: "Invalid session token." });
    }

    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (!payload.sub || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ message: "Your session has expired. Please sign in again." });
    }
    req.authUserId = payload.sub;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid session token." });
  }
}

router.get("/users", requireAdministrator, async (req, res) => {
  try {
    // Verify the current role from MongoDB, rather than trusting the role in a browser token.
    const requester = await User.findById(req.authUserId).select("role").lean();
    if (!requester || requester.role !== "Administrator") {
      return res.status(403).json({ message: "Administrator access required." });
    }
    const users = await User.find({})
      .select("name email role createdAt")
      .sort({ createdAt: -1 })
      .lean();
    return res.json(users.map((user) => ({
      id: String(user._id),
      name: user.name || "",
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    })));
  } catch (error) {
    console.error("List users error:", error.message);
    return res.status(500).json({ message: "Could not load registered users." });
  }
});

router.post("/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name) return res.status(400).json({ message: "Enter your full name." });
    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }
    if (password.length > 128) {
      return res.status(400).json({ message: "Password must be 128 characters or fewer." });
    }

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return res.status(409).json({ message: "An account with that email already exists. Sign in instead." });
    }

    // Public registration can only create regular users. Roles are never accepted from the client.
    const user = await User.create({
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "User"
    });

    return res.status(201).json({
      message: "Account created successfully.",
      user: publicUser(user),
      token: tokenFor(user)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account with that email already exists." });
    }
    console.error("Registration error:", error.message);
    return res.status(500).json({ message: error.message.includes("AUTH_TOKEN_SECRET") ? error.message : "Could not create account." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!EMAIL_PATTERN.test(email) || !password) {
      return res.status(400).json({ message: "Enter a valid email address and password." });
    }

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await passwordMatches(password, user.passwordHash))) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    return res.json({
      message: "Signed in successfully.",
      user: publicUser(user),
      token: tokenFor(user)
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: error.message.includes("AUTH_TOKEN_SECRET") ? error.message : "Could not sign in." });
  }
});

module.exports = router;
