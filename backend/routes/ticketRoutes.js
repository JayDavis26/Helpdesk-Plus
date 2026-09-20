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

module.exports = router;