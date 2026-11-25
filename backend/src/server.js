require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
app.use(cors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:4200').split(',') }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/professionnels', require('./routes/professionnels'));
app.use('/api/disponibilites', require('./routes/disponibilites'));
app.use('/api/rendez-vous', require('./routes/rendezvous'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));

app.use((req, res) => res.status(404).json({ message: 'Route introuvable' }));
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  res.status(500).json({ message: 'Erreur serveur' });
});

const PORT = process.env.PORT || 3000;
connectDB()
  .then(() => app.listen(PORT, () => console.log(`API sur http://localhost:${PORT}/api`)))
  .catch((e) => { console.error('Connexion MongoDB impossible :', e.message); process.exit(1); });
