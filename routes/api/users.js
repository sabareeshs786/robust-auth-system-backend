const express = require('express');
const router = express.Router();
const userUsersController = require('../../controller/UserControllers/user-usersController');
const ROLES_LIST = require('../../config/roles_list');
const verifyRoles = require('../../middleware/verifyRoles');

router.route('/')
    .get(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor, ROLES_LIST.User), userUsersController.getUser)
    .put(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor, ROLES_LIST.User), userUsersController.updateUserAuthDetails)

// router.route('/update')
//     .put(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), usersController.updateUserRoles)

module.exports = router;