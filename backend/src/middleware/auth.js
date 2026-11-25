const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/Utilisateur');

// Verifie le JWT -> 401 si absent/invalide
exports.authentifier = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Authentification requise' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Utilisateur.findById(payload.id);
    if (!user || !user.actif) return res.status(401).json({ message: 'Compte invalide ou desactive' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalide ou expire' });
  }
};

// Autorise certains roles -> 403 sinon
exports.autoriser = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Acces refuse' });
  next();
};
