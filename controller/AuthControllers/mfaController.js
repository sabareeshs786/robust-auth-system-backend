require('dotenv').config();
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const User = require('../../models/User');
const VerificationCodes = require('../../models/VerificationCodes');

const { encrypt, decrypt } = require('../../utils/cryptoFunctions');
const { res500 } = require('../../utils/errorResponse');
const { generateVerificationCode } = require('../../utils/utilFunctions');
const { errorLogger } = require('../../middleware/errorHandler');
const { sendEmail } = require('../../utils/emailSender');
const { sendSms } = require('../../utils/smsSender');

const handleEnableMfaRequest = async (req, res) => {
    try {
        const userid = req.userid;
        const { mode } = req.body;
        const key = Buffer.from(process.env.MFA_SECRET_KEY, 'base64');
        const iv = Buffer.from(process.env.MFA_SECRET_IV, 'base64');
        // const decrypted = decrypt(encrypted, key, iv);
        const user = await User.findOne({ userid }).exec();
        const modes = ["email", "phno", "authApp"];
        if(!modes.includes(mode)) return res.status(400).json({message: "Invalid input data"});
        if(mode === "authApp"){
                const secret = speakeasy.generateSecret({ name:"ras.app", length: 20 });
                QRCode.toDataURL(secret.otpauth_url, async (err, data_url) => {
                if (err) {
                    res.status(500).json({ message: 'Failed to generate QR code' });
                    return;
                }
                const encryptedSecret = encrypt(secret.base32, key, iv);
                user.secret = encryptedSecret;
                const result = await user.save();
                if(!result) return res500(res);
                res.status(200).json({ secret: secret.base32, qrCodeUrl: data_url });
                return;
            });
            return;
        }
        if(mode === "email"){
            if(!user?.verifiedEmail) return res.status(400).json({message: "There is no verified email address in your account"});
            const code = generateVerificationCode();
            const isSent = await sendEmail(user.email, subject, `Your 2-factor verification code is ${code}`);
            if(!isSent)
                throw {code: 401, message: "Can't send email"};
            await VerificationCodes.findOneAndUpdate(
                { userid },
                { $set: { userid, code, mfa: true } },
                { upsert: true, new: true }
            ).exec();
            return res.status(200).json({message: "Verification code sent successfully"});
        }
        if(mode === "phno"){
            if(!user?.verifiedPhno) return res.status(400).json({message: "There is no verified phone number in your account"});
            const code = generateVerificationCode();
            const phno = user.phno.replace(/\s/g, '');
            const result = await sendSms(phno, `Your 2-factor verification code is ${code}`);
            if(!result){
                throw {code: 401, message: "Can't send SMS"};
            }
        }

    } catch (err) {
        errorLogger(err);
        return res.status(err?.code || 500).json({message: err?.message || "Internal server error"});
    }
    
}

const handleEnableMfa = async (req, res) => {
    const {} = req.body;
    const key = Buffer.from(process.env.MFA_SECRET_KEY, 'base64');
    const iv = Buffer.from(process.env.MFA_SECRET_IV, 'base64');

    const plainText = 'This is a secret message';
    const encrypted = encrypt(plainText, key, iv);

    const decrypted = decrypt(encrypted, key, iv);
    
}

const handleVerifyMfa = async (req, res) => {
    // const { secret, otp } = req.body;
    // const verified = speakeasy.totp.verify({
    //     secret: secret,
    //     encoding: 'base32',
    //     token: otp,
    //     window: 1 // Allow a time window of 1 interval in each direction
    // });
    // if (verified) {
    //     res.json({ message: 'OTP is valid' });
    // } else {
    //     res.status(401).json({ message: 'Invalid OTP' });
    // }
}

const handleDisableMfa = async (req, res) => {

}

module.exports = { handleEnableMfaRequest, handleEnableMfa, handleVerifyMfa, handleDisableMfa };