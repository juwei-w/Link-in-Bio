const mongoose = require('mongoose');
const logger = console;

async function connect(uri) {
  if (!uri) throw new Error('MONGODB_URI not provided');
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.log('Connected to MongoDB');
  } catch (err) {
    logger.error('MongoDB connection error:', err.message);
    throw err;
  }
}

module.exports = { connect };
