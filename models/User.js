const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  userid: {
    type: Number,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  roles: {
    User: {
      type: Number,
      default: 2001345
    },
    Editor: Number,
    Admin: Number
  },
  password: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
  },
  verified:{
    type: Boolean,
    default: false,
    required: true
  },
  superadmin: {
    type: Boolean,
    required: false
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;