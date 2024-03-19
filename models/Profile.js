const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const profileSchema = new Schema({
    userid: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String
    },
    gender: {
        type: String,
        enum: ['m', 'f'],
    },
    phno: {
        code: {
            type: String,
        },
        number: {
            type: Number,
        }
    },
    addresses: {
        type: [String]
    },
    defaultAddress: {
        type: Number,
        default: 0
    }
});

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;