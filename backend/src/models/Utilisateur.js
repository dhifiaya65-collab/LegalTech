const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Classe Utilisateur + heritage (Client, Professionnel[Avocat, Notaire], Administrateur)
// -> une seule collection "utilisateurs", distinguee par role / typeProfessionnel.
const utilisateurSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    motDePasseHash: { type: String, required: true, select: false },
    telephone: { type: String, trim: true },
    role: { type: String, enum: ['client', 'professionnel', 'admin'], default: 'client' },
    actif: { type: Boolean, default: true },

    // --- Verification email / reinitialisation du mot de passe ---
    emailVerifie: { type: Boolean, default: false },
    tokenVerificationHash: { type: String, select: false },
    tokenVerificationExpire: { type: Date, select: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExpire: { type: Date, select: false },

    // --- Champs specifiques Professionnel ---
    typeProfessionnel: { type: String, enum: ['avocat', 'notaire'] },
    numeroProfessionnel: String,
    adresse: String,
    ville: String,
    gouvernorat: String,
    description: String,
    specialites: [String], // Avocat : specialites / Notaire : domainesIntervention
    statutVerification: {
      type: String,
      enum: ['en_attente', 'valide', 'refuse'],
      default: 'en_attente'
    }
  },
  { timestamps: true }
);

utilisateurSchema.methods.verifierMotDePasse = function (mdp) {
  return bcrypt.compare(mdp, this.motDePasseHash);
};

utilisateurSchema.statics.hasher = (mdp) => bcrypt.hash(mdp, 10);

utilisateurSchema.index({ role: 1, statutVerification: 1, ville: 1, gouvernorat: 1 });

module.exports = mongoose.model('Utilisateur', utilisateurSchema, 'utilisateurs');
