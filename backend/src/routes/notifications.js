const router = require('express').Router();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { authentifier } = require('../middleware/auth');
const { wrap } = require('../utils');

router.use(authentifier);

router.get('/', wrap(async (req, res) => {
  res.json(await Notification.find({ destinataire: req.user._id }).sort({ dateEnvoi: -1 }).limit(50));
}));

router.patch('/lire-tout', wrap(async (req, res) => {
  await Notification.updateMany({ destinataire: req.user._id, lu: false }, { lu: true });
  res.json({ message: 'ok' });
}));

router.patch('/:id/lu', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Identifiant invalide' });
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, destinataire: req.user._id }, { lu: true }, { new: true });
  if (!n) return res.status(404).json({ message: 'Notification introuvable' });
  res.json(n);
}));

module.exports = router;
