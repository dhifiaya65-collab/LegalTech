const mongoose = require('mongoose');

const rendezVousSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
    professionnel: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
    disponibilite: { type: mongoose.Schema.Types.ObjectId, ref: 'Disponibilite', required: true },
    dateHeure: { type: Date, required: true },
    motif: { type: String, trim: true },
    statut: {
      type: String,
      enum: ['en_attente', 'confirme', 'refuse', 'annule'],
      default: 'en_attente'
    }
  },
  { timestamps: { createdAt: 'dateCreation', updatedAt: true } }
);

rendezVousSchema.index({ client: 1, dateHeure: -1 });
rendezVousSchema.index({ professionnel: 1, dateHeure: -1 });

module.exports = mongoose.model('RendezVous', rendezVousSchema, 'rendezvous');
