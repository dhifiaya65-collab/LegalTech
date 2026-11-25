const router = require('express').Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Utilisateur = require('../models/Utilisateur');
const { authentifier } = require('../middleware/auth');
const { wrap, notifier, genererToken, hashToken } = require('../utils');
const { envoyerMail, smtpActif } = require('../mailer');

const FRONT = () => process.env.FRONTEND_URL || 'http://localhost:4200';
const limiteur = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { message: 'Trop de tentatives, reessayez plus tard' } });

const signer = (u) =>
  jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

const publicUser = (u) => {
  const o = u.toObject();
  delete o.motDePasseHash;
  return o;
};

// Envoie le mail de verification. Retourne le lien SEULEMENT en mode dev (pas de SMTP configure).
async function envoyerLienVerification(user) {
  const { token, hash } = genererToken();
  user.tokenVerificationHash = hash;
  user.tokenVerificationExpire = new Date(Date.now() + 24 * 3600 * 1000);
  await user.save();
  const lien = `${FRONT()}/verifier-email?token=${token}`;
  await envoyerMail({
    to: user.email,
    subject: 'LegalTech - Verifiez votre adresse email',
    text: `Bonjour ${user.prenom},\n\nCliquez sur ce lien pour verifier votre email (valable 24h) :\n${lien}\n`,
    html: `<p>Bonjour ${user.prenom},</p><p><a href="${lien}">Verifier mon adresse email</a> (valable 24h)</p>`
  });
  return smtpActif ? undefined : lien;
}

// POST /api/auth/register  (Creer un compte : client ou professionnel)
router.post('/register', wrap(async (req, res) => {
  const { nom, prenom, email, motDePasse, telephone, role } = req.body;
  if (!nom || !prenom || !email || !motDePasse || motDePasse.length < 6)
    return res.status(400).json({ message: 'Champs invalides (mot de passe : 6 caracteres min.)' });
  if (await Utilisateur.findOne({ email: email.toLowerCase() }))
    return res.status(409).json({ message: 'Email deja utilise' });

  const data = {
    nom, prenom, email, telephone,
    motDePasseHash: await Utilisateur.hasher(motDePasse),
    role: role === 'professionnel' ? 'professionnel' : 'client', // jamais admin via inscription
    emailVerifie: false
  };
  if (data.role === 'professionnel') {
    const { typeProfessionnel, numeroProfessionnel, adresse, ville, gouvernorat, description, specialites } = req.body;
    if (!['avocat', 'notaire'].includes(typeProfessionnel) || !numeroProfessionnel || !ville || !gouvernorat)
      return res.status(400).json({ message: 'Type, numero professionnel, ville et gouvernorat requis' });
    Object.assign(data, {
      typeProfessionnel, numeroProfessionnel, adresse, ville, gouvernorat, description,
      specialites: Array.isArray(specialites) ? specialites : [],
      statutVerification: 'en_attente'
    });
  }
  const user = await Utilisateur.create(data);
  if (user.role === 'professionnel')
    await notifier(user._id, 'Votre profil est en attente de verification par l\'administrateur.', 'profil');
  const devLink = await envoyerLienVerification(user);
  res.status(201).json({
    message: 'Compte cree. Un email de verification vous a ete envoye : cliquez sur le lien pour activer votre compte.',
    devLink
  });
}));

// POST /api/auth/verify-email  { token }
router.post('/verify-email', wrap(async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Token manquant' });
  const user = await Utilisateur.findOne({
    tokenVerificationHash: hashToken(token), tokenVerificationExpire: { $gt: new Date() }
  });
  if (!user) return res.status(400).json({ message: 'Lien invalide ou expire' });
  user.emailVerifie = true;
  user.tokenVerificationHash = undefined;
  user.tokenVerificationExpire = undefined;
  await user.save();
  res.json({ message: 'Email verifie. Vous pouvez vous connecter.' });
}));

// POST /api/auth/resend-verification  { email }  (reponse volontairement identique si l'email n'existe pas)
router.post('/resend-verification', limiteur, wrap(async (req, res) => {
  const user = await Utilisateur.findOne({ email: String(req.body.email || '').toLowerCase() });
  let devLink;
  if (user && user.emailVerifie === false) devLink = await envoyerLienVerification(user);
  res.json({ message: 'Si le compte existe et n\'est pas verifie, un nouvel email a ete envoye.', devLink });
}));

// POST /api/auth/forgot-password  { email }
router.post('/forgot-password', limiteur, wrap(async (req, res) => {
  const user = await Utilisateur.findOne({ email: String(req.body.email || '').toLowerCase() });
  let devLink;
  if (user && user.actif) {
    const { token, hash } = genererToken();
    user.resetTokenHash = hash;
    user.resetTokenExpire = new Date(Date.now() + 3600 * 1000); // 1 heure
    await user.save();
    const lien = `${FRONT()}/reinitialiser-mot-de-passe?token=${token}`;
    await envoyerMail({
      to: user.email,
      subject: 'LegalTech - Reinitialisation du mot de passe',
      text: `Bonjour ${user.prenom},\n\nPour choisir un nouveau mot de passe (lien valable 1h) :\n${lien}\n\nSi vous n'etes pas a l'origine de cette demande, ignorez ce message.`,
      html: `<p>Bonjour ${user.prenom},</p><p><a href="${lien}">Choisir un nouveau mot de passe</a> (valable 1h)</p><p>Si vous n'etes pas a l'origine de cette demande, ignorez ce message.</p>`
    });
    if (!smtpActif) devLink = lien;
  }
  // Meme reponse que l'email existe ou non (evite de reveler les comptes existants)
  res.json({ message: 'Si cette adresse existe, un email de reinitialisation vient d\'etre envoye.', devLink });
}));

// POST /api/auth/reset-password  { token, motDePasse }
router.post('/reset-password', limiteur, wrap(async (req, res) => {
  const { token, motDePasse } = req.body;
  if (!token || !motDePasse || motDePasse.length < 6)
    return res.status(400).json({ message: 'Mot de passe invalide (6 caracteres min.)' });
  const user = await Utilisateur.findOne({
    resetTokenHash: hashToken(token), resetTokenExpire: { $gt: new Date() }
  });
  if (!user) return res.status(400).json({ message: 'Lien invalide ou expire' });
  user.motDePasseHash = await Utilisateur.hasher(motDePasse);
  user.resetTokenHash = undefined;
  user.resetTokenExpire = undefined;
  user.emailVerifie = true; // il a prouve qu'il possede l'email
  await user.save();
  res.json({ message: 'Mot de passe modifie. Vous pouvez vous connecter.' });
}));

// POST /api/auth/login
router.post('/login', wrap(async (req, res) => {
  const { email, motDePasse } = req.body;
  if (!email || !motDePasse) return res.status(400).json({ message: 'Email et mot de passe requis' });
  const user = await Utilisateur.findOne({ email: email.toLowerCase() }).select('+motDePasseHash');
  if (!user || !(await user.verifierMotDePasse(motDePasse)))
    return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
  if (!user.actif) return res.status(401).json({ message: 'Compte desactive' });
  // emailVerifie === false uniquement : les anciens comptes (champ absent) restent utilisables
  if (user.emailVerifie === false)
    return res.status(403).json({ message: 'Email non verifie. Verifiez votre boite mail.', code: 'EMAIL_NON_VERIFIE' });
  res.json({ token: signer(user), user: publicUser(user) });
}));

// GET /api/auth/me
router.get('/me', authentifier, (req, res) => res.json(publicUser(req.user)));

// PUT /api/auth/me  (modifierProfil)
router.put('/me', authentifier, wrap(async (req, res) => {
  const champs = ['nom', 'prenom', 'telephone'];
  if (req.user.role === 'professionnel')
    champs.push('adresse', 'ville', 'gouvernorat', 'description', 'specialites');
  champs.forEach((c) => { if (req.body[c] !== undefined) req.user[c] = req.body[c]; });
  await req.user.save();
  res.json(publicUser(req.user));
}));

module.exports = router;
