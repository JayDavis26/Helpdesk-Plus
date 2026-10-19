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
},

    assignedTo: {
    type: String,
    default: "Unassigned"
},


comments: [
  {
    text: {
      type: String,
      required: true
    },
    author: {
      type: String,
      default: "User"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }
],

attachments: [
      {
        originalName: { type: String, required: true },
        filename: { type: String, required: true },
        url: { type: String, required: true },
        mimetype: { type: String, required: true },
        size: { type: Number, required: true }
      }
    ],

    activityHistory: [
  {
    action: {
      type: String,
      required: true
    },
    details: {
      type: String,
      required: true
    },
    performedBy: {
      type: String,
      default: "User"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }
]

  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Ticket", ticketSchema);