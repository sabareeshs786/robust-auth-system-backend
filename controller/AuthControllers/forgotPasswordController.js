const User = require('../../models/User');
const FPasswordVerificationCodes = require('../../models/FPasswordVC');
const { res500 } = require('../../utils/errorResponse');
const { generateVerificationCode } = require('../../utils/utilFunctions');
const { sendEmail } = require('../../utils/emailSender');
const { errorLogger } = require('../../middleware/errorHandler');

const handleForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({message: "Invalid email id"});

        const foundUser = await User.findOne({ email: email }).exec();
        if (!foundUser) return res.status(401).json({message: "User not found"});

        // Send verification code
        const code = generateVerificationCode();
        const isSent = await sendEmail(email, "Verification code to reset password", `The code to reset the password is ${code}`);

        if(!isSent)
            throw {code: 401, message: "Can't send email"};

        await FPasswordVerificationCodes.findOneAndDelete({ email });
        await FPasswordVerificationCodes.create([{
            "email": email,
            "code": code
        }]);
        return res.status(200).json({message: "Verification code is sent to your email address"});
    }
    catch (err) {
        errorLogger(err);
        return res500(res);
    }
}

module.exports = { handleForgotPassword };