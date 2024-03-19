const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const counterSchema = new mongoose.Schema({
    field: { 
        type: String, 
        required: true,
    },
    value: { 
        type: Number, 
        default: 0 
    }
}, {timestamps: true});

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;