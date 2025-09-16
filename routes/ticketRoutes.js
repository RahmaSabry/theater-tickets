import express from "express";
import QRCode from "qrcode";
import fs from "fs";
import Ticket from "../models/Ticket.js";

const router = express.Router();
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
router.post("/create", async (req, res) => {
   try {
    const { price, count } = req.body;

    if (!count || count <= 0) {
      return res.status(400).json({ error: "count must be greater than 0" });
    }

    let createdTickets = [];

    for (let i = 0; i < count; i++) {
      const ticket = await Ticket.create({ price: price });

      const qrData = `${BASE_URL}/ticket/scan/${ticket._id}`;
      const qrImage = await QRCode.toDataURL(qrData);

      createdTickets.push({
        ticketId: ticket._id,
        price: ticket.price,
        qrImage,  
        scanLink: `/ticket/scan/${ticket._id}`
      });
    }

    res.json({
      message: `✅ ${count} tickets created successfully`,
      tickets: createdTickets
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create tickets" });
  }
});

// 📸 عرض صورة QR
router.get("/:id", async (req, res) => {
  try {
    const filePath = `tickets/${req.params.id}.png`;
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath, { root: process.cwd() });
    } else {
      res.status(404).send("QR not found");
    }
  } catch (err) {
    res.status(500).send("Error loading ticket");
  }
});

router.get("/scan/:id", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    // تحقق من الاستخدام
    let status;
    if (ticket.used) {
      status = "used";
    } else {
      status = "valid";
      ticket.used = true; 
      await ticket.save();
    }

    res.json({
      ticketId: ticket._id,
      user: ticket.user,
      price: ticket.price,
      status
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error scanning ticket" });
  }
});

router.get("/", async (req, res) => {
  const tickets = await Ticket.find();
  res.json(tickets);
});

export default router;
