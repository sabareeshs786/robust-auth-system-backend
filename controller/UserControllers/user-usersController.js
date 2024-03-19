const bcrypt = require('bcrypt');
const User = require('../../models/User');
const { isPasswordValid } = require('../../utils/checkInputValidity');

const getUser = async (req, res) => {
    try {
        const userid = req.userid;
        if (!Number.isInteger(userid)) return res.status(400).json({ "message": 'Invalid input data' });
        const fields = ['-_id', '-__v', '-refreshToken', '-password', '-userid', '-roles'];
        const user = await User.findOne({ userid }).select(fields.join(' '));
        if (!user) {
            return res.status(204).json({ 'message': `User ID ${req.params.id} not found` });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

const updateUserAuthDetails = async (req, res) => {
    try {
        const userid = req.userid;
        if (!Number.isInteger(userid)) return res.status(400).json({ "message": 'Invalid input data' });
        const field = req.body.field;
        const value = req.body.value;
        if (!field || !value)
            return res.status(400).json({ message: "Invalid input data" });

        if (field === 'email') {
            const user = await User.updateOne(
                { userid },
                {   
                    $set: {
                        email: value
                    }
                },
            ).exec();
            if(user.modifiedCount === 1)
                return res.status(204).json({ message: "Email id updated successfully" });
            else
                return res.status(200).json({message: "Same email id entered"});
        }
        else if (field === 'password') {
            if (!isPasswordValid(value))
                return res.status(400).json({ message: "Invalid password entered" });

            const hashedPwd = await bcrypt.hash(value, 10);
            const user = await User.updateOne(
                { userid },
                {   
                    $set: {
                        password: hashedPwd
                    }
                },
            ).exec();
            if(user.modifiedCount === 1)
                return res.status(204).json({ message: "Password updated successfully" });
            else
                return res.status(200).json({message: "Same password entered"});
        }
        else
            return res.status(400).json({ message: "Invalid input data" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = {
    getUser,
    updateUserAuthDetails,
}