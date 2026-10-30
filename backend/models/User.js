const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 100, default: "" },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      index: true
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["User", "Support Agent", "Administrator"],
      default: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
