// Remplit la base "legaltech" avec des donnees de demonstration : npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const Utilisateur = require('./models/Utilisateur');
const Disponibilite = require('./models/Disponibilite');
const RendezVous = require('./models/RendezVous');
const Notification = require('./models/Notification');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

const jour = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/legaltech');
  await Promise.all([Utilisateur, Disponibilite, RendezVous, Notification, Conversation, Message].map((m) => m.deleteMany({})));

  const h = await Utilisateur.hasher('123456');
  const base = { motDePasseHash: h, actif: true, emailVerifie: true };

  await Utilisateur.create({ ...base, nom: 'Admin', prenom: 'Super', email: 'admin@legaltech.tn', role: 'admin' });
  await Utilisateur.create({ ...base, nom: 'Ben Ali', prenom: 'Sami', email: 'client@legaltech.tn', role: 'client', telephone: '20123456' });

  const pros = await Utilisateur.insertMany([
    { ...base, role: 'professionnel', typeProfessionnel: 'avocat', nom: 'Trabelsi', prenom: 'Amel', email: 'amel@legaltech.tn',
      numeroProfessionnel: 'AV-1001', ville: 'Gafsa', gouvernorat: 'Gafsa', adresse: 'Avenue Habib Bourguiba',
      telephone: '22111222', specialites: ['Droit de la famille', 'Droit civil'],
      description: 'Avocate pres la Cour d\'appel, 10 ans d\'experience.', statutVerification: 'valide' },
    { ...base, role: 'professionnel', typeProfessionnel: 'avocat', nom: 'Gharbi', prenom: 'Karim', email: 'karim@legaltech.tn',
      numeroProfessionnel: 'AV-1002', ville: 'Tunis', gouvernorat: 'Tunis', adresse: 'Lac 2',
      telephone: '22333444', specialites: ['Droit des affaires', 'Droit commercial'],
      description: 'Accompagnement des entreprises et startups.', statutVerification: 'valide' },
    { ...base, role: 'professionnel', typeProfessionnel: 'notaire', nom: 'Jlassi', prenom: 'Mounir', email: 'mounir@legaltech.tn',
      numeroProfessionnel: 'NT-2001', ville: 'Sfax', gouvernorat: 'Sfax', adresse: 'Rue de Tunis',
      telephone: '22555666', specialites: ['Immobilier', 'Successions'],
      description: 'Notaire - actes de vente, donations et successions.', statutVerification: 'valide' },
    { ...base, role: 'professionnel', typeProfessionnel: 'avocat', nom: 'Hamdi', prenom: 'Sonia', email: 'sonia@legaltech.tn',
      numeroProfessionnel: 'AV-1003', ville: 'Sousse', gouvernorat: 'Sousse', specialites: ['Droit du travail'],
      description: 'Profil en attente de validation.', statutVerification: 'en_attente' }
  ]);

  const creneaux = [];
  for (const p of pros.slice(0, 3))
    for (let j = 1; j <= 5; j++)
      for (const [d, f] of [['09:00', '10:00'], ['10:00', '11:00'], ['14:00', '15:00']])
        creneaux.push({ professionnel: p._id, date: jour(j), heureDebut: d, heureFin: f });
  await Disponibilite.insertMany(creneaux);

  // Conversation de demonstration client <-> Me Amel Trabelsi
  const client = await Utilisateur.findOne({ email: 'client@legaltech.tn' });
  const conv = await Conversation.create({
    client: client._id, professionnel: pros[0]._id,
    dernierMessage: 'Bonjour Maitre, puis-je avoir un rendez-vous cette semaine ?', dernierMessageDate: new Date()
  });
  await Message.create({ conversation: conv._id, expediteur: client._id,
    contenu: 'Bonjour Maitre, puis-je avoir un rendez-vous cette semaine ?' });

  console.log('Seed termine.');
  console.log('Comptes (mot de passe 123456) : admin@legaltech.tn | client@legaltech.tn | amel@legaltech.tn (avocate) | mounir@legaltech.tn (notaire)');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
