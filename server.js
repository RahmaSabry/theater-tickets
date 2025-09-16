require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const QRCode = require('qrcode');
const { nanoid } = require('nanoid');
const cors = require('cors');

const Ticket = require('./models/Ticket');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017?replicaSet=rs0&directConnection=true';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch((e)=> console.error('MongoDB connection error', e));

/**
 * Create ticket: returns code and dataURL of QR
 * POST /api/tickets
 * body: { optional: metadata }
 */
app.post('/api/tickets', async (req, res) => {
  try {
    const code = nanoid(10);
    const ticket = new Ticket({ code, metadata: req.body.metadata || {} });
    await ticket.save();
    const qrDataUrl = await QRCode.toDataURL(code, { errorCorrectionLevel: 'H' });
    res.json({ code, qr: qrDataUrl, ticketId: ticket._id });
    console.log(`Ticket created: ${code}`);
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

/**
 * Scan ticket: mark used
 * POST /api/scan
 * body: { code }
 */
app.post('/api/scan', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code is required' });
    const ticket = await Ticket.findOne({ code });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (ticket.used) return res.status(400).json({ error: 'Ticket already used', used: true, usedAt: ticket.usedAt });
    ticket.used = true;
    ticket.usedAt = new Date();
    await ticket.save();
    res.json({ ok: true, message: 'Ticket successfully used', code, usedAt: ticket.usedAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Scan failed' });
  }
});

/**
 * Optional: get ticket status
 * GET /api/tickets/:code
 */
app.get('/api/tickets/:code', async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ code: req.params.code }).select('-__v');
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed' });
  }
});

/* Serve front-end pages */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/scan', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'scan.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
