require('dotenv').config();
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const User = require('../../models/User');
const MfaVerificationCodes = require('../../models/MfaVerificationCodes');

const { encrypt, decrypt } = require('../../utils/cryptoFunctions');
const { res500 } = require('../../utils/errorResponse');
const { generateVerificationCode, isValidCode } = require('../../utils/utilFunctions');
const { errorLogger } = require('../../middleware/errorHandler');
const { sendEmail } = require('../../utils/emailSender');
const { sendSms } = require('../../utils/smsSender');
const key = Buffer.from(process.env.MFA_SECRET_KEY, 'base64');
const iv = Buffer.from(process.env.MFA_SECRET_IV, 'base64');

const handleEnableMfaRequest = async (req, res) => {
    try {
        const userid = req.userid;
        const { authMethod } = req.body;
        const authMethods = ["email", "phno", "authApp"];
        if (!Number.isInteger(userid) || !authMethod || !authMethods.includes(authMethod)) 
            return res.status(400).json({ "message": 'Invalid input data' });

        const user = await User.findOne({ userid }).exec();
        if(!user) return res.status(400).json({message: "Invalid user id"});

        if(authMethod === "authApp"){
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
        if(authMethod === "email"){
            if(!user?.verifiedEmail) return res.status(400).json({message: "There is no verified email address in your account"});
            const code = generateVerificationCode();
            const isSent = await sendEmail(user.email, "Verification code", `Your 2-factor verification code is ${code}`);
            if(!isSent)
                throw {code: 401, message: "Can't send verification code to your email address"};
            await MfaVerificationCodes.findOneAndUpdate(
                { userid },
                { $set: { userid, code } },
                { upsert: true, new: true }
            ).exec();
            return res.status(200).json({message: "Verification code sent successfully"});
        }
        if(authMethod === "phno"){
            if(!user?.verifiedPhno) return res.status(400).json({message: "There is no verified phone number in your account"});
            const code = generateVerificationCode();
            const phno = user.phno.replace(/\s/g, '');
            const isSent = await sendSms(phno, `Your 2-factor verification code is ${code}`);
            if(!isSent){
                throw {code: 401, message: "Can't send SMS"};
            }
            await MfaVerificationCodes.findOneAndUpdate(
                { userid },
                { $set: { userid, code, forEmail: false } },
                { upsert: true, new: true }
            ).exec();
            return res.status(200).json({message: "Verification code sent successfully"});
        }
    } catch (err) {
        errorLogger(err);
        return res.status(err?.code || 500).json({message: err?.message || "Internal server error"});
    }
}

const handleEnableMfa = async (req, res) => {
    try {
        const userid = req.userid;
        const { authMethod, code } = req.body;
        const authMethods = ["email", "phno", "authApp"];
        if (!Number.isInteger(userid) || !authMethod || !authMethods.includes(authMethod) || !isValidCode(code) ) 
            return res.status(400).json({ "message": 'Invalid input data' });

        const user = await User.findOne({ userid }).exec();
        if(!user) return res.status(400).json({message: "Invalid user id"});

        if(authMethod === "authApp"){
            const encryptedSecret = user.secret;
            if(!encryptedSecret) return res.status(400).json({message: "Invalid request"});
            const secret = decrypt(encryptedSecret, key, iv);
            const verified = speakeasy.totp.verify({
                secret: secret,
                encoding: 'base32',
                token: code,
                window: 1 // Allow a time window of 1 interval in each direction
            });
            if (verified) {
                user.mfa = true;
                await user.save();
                res.status(200).json({ message: 'MFA enabled successfully' });
            } else {
                res.status(401).json({ message: 'Invalid verification code entered' });
            }
        }
        if(authMethod === "email"){
            const vc = await MfaVerificationCodes.findOne({userid}).exec();
            if(!vc?.forEmail) return res.status(400).json({message: "Invalid request"});
            if(vc.code !== code) return res.status(400).json({message: "Invalid code entered"});
            user.mfa = true;
            await user.save();
            await MfaVerificationCodes.deleteOne({userid});
            res.status(200).json({message: "MFA enabled successfully"});
        }
        if(authMethod === "phno"){
            const vc = await MfaVerificationCodes.findOne({userid}).exec();
            if(!vc || vc?.forEmail) return res.status(400).json({message: "Invalid request"});
            if(vc.code !== code) return res.status(400).json({message: "Invalid code entered"});
            user.mfa = true;
            await user.save();
            await MfaVerificationCodes.deleteOne({userid});
            res.status(200).json({message: "MFA enabled successfully"});
        }
    } catch (err) {
        errorLogger(err);
        return res.status(500).json({message: "Internal server error"});
    }
}

const handleSendMFACode = async (req, res) => {
    const { emailPhno, code } = req.body;
    
}

const handleVerifyMfa = async (req, res) => {
    const { emailPhno, code } = req.body;
    const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: code,
        window: 1 // Allow a time window of 1 interval in each direction
    });
    if (verified) {
        res.json({ message: 'OTP is valid' });
    } else {
        res.status(401).json({ message: 'Invalid OTP' });
    }
}

const handleDisableMfa = async (req, res) => {
    try {
        const userid = req.userid;
        const user = await User.findOne({userid}).exec();
        user.mfa = false;
        user.secret = '';
        await user.save();
        return res.status(200).json({message: "MFA disabled successfully"});
    } catch (err) {
        errorLogger(err);
        return res.status(500).json({message: "Internal server error"});
    }
}

module.exports = { handleEnableMfaRequest, handleEnableMfa, handleSendMFACode, handleVerifyMfa, handleDisableMfa };