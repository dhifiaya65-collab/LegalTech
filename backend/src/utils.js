const Notification = require('./models/Notification');

exports.notifier = (destinataire, message, type = 'info') =>
  Notification.create({ destinataire, message, type }).catch(() => null);

exports.wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const crypto = require('crypto');
// Token aleatoire envoye par mail ; seul son hash SHA-256 est stocke en base.
exports.hashToken = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');
exports.genererToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, hash: exports.hashToken(token) };
};
