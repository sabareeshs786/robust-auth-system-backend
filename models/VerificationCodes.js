const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VerificationCodesSchema = new Schema({
    userid: { type: Number, required: true, unique: true },
    code: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 } // Expires in 10 minutes
});

const VerificationCodes = mongoose.model('VerificationCode', VerificationCodesSchema);

module.exports = VerificationCodes;