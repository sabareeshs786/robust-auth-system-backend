const bcrypt = require('bcrypt');

const Counter = require('../../models/Counter');
const User = require('../../models/User');
const VerificationCodes = require('../../models/VerificationCodes');
const mongoose = require('mongoose');
const { isPasswordValid } = require('../../utils/checkInputValidity');
const { res400 } = require('../../utils/errorResponse');
const { sendEmail } = require('../../utils/emailSender');
const { generateVerificationCode, isValidEmail, isValidPhoneNumber } = require('../../utils/utilFunctions');
const { errorLogger } = require('../../middleware/errorHandler');
const { sendSms } = require('../../utils/smsSender');

const handleNewUser = async (req, res) => {
    const session = await mongoose.startSession();
    await session.startTransaction();
    
    try {
        const { emailPhno, pwd, cpwd } = req.body;
        if (!emailPhno || !pwd || !cpwd) return res.status(400).json({ 'message': 'Invalid input data' });
        let field;
        if(isValidEmail(emailPhno)){
            field = "email";
        }
        else if(isValidPhoneNumber(emailPhno)){
            field = "phno";
        }
        else
            return res.status(500).json({message: "Invalid input data"});

        const duplicate = await User.findOne({ [field]: emailPhno }).exec();
        if (duplicate) return res.status(409).json({ "message": `The entered ${field === "email" ? "Email id" : "Phone number"} is already present` });

        const passwordValidity = isPasswordValid(pwd);
        if (!passwordValidity) return res400(res, "Invalid password entered");
        if (pwd !== cpwd) return res400(res, "Passwords doesn't match");

        // Storing in the database
        const counter = await Counter.findOneAndUpdate(
            { field: 'userid' },
            { $inc: { value: 1 } },
            { new: true, upsert: true, session }
        );

        const hashedPwd = await bcrypt.hash(pwd, 10);
        const user = await User.create([{
            "userid": counter.value,
            [field]: emailPhno,
            "password": hashedPwd
        }], { session });
        
        // Generate and send verification code
        const code = generateVerificationCode();
        if(field === "email"){
            const isSent = await sendEmail(emailPhno, "Verification code", `Your email verification code is ${code}`);
            if(!isSent)
                throw {code: 401, message: "Can't send email"};
        }
        else{
            const message = `Your verification code ---->: ${code}. Please don't share`;
            const phno = emailPhno.replace(/\s/g, '');
            const result = await sendSms(phno, message);
            if(!result){
                throw {code: 401, message: "Can't send SMS"};
            }
        }

        await VerificationCodes.create([{
            "userid": user[0].userid,
            "code": code
        }], { session });

        await session.commitTransaction();
        res.status(201).json({ message: `Verification code is sent to ${field === "email" ? "Email id" : "Phone number"}: ${emailPhno}` });
    } catch (err) {
        await session.abortTransaction();
        errorLogger(err);
        if(err.code && err.message)
            return res.status(err.code).json({message: err.message});
        else
            res.status(500).json({ 'message': "Internal server error occurred!!!\n Try again later" });
    }
    finally {
        if (session) {
            session.endSession();
        }
    }
}

module.exports = { handleNewUser };