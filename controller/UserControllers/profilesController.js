const Profile = require('../../models/Profile');
const { isValidPhoneNumber, isValidName, getIntVal, isValidAddress } = require('../../utils/utilFunctions');

// For users
const getPersonalInfo = async (req, res) => {
    try {
        const userid = req.userid;
        if (!Number.isInteger(userid)) return res.status(400).json({ "message": 'Invalid input data' });
        const excludedFields = ['-_id', '-__v', '-addresses', '-defaultAddress', '-userid'];
        const personalInfo = await Profile.findOne({ userid }).select(excludedFields.join(' '));
        if (!personalInfo) {
            return res.status(404).json({ 'message': 'Profile not found' });
        }
        res.json(personalInfo);
    } catch (error) {
        console.log(error);
        res.status(500);
    }
}

const getAddresses = async (req, res) => {
    const userid = req.userid;
    if (!Number.isInteger(userid)) return res.status(400).json({ "message": 'Invalid input data' });
    const fields = ['-_id', 'addresses', 'defaultAddress'];
    try {
        const addressesInfo = await Profile.findOne({ userid }).select(fields.join(' '));
        if (!addressesInfo)
            return res.status(404).json({ message: 'Profile not found' });
        res.status(200).json(addressesInfo);
    } catch (error) {
        console.log(error);
        res.status(500);
    }
}

const updatePersonalInfo = async (req, res) => {
    try {
        const userid = req.userid;
        if (!Number.isInteger(userid)) return res.status(400).json({ "message": 'Invalid input data' });
        const field = req?.body?.field;
        const value = req?.body?.value;
        const code = value.code || '+91';
        const num = value.num;
        let g;

        if (!field || !value)
            return res.status(400).json({ message: "Invalid input data" });
        if (field === 'phno') {
            if (!num || !isValidPhoneNumber(num))
                return res.status(400).json({ message: "Entered phone number is not valid" });

            const profile = await Profile.updateOne(
                { userid },
                {
                    $set: {
                        phno: {
                            code: code,
                            number: num,
                        }
                    }
                },
            ).exec();
            if (profile.modifiedCount === 1)
                return res.status(204).json({ message: "Phone number updated successfully" });
            else
                return res.status(200).json({ message: "Same phone number entered" });
        }
        else if (field === 'name') {
            if (!value || !isValidName(value))
                return res.status(400).json({ message: "Entered name is not valid" });

            const profile = await Profile.updateOne(
                { userid },
                {
                    $set: {
                        name: value
                    }
                },
            );
            if (profile.modifiedCount === 1)
                return res.status(204).json({ message: "Name updated successfully" });
            else
                return res.status(200).json({ message: "Same name entered" });
        }
        else if (field === 'gender') {
            if (value === "male")
                g = "m"
            else if (value === "female")
                g = "f"
            else
                return res.status(400).json({ message: "Entered gender is not valid" });

            const profile = await Profile.updateOne(
                { userid },
                {
                    $set: {
                        gender: g
                    }
                },
            ).exec();
            if (profile.modifiedCount === 1)
                return res.status(204).json({ message: "Gender updated successfully" });
            else
                return res.status(200).json({ message: "Same gender entered" });
        }
        else
            return res.status(400).json({ message: "Invalid input data" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const addAddress = async (req, res) => {
    try {
        const userid = req.userid;
        if (!Number.isInteger(userid)) return res.status(400).json({ "message": 'Invalid input data' });
        const address = req?.body?.address;
        if (!address || !isValidAddress(address))
            return res.status(400).json({ message: "Entered address is not valid" });

        const p = await Profile.findOne({ userid });
        const addresses = p.addresses;
        if (addresses.length === 5)
            return res.status(400).json({ message: "Cannot add more than 5 addresses" });

        const profile = await Profile.updateOne(
            { userid },
            { $push: { addresses: address } },
        ).exec();
        if (profile.modifiedCount === 1)
            return res.status(201).json({ message: "Address added successfully" });
        else
            return res.status(401).json({ message: "Cannot add address" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const updateAddress = async (req, res) => {
    try {
        const userid = req.userid;
        if (!Number.isInteger(userid)) return res.status(400).json({ "message": 'Invalid input data' });
        const address = req?.body?.address;
        const index = req?.body?.index;
        if (!address || !isValidAddress(address))
            return res.status(400).json({ message: "Entered address is not valid" });
        if (!Number.isInteger(index) || index < 0)
            return res.status(400).json({ message: "Invalid input data" });
        const p = await Profile.findOne({ userid });
        const addresses = p.addresses;
        if (index >= addresses.length)
            return res.status(400).json({ message: "Invalid input data" });

        const profile = await Profile.updateOne(
            { userid },
            { $set: { [`addresses.${index}`]: address } },
        ).exec();
        if (profile.modifiedCount === 1)
            return res.status(204).json({ message: "Address updated successfully" });
        else
            return res.status(200).json({ message: "Same address entered" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const updateDefaultAddress = async (req, res) => {
    try {
        const userid = req.userid;
        if (!Number.isInteger(userid)) return res.status(400).json({ "message": 'Invalid input data' });
        const index = req?.body?.index;
        if (!Number.isInteger(index) || index < 0)
            return res.status(400).json({ message: "Invalid input data" });
        const p = await Profile.findOne({ userid });
        const addresses = p.addresses;
        if (index >= addresses.length)
            return res.status(400).json({ message: "Invalid input data" });

        const profile = await Profile.updateOne(
            { userid },
            { $set: { 'defaultAddress': index } },
        ).exec();
        if (profile.modifiedCount === 1)
            return res.status(204).json({ message: "Default address updated successfully" });
        else
            return res.status(200).json({ message: "Same default address entered" });
    } catch (error) {
        res.status(500);
    }
}

const deleteAddress = async (req, res) => {
    try {
        const userid = req.userid;
        if (!Number.isInteger(userid)) return res.status(400).json({ "message": 'Invalid input data' });
        const indexToDelete = req?.body?.index;
        if (!Number.isInteger(indexToDelete) || indexToDelete < 0)
            return res.status(400).json({ message: "Invalid input data" });
        const p = await Profile.findOne({ userid });
        const addresses = p.addresses;
        let defaultAddress = p.defaultAddress;
        if (indexToDelete >= addresses.length)
            return res.status(400).json({ message: "Invalid input data" });
        if(indexToDelete === defaultAddress)
            return res.status(400).json({message: "Default address can't be deleted"});
        if(indexToDelete < defaultAddress)
            defaultAddress--;

        const profile1 = await Profile.updateOne(
            { userid },
            { $unset: { [`addresses.${indexToDelete}`]: 1 } }
        ).exec();
        const profile2 = await Profile.updateOne(
            {userid},
            {$set: {defaultAddress: defaultAddress}}
        ).exec();
        const result = await Profile.updateOne(
            { userid },
            { $pull: { addresses: null } }
        ).exec();

        if (result.modifiedCount === 1)
            return res.status(204).json({ message: "Address deleted successfully" })
        else
            return res.status(200).json({ message: "No address deleted" });
    } catch (error) {
        res.status(500);
    }
}

module.exports = {
    getPersonalInfo,
    getAddresses,
    updatePersonalInfo,
    addAddress,
    updateAddress,
    updateDefaultAddress,
    deleteAddress
}