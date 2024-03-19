const express = require('express');
const router = express.Router();
const wishlistController = require('../../controller/UserControllers/wishlistController');
const ROLES_LIST = require('../../config/roles_list');
const verifyRoles = require('../../middleware/verifyRoles');

router.route('/')
    .get(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor, ROLES_LIST.User), wishlistController.getItemsFromWishlist)
    .post(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor, ROLES_LIST.User), wishlistController.addItemToWishlist)
    .delete(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor, ROLES_LIST.User), wishlistController.deleteItemFromWishlist)

module.exports = router;