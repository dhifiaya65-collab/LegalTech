const mongoose = require('mongoose');

const disponibiliteSchema = new mongoose.Schema(
  {
    professionnel: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
    date: { type: String, required: true }, // format YYYY-MM-DD
    heureDebut: { type: String, required: true }, // HH:mm
    heureFin: { type: String, required: true },
    disponible: { type: Boolean, default: true }
  },
  { timestamps: true }
);

disponibiliteSchema.index({ professionnel: 1, date: 1, heureDebut: 1 }, { unique: true });

module.exports = mongoose.model('Disponibilite', disponibiliteSchema, 'disponibilites');
