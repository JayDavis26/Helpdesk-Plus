const express = require("express");
const Ticket = require("../models/Ticket");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;
    const ticketCount = await Ticket.countDocuments();
    const ticketNumber = `TKT-${String(ticketCount + 1).padStart(6, "0")}`;

    const newTicket = new Ticket({
      ticketNumber,
      title,
      description,
      category,
      priority,
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
    const tickets = await Ticket.find().sort({ createdAt: -1 });
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
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (status && status !== ticket.status) {
      ticket.activityHistory.push({
        action: "Status Changed",
        details: `Status changed from ${ticket.status} to ${status}.`,
        performedBy: "User"
      });
      ticket.status = status;
    }

    if (priority && priority !== ticket.priority) {
      ticket.activityHistory.push({
        action: "Priority Changed",
        details: `Priority changed from ${ticket.priority} to ${priority}.`,
        performedBy: "User"
      });
      ticket.priority = priority;
    }

    const updatedTicket = await ticket.save();
    res.json(updatedTicket);
  } catch (error) {
    console.error("Error updating ticket:", error.message);
    res.status(500).json({ message: "Failed to update ticket" });
  }
});

router.post("/:id/comments", async (req, res) => {
  try {
    const { text, author } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({
        message: "Comment text is required"
      });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const commentAuthor = author || "User";

    ticket.comments.push({
      text: text.trim(),
      author: commentAuthor
    });

    ticket.activityHistory.push({
      action: "Comment Added",
      details: `${commentAuthor} added a comment.`,
      performedBy: commentAuthor
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
    const { assignedTo } = req.body;

    if (!assignedTo || assignedTo.trim() === "") {
      return res.status(400).json({
        message: "Support agent is required"
      });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const newAssignee = assignedTo.trim();
    const previousAssignee = ticket.assignedTo || "Unassigned";

    if (newAssignee !== previousAssignee) {
      ticket.assignedTo = newAssignee;

      ticket.activityHistory.push({
        action: "Ticket Assigned",
        details: `Assignment changed from ${previousAssignee} to ${newAssignee}.`,
        performedBy: "User"
      });
    }

    const updatedTicket = await ticket.save();
    res.json(updatedTicket);
  } catch (error) {
    console.error("Error assigning ticket:", error.message);
    res.status(500).json({ message: "Failed to assign ticket" });
  }
});

module.exports = router;