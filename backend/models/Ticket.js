const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true
    },

    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Technical Support",
        "Account Issues",
        "Billing",
        "Hardware",
        "Software",
        "General Questions"
      ]
    },

    priority: {
      type: String,
      required: true,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium"
    },

    status: {
      type: String,
      default: "New",
      enum: [
        "New",
        "Open",
        "In Progress",
        "Waiting for User",
        "Resolved",
        "Closed"
      ]
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Ticket", ticketSchema);