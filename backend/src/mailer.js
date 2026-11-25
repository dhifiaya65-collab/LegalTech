const nodemailer = require('nodemailer');

// Si SMTP_HOST n'est pas defini : mode DEV -> le mail est affiche dans la console du backend.
const smtpActif = !!process.env.SMTP_HOST;
const transporter = smtpActif
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
  : null;

async function envoyerMail({ to, subject, text, html }) {
  if (!transporter) {
    console.log(`\n===== [MAIL SIMULE - mode dev] =====\nA : ${to}\nObjet : ${subject}\n${text}\n====================================\n`);
    return false;
  }
  try {
    await transporter.sendMail({ from: process.env.MAIL_FROM || 'LegalTech <no-reply@legaltech.tn>', to, subject, text, html });
    return true;
  } catch (e) {
    console.error('Erreur envoi mail :', e.message);
    return false;
  }
}

module.exports = { envoyerMail, smtpActif };
