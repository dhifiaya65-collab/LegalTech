const router = require('express').Router();
const mongoose = require('mongoose');
const Utilisateur = require('../models/Utilisateur');
const Disponibilite = require('../models/Disponibilite');
const { wrap } = require('../utils');

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/professionnels?ville=&gouvernorat=&type=&specialite=&q=   (public - Visiteur)
router.get('/', wrap(async (req, res) => {
  const { ville, gouvernorat, type, specialite, q } = req.query;
  const filtre = { role: 'professionnel', actif: true, statutVerification: 'valide' };
  if (ville) filtre.ville = new RegExp('^' + esc(ville) + '$', 'i');
  if (gouvernorat) filtre.gouvernorat = new RegExp('^' + esc(gouvernorat) + '$', 'i');
  if (type) filtre.typeProfessionnel = type;
  if (specialite) filtre.specialites = new RegExp(esc(specialite), 'i');
  if (q) filtre.$or = [{ nom: new RegExp(esc(q), 'i') }, { prenom: new RegExp(esc(q), 'i') }];

  const liste = await Utilisateur.find(filtre).sort({ nom: 1 });
  res.json(liste);
}));

// GET /api/professionnels/:id
router.get('/:id', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Identifiant invalide' });
  const pro = await Utilisateur.findOne({
    _id: req.params.id, role: 'professionnel', actif: true, statutVerification: 'valide'
  });
  if (!pro) return res.status(404).json({ message: 'Professionnel introuvable' });
  res.json(pro);
}));

// GET /api/professionnels/:id/disponibilites  (creneaux libres a venir)
router.get('/:id/disponibilites', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Identifiant invalide' });
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const creneaux = await Disponibilite.find({
    professionnel: req.params.id, disponible: true, date: { $gte: aujourdhui }
  }).sort({ date: 1, heureDebut: 1 });
  res.json(creneaux);
}));

module.exports = router;
