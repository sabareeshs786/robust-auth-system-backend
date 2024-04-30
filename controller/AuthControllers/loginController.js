const User = require('../../models/User');
const bcrypt = require('bcrypt');
const { getAccessToken, getRefreshToken } = require('../../utils/getTokens');
const { res500 } = require('../../utils/errorResponse');
const { getField, generateVerificationCode } = require('../../utils/utilFunctions');
const { errorLogger } = require('../../middleware/errorHandler');
const MfaVerificationCodes = require('../../models/MfaVerificationCodes');
const { sendEmail } = require('../../utils/emailSender');
const { sendSms } = require('../../utils/smsSender');

const handleLogin = async (req, res) => {
    try {
        const { emailPhno, pwd } = req.body;
        if (!emailPhno || !pwd) return res.status(400).json({message: "Invalid Email id or password entered"});

        const field = getField(emailPhno);
        const INVALID_USER = {message: `Invalid ${field === 'email' ? "Email id": "Phone number"} or password entered`};
        if(!field) return res.status(400).json(INVALID_USER);

        const foundUser = await User.findOne({ [field]: emailPhno }).exec();
        if (!foundUser) return res.status(401).json(INVALID_USER);
        const userid = foundUser.userid;

        const match = await bcrypt.compare(pwd, foundUser.password);
        if (!match) return res.status(401).json(INVALID_USER);
        const verified = field === "email" ? foundUser.verifiedEmail : foundUser.verifiedPhno;
        if(!verified) return res.status(401).json({message: "Email id is not verified"});
        if(foundUser.mfa) {
            if(foundUser.secret !== '') return res.status(200).json({message: "Verify your identity", verifyThrough: "authApp"});
            if(foundUser.verifiedEmail) {
                const code = generateVerificationCode();
                const isSent = await sendEmail(foundUser.email, "Verification code to login", `Your 2-factor verification code is ${code}`);
                if(!isSent)
                    throw {code: 401, message: "Can't send verification code to your email address"};
                await MfaVerificationCodes.findOneAndUpdate(
                    { userid },
                    { $set: { userid, code, purpose: "verify" } },
                    { upsert: true, new: true }
                ).exec();
                return res.status(200).json({message: "Verify your identity", verifyThrough: "email"})
            }
            if(foundUser.verifiedPhno){
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
                return res.status(200).json({message: "Verify your identity", verifyThrough: "phno"});
            }
        }
        else{
            const roles = Object.values(foundUser.roles).filter(Boolean);

            const accessToken = getAccessToken(foundUser.userid, roles);

            const refreshToken = getRefreshToken(foundUser.userid);
            foundUser.refreshToken = refreshToken;
            const result = await foundUser.save();
            if (!result) return res500(res);

            res.cookie('jwt', refreshToken, { httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000 });
            res.json({ roles, accessToken });
        }
    }
    catch (err) {
        errorLogger(err);
        return res500(res);
    }

}

module.exports = { handleLogin };