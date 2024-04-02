const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const forgotPasswordVerificationCodesSchema = new Schema({
    userid: { type: Number, required: true, unique: true },
    code: { type: String, required: true },
    verified: {type: Boolean, default: false},
    createdAt: { type: Date, default: Date.now, expires: 600000 } // Expires in 10 minutes
});

const ForgotPasswordVerificationCodes = mongoose.model('ForgotPasswordVerificationCode', forgotPasswordVerificationCodesSchema);

module.exports = ForgotPasswordVerificationCodes;