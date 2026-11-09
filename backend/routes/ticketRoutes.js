const express = require("express");
const Ticket = require("../models/Ticket");
const requireAuth = require("../middleware/requireAuth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const router = express.Router();
const allowedStatuses = [
  "New",
  "Open",
  "In Progress",
  "Waiting for User",
  "Resolved",
  "Closed"
];

const allowedPriorities = [
  "Low",
  "Medium",
  "High",
  "Critical"
];

function canAccessTicket(user, ticket) {
  if (["Support Agent", "Administrator"].includes(user.role)) {
    return true;
  }

  return (
    user.role === "User" &&
    ticket.createdBy &&
    ticket.createdBy.toString() === user._id.toString()
  );
}
router.use(requireAuth);

const uploadDirectory = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedExtensions = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp",
  ".mp4", ".mov", ".webm"
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.has(extension)) {
      return callback(new Error("This file type is not allowed."));
    }
    callback(null, true);
  }
});

function handleTicketUploads(req, res, next) {
  upload.array("attachments", 5)(req, res, (error) => {
    if (error) {
      const message = error.code === "LIMIT_FILE_SIZE"
        ? "Each attachment must be 50 MB or smaller."
        : error.code === "LIMIT_FILE_COUNT"
          ? "You can attach up to 5 files."
          : error.message;
      return res.status(400).json({ message });
    }
    next();
  });
}

router.post("/", handleTicketUploads, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      submitterName,
      submitterEmail
  } = req.body;
    const ticketCount = await Ticket.countDocuments();
    const ticketNumber = `TKT-${String(ticketCount + 1).padStart(6, "0")}`;

    const newTicket = new Ticket({
      createdBy: req.authUser._id,
      ticketNumber,
      title,
      description,
      category,
      priority,
      submitterName: submitterName?.trim(),
      submitterEmail: submitterEmail?.trim().toLowerCase(),
      attachments: (req.files || []).map((file) => ({
        originalName: file.originalname,
        filename: file.filename,
        url: `/uploads/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size
      })),
      activityHistory: [
        {
          action: "Ticket Created",
          details: "Ticket was created.",
          performedBy: "User"
        }
      ]
    });

    const savedTicket = await newTicket.save();
    res.status(201).json(savedTicket);
  } catch (error) {
    console.error("Error creating ticket:", error.message);
    res.status(500).json({ message: "Failed to create ticket" });
  }
});

router.get("/", async (req, res) => {
  try {
    const filter =
      req.authUser.role === "User"
        ? { createdBy: req.authUser._id }
        : {};

    const tickets = await Ticket.find(filter).sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error.message);
    res.status(500).json({ message: "Failed to fetch tickets" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { status, priority } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found"
      });
    }

    if (!canAccessTicket(req.authUser, ticket)) {
      return res.status(403).json({
        message: "You cannot access this ticket."
      });
    }

    if (
  status !== undefined &&
  !allowedStatuses.includes(status)
) {
  return res.status(400).json({
    message: "Invalid ticket status."
  });
}

if (
  priority !== undefined &&
  !allowedPriorities.includes(priority)
) {
  return res.status(400).json({
    message: "Invalid ticket priority."
  });
}

    if (
      status !== undefined &&
      status !== ticket.status &&
      !["Administrator", "Support Agent"].includes(req.authUser.role)
    ) {
      return res.status(403).json({
        message: "Only administrators and support agents can change ticket status."
      });
    }

    if (status !== undefined && status !== ticket.status) {
      ticket.activityHistory.push({
        action: "Status Changed",
        details: `Status changed from ${ticket.status} to ${status}.`,
        performedBy: req.authUser.role
      });

      ticket.status = status;
    }

    if (priority !== undefined && priority !== ticket.priority) {
      ticket.activityHistory.push({
        action: "Priority Changed",
        details: `Priority changed from ${ticket.priority} to ${priority}.`,
        performedBy: req.authUser.role
      });

      ticket.priority = priority;
    }

    const updatedTicket = await ticket.save();

    res.json(updatedTicket);
  } catch (error) {
    console.error("Error updating ticket:", error.message);

    res.status(500).json({
      message: "Failed to update ticket"
    });
  }
});

router.post("/:id/comments", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({
        message: "Comment text is required"
      });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (!canAccessTicket(req.authUser, ticket)) {
  return res.status(403).json({
    message: "You cannot access this ticket."
  });
}


    ticket.comments.push({
  text: text.trim(),
  author: req.authUser.role
});
   ticket.activityHistory.push({
  action: "Comment Added",
  details: `${req.authUser.role} added a comment.`,
  performedBy: req.authUser.role
});

    await ticket.save();
    res.json(ticket);
  } catch (error) {
    console.error("Error adding comment:", error.message);
    res.status(500).json({ message: "Failed to add comment" });
  }
});

router.delete("/:id/comments/:commentId", async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (!canAccessTicket(req.authUser, ticket)) {
      return res.status(403).json({
        message: "You cannot access this ticket."
      });
    }

    const comment = ticket.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const commentAuthor = comment.author || "User";

    ticket.comments.pull({ _id: commentId });

    ticket.activityHistory.push({
      action: "Comment Deleted",
      details: `A comment by ${commentAuthor} was deleted.`,
      performedBy: "User"
    });

    await ticket.save();
    res.json(ticket);
  } catch (error) {
    console.error("Error deleting comment:", error.message);
    res.status(500).json({ message: "Failed to delete comment" });
  }
});

router.patch("/:id/assign", async (req, res) => {
  try {
    if (
      !["Administrator", "Support Agent"].includes(req.authUser.role)
    ) {
      return res.status(403).json({
        message: "Only administrators and support agents can assign tickets."
      });
    }

    const { assignedTo } = req.body;

    if (
      typeof assignedTo !== "string" ||
      assignedTo.trim() === ""
    ) {
      return res.status(400).json({
        message: "Support agent is required"
      });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found"
      });
    }

    const newAssignee = assignedTo.trim();
    const previousAssignee = ticket.assignedTo || "Unassigned";

    if (newAssignee !== previousAssignee) {
      ticket.assignedTo = newAssignee;

      ticket.activityHistory.push({
        action: "Ticket Assigned",
        details: `Assignment changed from ${previousAssignee} to ${newAssignee}.`,
        performedBy: req.authUser.role
      });
    }

    const updatedTicket = await ticket.save();

    res.json(updatedTicket);
  } catch (error) {
    console.error("Error assigning ticket:", error.message);

    res.status(500).json({
      message: "Failed to assign ticket"
    });
  }
});

module.exports = router;