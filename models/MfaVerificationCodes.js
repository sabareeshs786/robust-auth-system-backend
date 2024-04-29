const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MfaVerificationCodesSchema = new Schema({
    userid: { type: Number, required: true, unique: true },
    code: { type: String, required: true },
    sentTo: {type: String, enum: ['email', 'phno'], default: "email"},
    purpose : {type: String, enum: ['enable', 'disable', 'verify'], required: true},
    createdAt: { type: Date, default: Date.now, expires: 600 } // Expires in 10 minutes
});

const MfaVerificationCodes = mongoose.model('MfaVerificationCode', MfaVerificationCodesSchema);

module.exports = MfaVerificationCodes;