const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  username: { type: String, required: true },
});

userSchema.set('toJSON', {
  // virtuals: true,
  // versionKey: false,
});

module.exports = mongoose.model('User', userSchema);
