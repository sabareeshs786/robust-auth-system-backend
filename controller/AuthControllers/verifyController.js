const User = require('../../models/User');
const Profile = require('../../models/Profile');
const EmailVerificationCodes = require('../../models/VerificationCodes');
const FPasswordVerificationCodes = require('../../models/FPasswordVC');

const mongoose = require('mongoose');
const { generateVerificationCode } = require('../../utils/utilFunctions');
const { sendEmail } = require('../../utils/emailSender');
const { errorLogger } = require('../../middleware/errorHandler');
const { successLog } = require('../../middleware/logEvents');

const handleEmailVerification = async (req, res) => {
    const session = await mongoose.startSession();
    await session.startTransaction();

    try {
        const email = req.body?.email;
        const code = req.body?.code;
        if(!email || !code) throw {code: 400, message: "Invalid email id or verification code"};

        const result = await EmailVerificationCodes.findOne({email}).exec();
        const user = await User.findOne({email}).exec();

        if(!user)
            throw {code: 400, message: "Invalid email id"};
        if(user.verified)
            throw {code: 200, message: "Email already verified"};
        if(!result)
            throw {code: 400, message: "Verification code expired"};

        const userid = user.userid;

        if(result?.code === code){
            const updateduser = await User.updateOne(
                { userid },
                {   
                    $set: {
                        verified: true
                    }
                },
                { session }
            ).exec();

            const profile = await Profile.create([{
                userid,
            }], { session });
            
            const emailVerification = await EmailVerificationCodes.deleteOne({email});

            await session.commitTransaction();
            res.status(201).json({ message: `Email verified successfully` });
        }
        else
            throw {code: 400, message: "Invalid verification code entered"};

    } catch (err) {
        await session.abortTransaction();
        errorLogger(err);
        if(err.code && err.message)
            res.status(err.code).json({'message': err.message});
        else
            res.status(500).json({ 'message': "Internal server error occurred!!!\n Try again later" });
    }
    finally{
        if (session) {
            session.endSession();
        }
    }
}

const handleForgotPasswordCode = async (req, res) => {
    try {
        const email = req.body?.email;
        const code = req.body?.code;
        if(!email || !code) return res.status(400).json({message: "Invalid email id or verification code"});

        const user = await User.findOne({email}).exec();
        if(!user) return res.status(400).json({message: "Invalid email address entered"});
        const result = await FPasswordVerificationCodes.findOne({email}).exec();
        if(!result) return res.status(400).json({message: "Verification code expired"});

        if(result?.code === code){
            await FPasswordVerificationCodes.updateOne({email}, {
                $set: {
                    verified: true
                }
            }).exec();
            return res.status(200).json({message: "Verification successful"});
        }
        else{
            return res.status(400).json({message: "Invalid verification code"});
        }

    } catch (err) {
        errorLogger(err);
        return res.status(500).json({message: "Internal server error"});
    }    
}

const handleResendVC = async (req, res) => {
    const email = req.body?.email;
    const purpose = req.body?.purpose;
    try {
        const purposes = ["email", "password"];
        if(!email || !purpose || !purposes.includes(purpose)) return res.status(400).json({message: "Invalid input data"});

        const user = await User.findOne({email}).exec();
        if(!user) return res.status(400).json({message: "Invalid email address entered"});

        let verCodeCollection;
        let subject, text;
        if(purpose === "email"){
            if(user.verified) return res.status(200).json({message: "Email id already verified"});
            verCodeCollection = EmailVerificationCodes;
            subject = "Verification code";
            text = "Your email verification code is";
        }
        else{
            verCodeCollection = FPasswordVerificationCodes;
            subject = "Verification code to reset password";
            text = "The code to reset the password is";
        }

        const result = await verCodeCollection.findOneAndDelete({ email });
        if (result) {
            successLog('Document deleted successfully');
        } else {
            successLog('Document not found');
        }

        // Generate new verification code
        const code = generateVerificationCode();
        const isSent = await sendEmail(email, subject, `${text} ${code}`);

        if(!isSent)
            throw {message: "Can't send email"};

        await verCodeCollection.create([{
            "email": email,
            "code": code
        }]);

        return res.status(200).json({message: "Verification code sent successfully"});

    } catch (err) {
        errorLogger(err);
        return res.status(500).json({ 'message': "Internal server error occurred!!!\n Try again later" });
    }
}

module.exports = { handleEmailVerification, handleForgotPasswordCode, handleResendVC };