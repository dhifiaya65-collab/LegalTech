const mongoose = require('mongoose');

module.exports = async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/legaltech';
  await mongoose.connect(uri);
  console.log('MongoDB connecte :', mongoose.connection.name);
};
