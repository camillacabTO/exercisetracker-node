const mongoose = require('mongoose');
const { Schema } = mongoose;

const exerciseSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Exercise', exerciseSchema);
