const User = require('../../models/User');
const FPasswordVerificationCodes = require('../../models/FPasswordVC');
const { res500 } = require('../../utils/errorResponse');
const { generateVerificationCode, getField } = require('../../utils/utilFunctions');
const { sendEmail } = require('../../utils/emailSender');
const { errorLogger } = require('../../middleware/errorHandler');

const handleForgotPassword = async (req, res) => {
    try {
        const { emailPhno } = req.body;
        if (!emailPhno) return res.status(400).json({message: "Invalid input data"});

        const field = getField(emailPhno);
        if(!field) return res.status(400).json({message: "Invalid input data"});
        
        const foundUser = await User.findOne({ [field]: emailPhno }).exec();
        if (!foundUser) return res.status(200).json({message: "Verification code is sent"});

        const userid = foundUser.userid;

        // Send verification code
        const code = generateVerificationCode();
        const text = "The code to reset the password is ";
        if(field === "email"){
            const isSent = await sendEmail(emailPhno, "Verification code to reset password", `${text}${code}`);
            if(!isSent)
                throw {code: 401, message: "Can't send email"};
        }
        else{
            const phno = emailPhno.replace(/\s/g, '');
            const result = await sendSms(phno, `${text}${code}`);
            if(!result){
                throw {code: 401, message: "Can't send SMS"};
            }
        }

        await FPasswordVerificationCodes.findOneAndDelete({ userid });
        await FPasswordVerificationCodes.create([{
            "userid": userid,
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