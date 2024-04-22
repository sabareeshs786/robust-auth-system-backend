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
    required: function() {
      return !this.phno || this.phno.length === 0;
    },
    unique: true,
    sparse: true
  },
  phno: {
    type: String, // +country_code phone_number
    required: function() {
      return !this.email || this.email.length === 0;
    },
    unique: true,
    sparse: true
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
  verifiedEmail:{
    type: Boolean,
    default: false,
    required: true
  },
  verifiedPhno: {
    type: Boolean,
    default: false,
    required: true
  },
  mfa : {
    type: Boolean,
    default: false,
    required: true
  },
  secret : {
    type: String,
    default: ""
  },
  superadmin: {
    type: Boolean,
    required: false
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;