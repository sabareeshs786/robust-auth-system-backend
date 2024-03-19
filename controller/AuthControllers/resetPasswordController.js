const bcrypt = require('bcrypt');

const User = require('../../models/User');
const FPasswordVerificationCodes = require('../../models/FPasswordVC');
const { isPasswordValid } = require('../../utils/checkInputValidity');
const { res400 } = require('../../utils/errorResponse');
const { res500 } = require('../../utils/errorResponse');

const handleResetPassword = async (req, res) => {
    try {
        const { email, pwd, cpwd } = req.body;
        if (!email || !pwd || !cpwd) return res.status(400).json({message: "Invalid input data"});

        const foundUser = await User.findOne({ email: email }).exec();
        if (!foundUser) return res.status(401).json({message: "User not found"});
        const vc = await FPasswordVerificationCodes.findOne({email}).exec();
        if(!vc?.verified) return res.status(401).json({message: "Not verified"});

        const passwordValidity = isPasswordValid(pwd);
        if (!passwordValidity) return res400(res, "Invalid password entered");
        if (pwd !== cpwd) return res400(res, "Passwords doesn't match");

        const hashedPwd = await bcrypt.hash(pwd, 10);
        // if(foundUser.password === hashedPwd) return res400(res, "Old password entered");
        await User.updateOne({userid: foundUser.userid}, 
        {
            $set: {
                password: hashedPwd
            }
        }).exec();
        await FPasswordVerificationCodes.findOneAndDelete({ email });
        return res.status(200).json({message: "Password changed successfully"});
    }
    catch (err) {
        return res500(res);
    }
}

module.exports = { handleResetPassword };