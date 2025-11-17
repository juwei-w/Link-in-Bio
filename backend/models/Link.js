const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LinkSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  iconUrl: { type: String },
  order: { type: Number, default: 0 },
  position: { type: Number, default: 0 }, // Keep for backwards compatibility
  clicks: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Link', LinkSchema);
