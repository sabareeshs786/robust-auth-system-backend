const User = require('../../models/User');
const Profile = require('../../models/Profile');
const VerificationCodes = require('../../models/VerificationCodes');
const FPasswordVerificationCodes = require('../../models/FPasswordVC');

const mongoose = require('mongoose');
const { generateVerificationCode, getField } = require('../../utils/utilFunctions');
const { sendEmail } = require('../../utils/emailSender');
const { errorLogger } = require('../../middleware/errorHandler');
const { successLog } = require('../../middleware/logEvents');

const handleVerification = async (req, res) => {
    const session = await mongoose.startSession();
    await session.startTransaction();

    try {
        const {emailPhno, code} = req.body;
        if(!emailPhno || !code) throw {code: 400, message: "Invalid input data"};

        const field = getField(emailPhno);
        if(!field) return res.status(400).json({message: "Invalid input data"});

        const user = await User.findOne({[field] : emailPhno}).exec();
        if(!user)
            throw {code: 401, message: "User not found"};
        const verified = field === "email" ? user.verifiedEmail : user.verifiedPhno;
        if(verified)
            throw {code: 200, message: `${field === "email" ? "Email id" : "Phone number"} already verified`};

        const userid = user.userid;
        const result = await VerificationCodes.findOne({userid}).exec();
        if(!result)
            throw {code: 400, message: "Verification code expired"};

        const verifiedField = field === "email" ? "verifiedEmail": "verifiedPhno";
        if(result?.code === code){
            await User.updateOne(
                { userid },
                {   
                    $set: {
                        [verifiedField]: true
                    }
                },
                { session }
            ).exec();

            await Profile.create([{
                userid,
            }], { session });
            
            await VerificationCodes.deleteOne({userid});

            await session.commitTransaction();
            res.status(201).json({ message: `${field === "email" ? "Email id" : "Phone number"} verified successfully` });
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
        const {emailPhno, code} = req.body;
        if(!emailPhno || !code) return res.status(400).json({message: "Invalid input data"});

        const field = getField(emailPhno);
        if(!field) return res.status(400).json({message: "Invalid input data"});

        const user = await User.findOne({[field]: emailPhno}).exec();
        if(!user) return res.status(400).json({message: `Invalid ${field === "email" ? "Email id" : "Phone number"} entered`});
        
        const userid = user.userid;

        const result = await FPasswordVerificationCodes.findOne({userid}).exec();
        if(!result) return res.status(400).json({message: "Verification code expired"});

        if(result?.code === code){
            await FPasswordVerificationCodes.updateOne({userid}, {
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
    const {emailPhno,purpose } = req.body;

    try {
        const purposes = ["emailPhno", "password"];
        if(!emailPhno || !purpose || !purposes.includes(purpose)) return res.status(400).json({message: "Invalid input data"});

        const field = getField(emailPhno);
        if(!field) return res.status(400).json({message: "Invalid input data"});

        const user = await User.findOne({[field]: emailPhno}).exec();
        if(!user) return res.status(200).json({message: "Verication code sent successfully"});
        
        const userid = user.userid;
        let verCodeCollection;
        let subject, text;

        if(purpose === "emailPhno"){
            const verified = field === "email" ? user.verifiedEmail : user.verifiedPhno;
            if(verified) return res.status(200).json({message: `${field === "email" ? "Email id" : "Phone number"} already verified`});
            verCodeCollection = VerificationCodes;
            subject = "Verification code";
            text = `Your ${field === "email" ? "Email id" : "Phone number"} verification code is `;
        }
        else{
            verCodeCollection = FPasswordVerificationCodes;
            subject = "Verification code to reset password";
            text = "The code to reset the password is ";
        }

        const result = await verCodeCollection.findOneAndDelete({ userid });

        // Generate new verification code
        const code = generateVerificationCode();
        if(field === "email"){
            const isSent = await sendEmail(emailPhno, subject, `${text}${code}`);
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

        await verCodeCollection.create([{
            "userid": userid,
            "code": code
        }]);

        return res.status(200).json({message: "Verification code sent successfully"});

    } catch (err) {
        errorLogger(err);
        return res.status(err?.status || 400).json({message: err?.message || "Internal server error occurred!!!\n Try again later"});
    }
}

module.exports = { handleVerification, handleForgotPasswordCode, handleResendVC };