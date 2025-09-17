const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  metadata: { type: Object, default: {} },
  used: { type: Boolean, default: false },
  usedAt: { type: Date, default: null },
  price: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  sold: { type: Boolean, default: false },
  soldAt: { type: Date, default: null },
  qrImagePath: String,
  qrLink: String,
});

module.exports = mongoose.model('Ticket', TicketSchema);
