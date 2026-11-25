const router = require('express').Router();
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Utilisateur = require('../models/Utilisateur');
const { authentifier, autoriser } = require('../middleware/auth');
const { wrap } = require('../utils');

router.use(authentifier, autoriser('client', 'professionnel'));

const peupler = (q) =>
  q.populate('client', 'nom prenom').populate('professionnel', 'nom prenom typeProfessionnel ville');

// GET /api/conversations  (mes conversations + nombre de messages non lus)
router.get('/', wrap(async (req, res) => {
  const cle = req.user.role === 'client' ? 'client' : 'professionnel';
  const convs = await peupler(Conversation.find({ [cle]: req.user._id }).sort({ dernierMessageDate: -1, createdAt: -1 }));
  const out = await Promise.all(convs.map(async (c) => ({
    ...c.toObject(),
    nonLus: await Message.countDocuments({ conversation: c._id, expediteur: { $ne: req.user._id }, lu: false })
  })));
  res.json(out);
}));

// POST /api/conversations  { professionnelId }  (le client demarre / retrouve la conversation)
router.post('/', autoriser('client'), wrap(async (req, res) => {
  const { professionnelId } = req.body;
  if (!mongoose.isValidObjectId(professionnelId)) return res.status(400).json({ message: 'Professionnel invalide' });
  const pro = await Utilisateur.findOne({
    _id: professionnelId, role: 'professionnel', actif: true, statutVerification: 'valide'
  });
  if (!pro) return res.status(404).json({ message: 'Professionnel introuvable' });

  const cle = { client: req.user._id, professionnel: pro._id };
  let conv = await Conversation.findOne(cle);
  if (!conv) {
    try { conv = await Conversation.create(cle); }
    catch (e) { if (e.code === 11000) conv = await Conversation.findOne(cle); else throw e; }
  }
  res.status(201).json(await peupler(Conversation.findById(conv._id)));
}));

// Charge la conversation si l'utilisateur en fait partie
async function charger(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ message: 'Identifiant invalide' }); return null; }
  const conv = await Conversation.findById(req.params.id);
  if (!conv) { res.status(404).json({ message: 'Conversation introuvable' }); return null; }
  if (![String(conv.client), String(conv.professionnel)].includes(String(req.user._id))) {
    res.status(403).json({ message: 'Acces refuse' }); return null;
  }
  return conv;
}

// GET /api/conversations/:id/messages  (marque les messages recus comme lus)
router.get('/:id/messages', wrap(async (req, res) => {
  const conv = await charger(req, res); if (!conv) return;
  await Message.updateMany({ conversation: conv._id, expediteur: { $ne: req.user._id }, lu: false }, { lu: true });
  res.json(await Message.find({ conversation: conv._id }).sort({ dateEnvoi: 1 }).limit(500));
}));

// POST /api/conversations/:id/messages  { contenu }
router.post('/:id/messages', wrap(async (req, res) => {
  const conv = await charger(req, res); if (!conv) return;
  const contenu = String(req.body.contenu || '').trim();
  if (!contenu || contenu.length > 2000) return res.status(400).json({ message: 'Message vide ou trop long (2000 max)' });
  const msg = await Message.create({ conversation: conv._id, expediteur: req.user._id, contenu });
  conv.dernierMessage = contenu.slice(0, 80);
  conv.dernierMessageDate = msg.dateEnvoi;
  await conv.save();
  res.status(201).json(msg);
}));

module.exports = router;
