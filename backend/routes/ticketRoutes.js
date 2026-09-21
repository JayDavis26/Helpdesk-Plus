const express = require("express");
const Ticket = require("../models/Ticket");

const router = express.Router();

// Create a new ticket
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
      priority
    });

    const savedTicket = await newTicket.save();

    res.status(201).json(savedTicket);
  } catch (error) {
    console.error("Error creating ticket:", error.message);
    res.status(500).json({
      message: "Failed to create ticket"
    });
  }
});

// Get all tickets
router.get("/", async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error.message);
    res.status(500).json({
      message: "Failed to fetch tickets"
    });
  }
});

// Update a ticket
router.patch("/:id", async (req, res) => {
  try {
    const { status, priority } = req.body;

    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        status,
        priority
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedTicket) {
      return res.status(404).json({
        message: "Ticket not found"
      });
    }

    res.json(updatedTicket);
  } catch (error) {
    console.error("Error updating ticket:", error.message);
    res.status(500).json({
      message: "Failed to update ticket"
    });
  }
});

// Add a comment to a ticket
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
      return res.status(404).json({
        message: "Ticket not found"
      });
    }

    ticket.comments.push({
      text: text.trim(),
      author: author || "User"
    });

    await ticket.save();

    res.json(ticket);
  } catch (error) {
    console.error("Error adding comment:", error.message);

    res.status(500).json({
      message: "Failed to add comment"
    });
  }
});

// Assign a ticket to a support agent
router.patch("/:id/assign", async (req, res) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo || assignedTo.trim() === "") {
      return res.status(400).json({
        message: "Support agent is required"
      });
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        assignedTo: assignedTo.trim()
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedTicket) {
      return res.status(404).json({
        message: "Ticket not found"
      });
    }

    res.json(updatedTicket);
  } catch (error) {
    console.error("Error assigning ticket:", error.message);

    res.status(500).json({
      message: "Failed to assign ticket"
    });
  }
});

module.exports = router;