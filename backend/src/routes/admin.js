const router = require('express').Router();
const mongoose = require('mongoose');
const Utilisateur = require('../models/Utilisateur');
const { authentifier, autoriser } = require('../middleware/auth');
const { wrap, notifier } = require('../utils');

router.use(authentifier, autoriser('admin'));

// GET /api/admin/utilisateurs?role=&q=   (gerer les utilisateurs)
router.get('/utilisateurs', wrap(async (req, res) => {
  const f = {};
  if (req.query.role) f.role = req.query.role;
  if (req.query.statut) f.statutVerification = req.query.statut;
  res.json(await Utilisateur.find(f).sort({ createdAt: -1 }));
}));

// PATCH /api/admin/utilisateurs/:id/activation   { actif: true|false }
router.patch('/utilisateurs/:id/activation', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Identifiant invalide' });
  if (String(req.params.id) === String(req.user._id)) return res.status(400).json({ message: 'Action impossible sur votre propre compte' });
  const u = await Utilisateur.findByIdAndUpdate(req.params.id, { actif: !!req.body.actif }, { new: true });
  if (!u) return res.status(404).json({ message: 'Utilisateur introuvable' });
  res.json(u);
}));

// PATCH /api/admin/professionnels/:id/verification   { statut: 'valide'|'refuse' }  (valider et moderer)
router.patch('/professionnels/:id/verification', wrap(async (req, res) => {
  const { statut } = req.body;
  if (!mongoose.isValidObjectId(req.params.id) || !['valide', 'refuse', 'en_attente'].includes(statut))
    return res.status(400).json({ message: 'Parametres invalides' });
  const u = await Utilisateur.findOneAndUpdate(
    { _id: req.params.id, role: 'professionnel' }, { statutVerification: statut }, { new: true });
  if (!u) return res.status(404).json({ message: 'Professionnel introuvable' });
  await notifier(u._id,
    statut === 'valide' ? 'Votre profil a ete valide : il est maintenant visible.' : 'Votre profil n\'a pas ete valide.',
    'profil');
  res.json(u);
}));

module.exports = router;
