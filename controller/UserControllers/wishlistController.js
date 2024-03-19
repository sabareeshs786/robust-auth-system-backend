const { errorLogger } = require('../../middleware/errorHandler');
const Wishlist = require('../../models/Wishlist');
const { getIntVal } = require('../../utils/utilFunctions');

const getItemsFromWishlist = async (req, res) => {
    const userid = req.userid;
    if (!Number.isInteger(userid)) return res.status(400).json({ "message": 'Invalid input data' });

    const excludedFields = ['-_id', '-__v', '-userid'];
    try {
        const wishlist = await Wishlist.find({ userid }).select(excludedFields.join(' '));
        res.status(201).json(wishlist);
    } catch (error) {
        res.status(500);
    }
}

const addItemToWishlist = async (req, res) => {
    try {
        const userid = req.userid;
        if (!Number.isInteger(userid)) return res.status(400).json({ "message": 'Invalid input data' });
        let { skuid } = req.body;
        skuid = getIntVal(skuid)
        if(!skuid)
            return res.status(400).json({message: "Invalid product id"});

        //TODO - Check whether the product is there or not in the inventory

        const fields = { userid, skuid };
        const w = await Wishlist.findOne({ userid });
        if (!w)
            return res.status(500).json({ message: "Internal server error" });
        if (w && w.skuid?.includes(skuid))
            return res.status(400).json({ message: "Already the product is added in wishlist" });

        const wishlist = await Wishlist.updateOne(
            { userid },
            { $push: { skuid: skuid } },
        ).exec();
        if (wishlist.modifiedCount === 1)
            return res.status(201).json({ message: "Added to wishlist" });

        return res.status(500).json({ message: "Internal server error" });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

const deleteItemFromWishlist = async (req, res) => {
    try {
        const userid = req.userid;
        if (!Number.isInteger(userid)) return res.status(400).json({ "message": 'Invalid input data' });
        let { skuid } = req.body;
        skuid = getIntVal(skuid);
        if(!skuid)
            return res.status(400).json({message: "Invalid product id"});

        const wishlist = await Wishlist.updateOne(
            { userid },
            { $pull: { skuid: skuid } }
        ).exec();
        if(!wishlist)
            return res.status(500);
        if(wishlist.modifiedCount === 1)
            return res.status(201).json({message: "Item deleted successfully"});
        else
            return res.status(200).json({message: "Item not present in the wishlist"});
    } catch (error) {
        errorLogger(error);
        return res.status(500);
    }
}

module.exports = {
    getItemsFromWishlist,
    addItemToWishlist,
    deleteItemFromWishlist
}