const router = require('express').Router();
const mongoose = require('mongoose');
const Disponibilite = require('../models/Disponibilite');
const { authentifier, autoriser } = require('../middleware/auth');
const { wrap } = require('../utils');

router.use(authentifier, autoriser('professionnel'));

const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/disponibilites  (mes creneaux)
router.get('/', wrap(async (req, res) => {
  res.json(await Disponibilite.find({ professionnel: req.user._id }).sort({ date: 1, heureDebut: 1 }));
}));

// POST /api/disponibilites  (gerer les disponibilites)
router.post('/', wrap(async (req, res) => {
  const { date, heureDebut, heureFin } = req.body;
  if (!DATE.test(date || '') || !HEURE.test(heureDebut || '') || !HEURE.test(heureFin || '') || heureFin <= heureDebut)
    return res.status(400).json({ message: 'Date/heures invalides' });
  try {
    const d = await Disponibilite.create({ professionnel: req.user._id, date, heureDebut, heureFin });
    res.status(201).json(d);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Ce creneau existe deja' });
    throw e;
  }
}));

// DELETE /api/disponibilites/:id  (uniquement si non reserve)
router.delete('/:id', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Identifiant invalide' });
  const r = await Disponibilite.findOneAndDelete({
    _id: req.params.id, professionnel: req.user._id, disponible: true
  });
  if (!r) return res.status(404).json({ message: 'Creneau introuvable ou deja reserve' });
  res.json({ message: 'Creneau supprime' });
}));

module.exports = router;
