const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  expediteur: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  contenu: { type: String, required: true, trim: true, maxlength: 2000 },
  lu: { type: Boolean, default: false },
  dateEnvoi: { type: Date, default: Date.now }
});
messageSchema.index({ conversation: 1, dateEnvoi: 1 });

module.exports = mongoose.model('Message', messageSchema, 'messages');
