const crypto = require("crypto");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";

    const parts = token.split(".");
    const secret = process.env.AUTH_TOKEN_SECRET;

    if (!secret || secret.length < 32 || parts.length !== 3) {
      return res.status(401).json({ message: "Please sign in." });
    }

    const unsigned = `${parts[0]}.${parts[1]}`;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(unsigned)
      .digest();

    const supplied = Buffer.from(parts[2], "base64url");

    if (
      expected.length !== supplied.length ||
      !crypto.timingSafeEqual(expected, supplied)
    ) {
      return res.status(401).json({ message: "Invalid session." });
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8")
    );

    if (
      !payload.sub ||
      !payload.exp ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return res.status(401).json({ message: "Session expired." });
    }

    const user = await User.findById(payload.sub).select("_id role email");

    if (!user) {
      return res.status(401).json({ message: "Account not found." });
    }

    req.authUser = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid session." });
  }
}

module.exports = requireAuth;