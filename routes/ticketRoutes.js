import express from "express";
import Ticket from "../models/Ticket.js";
import dotenv from "dotenv";
dotenv.config();
const router = express.Router();
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


export default router;
