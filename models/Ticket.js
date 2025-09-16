const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true, index: true },
  metadata: { type: Object, default: {} },
  used: { type: Boolean, default: false },
  usedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', TicketSchema);
