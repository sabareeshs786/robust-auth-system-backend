require('dotenv').config();
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const User = require('../../models/User');
const MfaVerificationCodes = require('../../models/MfaVerificationCodes');

const { encrypt, decrypt } = require('../../utils/cryptoFunctions');
const { res500 } = require('../../utils/errorResponse');
const { generateVerificationCode, isValidCode, getField } = require('../../utils/utilFunctions');
const { errorLogger } = require('../../middleware/errorHandler');
const { sendEmail } = require('../../utils/emailSender');
const { sendSms } = require('../../utils/smsSender');
const { getAccessToken, getRefreshToken } = require('../../utils/getTokens');
const key = Buffer.from(process.env.MFA_SECRET_KEY, 'base64');
const iv = Buffer.from(process.env.MFA_SECRET_IV, 'base64');
const authMethods = ["email", "phno", "authApp"];

const handleEnableMfaRequest = async (req, res) => {
    try {
        const userid = req.userid;
        const { authMethod } = req.body;
        
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
                res.status(200).json({ qrCodeUrl: data_url });
                return;
            });
            return;
        }
        if(authMethod === "email"){
            if(!user?.verifiedEmail) return res.status(400).json({message: "There is no verified email address in your account"});
            const code = generateVerificationCode();
            const isSent = await sendEmail(user.email, "Verification code to enable 2-factor authentication", `Your verification code to enable 2-factor authentication is ${code}`);
            if(!isSent)
                throw {code: 401, message: "Can't send verification code to your email address"};
            await MfaVerificationCodes.findOneAndUpdate(
                { userid },
                { $set: { userid, code, purpose: "enable" } },
                { upsert: true, new: true }
            ).exec();
            return res.status(200).json({message: "Verification code sent successfully"});
        }
        if(authMethod === "phno"){
            if(!user?.verifiedPhno) return res.status(400).json({message: "There is no verified phone number in your account"});
            const code = generateVerificationCode();
            const phno = user.phno.replace(/\s/g, '');
            const isSent = await sendSms(phno, `Your verification code to enable 2-factor authentication is ${code}`);
            if(!isSent){
                throw {code: 401, message: "Can't send SMS"};
            }
            await MfaVerificationCodes.findOneAndUpdate(
                { userid },
                { $set: { userid, code, sentTo: "phno", purpose: "enable" } },
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
                return res.status(200).json({ message: 'MFA enabled successfully' });
            } else {
                return res.status(401).json({ message: 'Invalid verification code entered' });
            }
        }
        const vc = await MfaVerificationCodes.findOne({userid}).exec();
        if(!vc || vc.sentTo !== authMethod) return res.status(400).json({message: "Invalid request"});
        if(vc.purpose !== "enable") return res.status(400).json({message: "Invalid request"});
        if(vc.code !== code) return res.status(400).json({message: "Invalid code entered"});
        user.mfa = true;
        await user.save();
        await MfaVerificationCodes.deleteOne({userid});
        return res.status(200).json({message: "MFA enabled successfully"});
    } catch (err) {
        errorLogger(err);
        return res.status(500).json({message: "Internal server error"});
    }
}

const handleResendEnableMFACode = async (req, res) => {
    try {
        const userid = req.userid;
        const { authMethod } = req.body;

        if (!Number.isInteger(userid) || !authMethod || !authMethods.includes(authMethod)) 
            return res.status(400).json({ "message": 'Invalid input data' });

        const user = await User.findOne({ userid }).exec();
        if(!user) return res.status(400).json({message: "Invalid user id"});

        const vc = await MfaVerificationCodes.findOne({userid}).exec();
        if(!vc || vc.purpose !== "enable") return res.status(400).json({message: "Enable request is not received yet"});

        if(authMethod === "email"){
            if(!user?.verifiedEmail) return res.status(400).json({message: "There is no verified email address in your account"});
            if(vc.sentTo !== "email") return res.status(400).json({message: "Invalid request"});
            const code = generateVerificationCode();
            const isSent = await sendEmail(user.email, "Verification code to enable 2-factor authentication", `Your verification code to enable 2-factor authentication is ${code}`);
            if(!isSent)
                throw {code: 401, message: "Can't send verification code to your email address"};
            await MfaVerificationCodes.findOneAndUpdate(
                { userid },
                { $set: { userid, code, purpose: "enable" } },
                { upsert: true, new: true }
            ).exec();
            return res.status(200).json({message: "Verification code sent successfully"});
        }
        if(authMethod === "phno"){
            if(!user?.verifiedPhno) return res.status(400).json({message: "There is no verified phone number in your account"});
            if(vc.sentTo !== "phno") return res.status(400).json({message: "Invalid request"});
            const code = generateVerificationCode();
            const phno = user.phno.replace(/\s/g, '');
            const isSent = await sendSms(phno, `Your verification code to enable 2-factor authentication is ${code}`);
            if(!isSent){
                throw {code: 401, message: "Can't send SMS"};
            }
            await MfaVerificationCodes.findOneAndUpdate(
                { userid },
                { $set: { userid, code, sentTo: "phno", purpose: "enable" } },
                { upsert: true, new: true }
            ).exec();
            return res.status(200).json({message: "Verification code sent successfully"});
        }
    } catch (err) {
        errorLogger(err);
        res.status(500).json({message: "Internal server error"});
    }
}

const handleResendMFACode = async (req, res) => {
    const { emailPhno } = req.body;
    if(!emailPhno) return res.status(400).json({message: "Invalid input data"});

    const field = getField(emailPhno);

    const user = await User.findOne({ [field] : emailPhno }).exec();
    const userid = user.userid;
    if(!user) return res.status(400).json({message: "User doesn't exist"});
    if(!user?.mfa) return res.status(400).json({message: "MFA is not enabled"});

    const vc = await MfaVerificationCodes.findOne({userid}).exec();
    if(!vc || vc.purpose !== "verify") return res.status(400).json({message: "Invalid request"});
    
    if(field === "email"){
        if(!user?.verifiedEmail) return res.status(400).json({message: "There is no verified email address in your account"});
        if(vc.sentTo !== "email") return res.status(400).json({message: "Invalid request"});
        const code = generateVerificationCode();
        const isSent = await sendEmail(user.email, "Verification code to login", `Your 2-factor verification code is ${code}`);
        if(!isSent)
            throw {code: 401, message: "Can't send verification code to your email address"};
        await MfaVerificationCodes.findOneAndUpdate(
            { userid },
            { $set: { userid, code, purpose: "verify" } },
            { upsert: true, new: true }
        ).exec();
        return res.status(200).json({message: "Verification code sent successfully"});
    }
    if(field === "phno"){
        if(!user?.verifiedPhno) return res.status(400).json({message: "There is no verified phone number in your account"});
        if(vc.sentTo !== "phno") return res.status(400).json({message: "Invalid request"});
        const code = generateVerificationCode();
        const phno = user.phno.replace(/\s/g, '');
        const isSent = await sendSms(phno, `Your 2-factor verification code is ${code}`);
        if(!isSent){
            throw {code: 401, message: "Can't send SMS"};
        }
        await MfaVerificationCodes.findOneAndUpdate(
            { userid },
            { $set: { userid, code, sentTo: "phno", purpose: "verify" } },
            { upsert: true, new: true }
        ).exec();
        return res.status(200).json({message: "Verification code sent successfully"});
    }
}

const handleVerifyMfa = async (req, res) => {
    try {
        const { authMethod, emailPhno, code } = req.body;
        if(!code || !isValidCode(code) || !authMethod || !authMethods.includes(authMethod) || !emailPhno) return res.status(400).json({message: "Invalid input data"});
        const field = getField(emailPhno);
        
        const user = await User.findOne({ [field]: emailPhno }).exec();
        const userid = user.userid;
        if(!user) return res.status(400).json({message: "User doesn't exist"});
        if(!user.mfa) return res.status(400).json({message: "MFA is not enabled"});

        if(authMethod === "authApp"){
            const encryptedSecret = user.secret;
            if(!encryptedSecret) return res.status(400).json({message: "Invalid request"});
            const secret = decrypt(encryptedSecret, key, iv);
            const verified = speakeasy.totp.verify({
                secret: secret,
                encoding: 'base32',
                token: code,
                window: 1
            });
            if (!verified) return res.status(401).json({ message: 'Invalid verification code entered' });
        }
        else if(authMethod === "email"){
            if(!user.verifiedEmail) return res.status(400).json({message: "Email id is not verified"});
            const vc = await MfaVerificationCodes.findOne({userid}).exec();
            if(!vc || vc.sentTo !== "email" || vc.purpose !== "verify") return res.status(400).json({message: "Invalid request"});
            if(vc.code !== code) return res.status(400).json({message: "Invalid code entered"});
            await MfaVerificationCodes.deleteOne({userid});
        }
        else if(authMethod === "phno"){
            if(!user.verifiedPhno) return res.status(400).json({message: "Phone number is not verified"});
            const vc = await MfaVerificationCodes.findOne({userid}).exec();
            if(!vc || vc.sentTo !== "phno" || vc.purpose !== "verify") return res.status(400).json({message: "Invalid request"});
            if(vc.code !== code) return res.status(400).json({message: "Invalid code entered"});
            await MfaVerificationCodes.deleteOne({userid});
        }

        const roles = Object.values(user.roles).filter(Boolean);

        const accessToken = getAccessToken(user.userid, roles);

        const refreshToken = getRefreshToken(user.userid);
        user.refreshToken = refreshToken;
        const result = await user.save();
        if (!result) return res500(res);

        res.cookie('jwt', refreshToken, { httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000 });
        res.json({ roles, accessToken });
    } catch (err) {
        errorLogger(err);
        return res.status(500).json({message: "Internal server error"});
    }
}

const handleDisableMfaRequest = async (req, res) => {
    try {
        const userid = req.userid;

        if (!Number.isInteger(userid)) 
            return res.status(400).json({ "message": 'Invalid input data' });

        const user = await User.findOne({ userid }).exec();
        if(!user) return res.status(400).json({message: "Invalid user id"});

        if(user?.verifiedEmail){
            const code = generateVerificationCode();
            const isSent = await sendEmail(user.email, "Verification code to disable 2-factor authentication", `Your verification code to disable 2-factor authentication is ${code}`);
            if(!isSent)
                throw {code: 401, message: "Can't send verification code to your email address"};
            await MfaVerificationCodes.findOneAndUpdate(
                { userid },
                { $set: { userid, code, purpose: "disable" } },
                { upsert: true, new: true }
            ).exec();
            return res.status(200).json({message: "Verification code sent successfully", codeSentTo: "email"});
        }
        if(user?.verifiedPhno){
            const code = generateVerificationCode();
            const phno = user.phno.replace(/\s/g, '');
            const isSent = await sendSms(phno, `Your verification code to disable 2-factor authentication is ${code}`);
            if(!isSent){
                throw {code: 401, message: "Can't send SMS"};
            }
            await MfaVerificationCodes.findOneAndUpdate(
                { userid },
                { $set: { userid, code, sentTo: "phno", purpose: "disable" } },
                { upsert: true, new: true }
            ).exec();
            return res.status(200).json({message: "Verification code sent successfully", codeSentTo: "phno"});
        }
        return res.status(400).json({message: "No verified email address or phone number"});
    } catch (err) {
        errorLogger(err);
        return res.status(err?.code || 500).json({message: err?.message || "Internal server error"});
    }
}

const handleDisableMfa = async (req, res) => {
    try {
        const userid = req.userid;
        const {codeSentTo, code} = req.body;
        if(!codeSentTo || !["email", "phno"].includes(codeSentTo) || !code || !isValidCode(code)) return res.status(400).json({message: "Invalid input data"});

        const user = await User.findOne({userid}).exec();
        if(!user) return res.status(400).json({message: "Invalid user id"});
        
        const vc = await MfaVerificationCodes.findOne({userid}).exec();
        if(!vc || vc.sentTo !== codeSentTo || vc.purpose !== "disable") return res.status(400).json({message: "Invalid request"});
        if(vc.code !== code) return res.status(400).json({message: "Invalid verification code entered"});
        
        user.mfa = false;
        user.secret = '';
        await user.save();
        await MfaVerificationCodes.deleteOne({userid});
        return res.status(200).json({message: "MFA disabled successfully"});
    } catch (err) {
        errorLogger(err);
        return res.status(500).json({message: "Internal server error"});
    }
}

const handleResendDisableMFACode = async (req, res) => {
    try {
        const userid = req.userid;
        const { codeSentTo } = req.body;

        if (!Number.isInteger(userid) || !codeSentTo || !['email', 'phno'].includes(codeSentTo)) 
            return res.status(400).json({ "message": 'Invalid input data' });

        const user = await User.findOne({ userid }).exec();
        if(!user) return res.status(400).json({message: "Invalid user id"});

        const vc = await MfaVerificationCodes.findOne({userid}).exec();
        if(!vc || vc.purpose !== "disable") return res.status(400).json({message: "Disable request is not received yet"});
        if(vc.sentTo !== codeSentTo) return res.status(400).json({message: "Invalid input data"});

        if(codeSentTo === "email"){
            if(!user?.verifiedEmail) return res.status(400).json({message: "There is no verified email address in your account"});
            const code = generateVerificationCode();
            const isSent = await sendEmail(user.email, "Verification code to disable 2-factor authentication", `Your verification code to disable 2-factor authentication is ${code}`);
            if(!isSent)
                throw {code: 401, message: "Can't send verification code to your email address"};
            await MfaVerificationCodes.findOneAndUpdate(
                { userid },
                { $set: { userid, code, purpose: "disable" } },
                { upsert: true, new: true }
            ).exec();
            return res.status(200).json({message: "Verification code sent successfully"});
        }
        if(codeSentTo === "phno"){
            if(!user?.verifiedPhno) return res.status(400).json({message: "There is no verified phone number in your account"});
            const code = generateVerificationCode();
            const phno = user.phno.replace(/\s/g, '');
            const isSent = await sendSms(phno, `Your verification code to disable 2-factor authentication is ${code}`);
            if(!isSent){
                throw {code: 401, message: "Can't send SMS"};
            }
            await MfaVerificationCodes.findOneAndUpdate(
                { userid },
                { $set: { userid, code, sentTo: "phno", purpose: "disable" } },
                { upsert: true, new: true }
            ).exec();
            return res.status(200).json({message: "Verification code sent successfully"});
        }
        return res.status(400).json({message: "Invalid request sent"});
    } catch (err) {
        errorLogger(err);
        res.status(500).json({message: "Internal server error"});
    }
}

module.exports = { handleEnableMfaRequest, handleEnableMfa, handleResendEnableMFACode, handleResendMFACode, handleVerifyMfa, handleDisableMfaRequest, handleDisableMfa, handleResendDisableMFACode };