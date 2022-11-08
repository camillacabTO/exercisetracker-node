const mongoose = require('mongoose');
const { Schema } = mongoose;

const exerciseSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Number },
});

// exerciseSchema.pre('save', (next) => {
//   let ex = this;
//   ex.date = Date.now().toString();
//   next();
// });

exerciseSchema.pre('save', function (next) {
  let now = new Date().getTime();
  if (!this.date) {
    this.date = now;
  }
  next();
});

module.exports = mongoose.model('Exercise', exerciseSchema);
