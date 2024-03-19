const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const emailVerificationCodesSchema = new Schema({
    email: { type: String, required: true, unique: true },
    code: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600000 } // Expires in 10 minutes
});

const EmailVerificationCodes = mongoose.model('EmailVerificationCode', emailVerificationCodesSchema);

module.exports = EmailVerificationCodes;