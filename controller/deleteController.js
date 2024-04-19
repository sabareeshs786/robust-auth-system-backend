const User = require('../models/User');
const Counter = require('../models/Counter');
const FPasswordVC = require('../models/FPasswordVC');
const Profile = require('../models/Profile');
const VerificationCodes = require('../models/VerificationCodes');

const handleDeleteAll = async (req, res) => {
    try {
        await User.deleteMany({});
        await Counter.deleteMany({});
        await FPasswordVC.deleteMany({});
        await Profile.deleteMany({});
        await VerificationCodes.deleteMany({});
        res.status(200).json({message: "Deleted everything successfully"});
    } catch (error) {
        console.log(error);
    }
}

module.exports = { handleDeleteAll };