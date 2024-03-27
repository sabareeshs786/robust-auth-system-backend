require('dotenv').config();
const bcrypt = require('bcrypt');
const Counter = require('../models/Counter');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Wishlist = require('../models/Wishlist');
const mongoose = require('mongoose');
const { errorLogger } = require('../middleware/errorHandler');

const addAdmin = async () => {
    const session = await mongoose.startSession();
    await session.startTransaction();

    try {
        const email = process.env.ADMIN_EMAIL_ID;
        const password = process.env.ADMIN_PASSWORD;
        const fields = ['-_id', 'email'];
        const u = await User.findOne({ email }).select(fields.join(' '));
        if (u && u.email === email)
            return;

        // Storing the admin user in the database
        const counter = await Counter.findOneAndUpdate(
            { field: 'userid' },
            { $inc: { value: 1 } },
            { new: true, upsert: true, session }
        );

        const hashedPwd = await bcrypt.hash(password, 10);
        const user = await User.create([{
            "userid": counter.value,
            "email": email,
            "password": hashedPwd,
            "roles": {
                Admin: 51507865,
                Editor: 1984078,
                User: 2001345
            }
        }], { session });
        const profile = await Profile.create([{
            "userid": counter.value,
        }], { session });
        const wishlist = await Wishlist.create([{
            "userid": counter.value
        }], { session });

        await session.commitTransaction();
    } catch (err) {
        await session.abortTransaction();
        errorLogger(err);
    }
    finally {
        if (session) {
            session.endSession();
        }
    }
}

module.exports = { addAdmin };