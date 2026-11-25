const router = require('express').Router();
const mongoose = require('mongoose');
const RendezVous = require('../models/RendezVous');
const Disponibilite = require('../models/Disponibilite');
const { authentifier, autoriser } = require('../middleware/auth');
const { wrap, notifier } = require('../utils');

router.use(authentifier);

const peupler = (q) =>
  q.populate('client', 'nom prenom email telephone')
   .populate('professionnel', 'nom prenom typeProfessionnel ville adresse telephone')
   .populate('disponibilite', 'date heureDebut heureFin');

// POST /api/rendez-vous  (Client : demander un rendez-vous)
router.post('/', autoriser('client'), wrap(async (req, res) => {
  const { disponibiliteId, motif } = req.body;
  if (!mongoose.isValidObjectId(disponibiliteId))
    return res.status(400).json({ message: 'Creneau invalide' });

  // Reservation ATOMIQUE : un seul client peut passer disponible:true -> false
  const creneau = await Disponibilite.findOneAndUpdate(
    { _id: disponibiliteId, disponible: true },
    { disponible: false },
    { new: true }
  );
  if (!creneau) {
    const existe = await Disponibilite.exists({ _id: disponibiliteId });
    return existe
      ? res.status(409).json({ message: 'Creneau deja reserve, choisissez-en un autre' })
      : res.status(404).json({ message: 'Creneau introuvable' });
  }

  try {
    const rdv = await RendezVous.create({
      client: req.user._id,
      professionnel: creneau.professionnel,
      disponibilite: creneau._id,
      dateHeure: new Date(`${creneau.date}T${creneau.heureDebut}:00`),
      motif
    });
    await notifier(creneau.professionnel,
      `Nouvelle demande de rendez-vous de ${req.user.prenom} ${req.user.nom} le ${creneau.date} a ${creneau.heureDebut}.`,
      'rdv_demande');
    res.status(201).json(await peupler(RendezVous.findById(rdv._id)));
  } catch (e) {
    await Disponibilite.findByIdAndUpdate(creneau._id, { disponible: true }); // rollback
    throw e;
  }
}));

// GET /api/rendez-vous  (mes rendez-vous : client ou professionnel)
router.get('/', autoriser('client', 'professionnel'), wrap(async (req, res) => {
  const cle = req.user.role === 'client' ? 'client' : 'professionnel';
  res.json(await peupler(RendezVous.find({ [cle]: req.user._id }).sort({ dateHeure: -1 })));
}));

// Charge un RDV appartenant a l'utilisateur
async function charger(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ message: 'Identifiant invalide' }); return null; }
  const rdv = await RendezVous.findById(req.params.id);
  if (!rdv) { res.status(404).json({ message: 'Rendez-vous introuvable' }); return null; }
  const estProprio = [String(rdv.client), String(rdv.professionnel)].includes(String(req.user._id));
  if (!estProprio) { res.status(403).json({ message: 'Acces refuse' }); return null; }
  return rdv;
}

// PATCH /api/rendez-vous/:id/confirmer | refuser   (Professionnel : traiter la demande)
['confirmer', 'refuser'].forEach((action) => {
  router.patch(`/:id/${action}`, autoriser('professionnel'), wrap(async (req, res) => {
    const rdv = await charger(req, res); if (!rdv) return;
    if (String(rdv.professionnel) !== String(req.user._id)) return res.status(403).json({ message: 'Acces refuse' });
    if (rdv.statut !== 'en_attente') return res.status(409).json({ message: 'Demande deja traitee' });

    if (action === 'confirmer') {
      rdv.statut = 'confirme';
    } else {
      rdv.statut = 'refuse';
      await Disponibilite.findByIdAndUpdate(rdv.disponibilite, { disponible: true }); // creneau libere
    }
    await rdv.save();
    await notifier(rdv.client,
      action === 'confirmer' ? 'Votre rendez-vous a ete confirme.' : 'Votre demande de rendez-vous a ete refusee.',
      action === 'confirmer' ? 'rdv_confirme' : 'rdv_refuse');
    res.json(await peupler(RendezVous.findById(rdv._id)));
  }));
});

// PATCH /api/rendez-vous/:id/annuler  (client ou professionnel concerne)
router.patch('/:id/annuler', autoriser('client', 'professionnel'), wrap(async (req, res) => {
  const rdv = await charger(req, res); if (!rdv) return;
  if (!['en_attente', 'confirme'].includes(rdv.statut))
    return res.status(409).json({ message: 'Ce rendez-vous ne peut plus etre annule' });
  rdv.statut = 'annule';
  await rdv.save();
  await Disponibilite.findByIdAndUpdate(rdv.disponibilite, { disponible: true });
  const autre = req.user.role === 'client' ? rdv.professionnel : rdv.client;
  await notifier(autre, `Un rendez-vous du ${rdv.dateHeure.toISOString().slice(0, 10)} a ete annule.`, 'rdv_annule');
  res.json(await peupler(RendezVous.findById(rdv._id)));
}));

module.exports = router;
