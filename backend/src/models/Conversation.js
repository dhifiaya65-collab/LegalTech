const mongoose = require('mongoose');

// Une conversation = un client + un professionnel
const conversationSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
    professionnel: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
    dernierMessage: String,
    dernierMessageDate: Date
  },
  { timestamps: true }
);
conversationSchema.index({ client: 1, professionnel: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema, 'conversations');
