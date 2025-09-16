import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import ticketRoutes from "./routes/ticketRoutes.js";
import fs from "fs";
import path from "path";

dotenv.config();
const app = express();

app.use(express.json());
app.use(express.static("public"));

if (!fs.existsSync("tickets")) {
  fs.mkdirSync("tickets");
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// Routes
app.use("/ticket", ticketRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
