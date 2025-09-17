import express from "express";
import QRCode from "qrcode";
import fs from "fs";
import Ticket from "../models/Ticket.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const qrDir = path.join(__dirname, "../public/qrcodes"); 
if (!fs.existsSync(qrDir)) {
  fs.mkdirSync(qrDir, { recursive: true });
}
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
router.post("/create", async (req, res) => {
  try {
    const { price, count } = req.body;

    if (!price || !count) {
      return res.status(400).json({ error: "Price and count are required" });
    }

    const createdTickets = [];

    for (let i = 0; i < count; i++) {
      const ticket = await Ticket.create({
        price,
        sold: false,
      });

      const qrLink = `${BASE_URL}/ticket/${ticket._id}`;
      const filePath = path.join(qrDir, `${ticket._id}.png`);

      await QRCode.toFile(filePath, qrLink);
      ticket.qrLink = qrLink;
      ticket.qrImagePath = `/qrcodes/${ticket._id}.png`;
      await ticket.save();
      createdTickets.push(ticket);
    }

    res.json(createdTickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  console.log("Accessing ticket:", req.params.id);
  
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).send("Ticket not found");
  const statusClass = ticket.used ? "valid" : "used";
  const showImage = "/images/theater-show.png";

  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تذكرة العرض</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f9fafb;
          margin: 0;
          padding: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .ticket-container {
          background: #fff;
          padding: 30px;
          border-radius: 10px;
          width: 100%;
          max-width: 420px;
          border: 1px solid #e5e7eb;
        }
        .ticket-header {
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 20px;
          padding-bottom: 10px;
        }
        .ticket-header h2 {
          margin: 0;
          font-size: 22px;
          color: #111827;
        }
        .ticket-details p {
          margin: 8px 0;
          font-size: 15px;
          color: #374151;
        }
        .status {
          margin-top: 15px;
          font-weight: bold;
          font-size: 16px;
        }
        .valid { color: #16a34a; }   /* أخضر */
        .used { color: #dc2626; }    /* أحمر */
        button {
          margin-top: 20px;
          width: 100%;
          padding: 12px;
          font-size: 15px;
          border: none;
          border-radius: 6px;
          background: #2563eb;
          color: #fff;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        button:hover:not(:disabled) {
          background: #1e40af;
        }
        button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
      </style>
    </head>
    <body>
      <div class="ticket-container">
        <div class="ticket-header">
          <h2>${ticket.showName || "مسرحية شبابيك"}</h2>
        </div>
        <div class="ticket-details">
          <img src="${showImage}" alt="Show Image" style="width:100%; border-radius:8px; margin-bottom:15px;" />
          <p><b>رقم التذكرة:</b> ${ticket._id}</p>
          <p><b>التاريخ:</b> ${ticket.showDate || "24/09/2025"}</p>
          <p><b>الوقت:</b> ${ticket.showTime || "8 مساء"}</p>
          <p><b>السعر:</b> ${ticket.price || "غير محدد"} جنيه</p>
          <p class="status ${ticket.used ? "used" : "valid"}">
            ${ticket.used ? "❌  تم استخدام التذكرة في : " + new Date(ticket.usedAt).toLocaleString("ar-EG") : "✅ التذكرة صالحة"}
          </p>
        </div>
        <button id="useBtn" ${ticket.used ? "disabled" : ""}>استخدام التذكرة</button>
      </div>

      <script>
        document.getElementById("useBtn")?.addEventListener("click", async () => {
          const res = await fetch("/ticket/use/${ticket._id}", { method: "POST" });
          const data = await res.json();
          alert(data.message);
          location.reload();
        });
      </script>
    </body>
    </html>
  `);
});

router.post("/use/:id", async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  if (ticket.used) {
    return res.json({ message: "❌ التذكرة تم استخدامها بالفعل" });
  }

  ticket.used = true;
  ticket.usedAt = new Date();
  await ticket.save();
  res.json({ message: "✅ تم تسجيل استخدام التذكرة" });
});

router.post("/:id/sell", async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  ticket.sold = true;
  ticket.soldAt = new Date();
  await ticket.save();

  res.json(ticket);
});

router.get("/", async (req, res) => {
  const tickets = await Ticket.find();
  res.json(tickets);
});

export default router;
