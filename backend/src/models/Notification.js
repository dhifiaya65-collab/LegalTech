const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  destinataire: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'info' }, // rdv_demande, rdv_confirme, rdv_refuse, rdv_annule, profil...
  lu: { type: Boolean, default: false },
  dateEnvoi: { type: Date, default: Date.now }
});

notificationSchema.index({ destinataire: 1, dateEnvoi: -1 });

module.exports = mongoose.model('Notification', notificationSchema, 'notifications');
