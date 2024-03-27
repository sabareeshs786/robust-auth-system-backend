const express = require('express');
const router = express.Router();
const adminUserController = require('../../controller/UserControllers/adminController');
const ROLES_LIST = require('../../config/roles_list');
const verifyRoles = require('../../middleware/verifyRoles');

router.route('/users')
    .get(verifyRoles(ROLES_LIST.Admin), adminUserController.getAllUsers)
    .put(verifyRoles(ROLES_LIST.Admin), adminUserController.updateUserAuthDetails)

router.route('/users/:userid')
    .get(verifyRoles(ROLES_LIST.Admin), adminUserController.getUser)
    .delete(verifyRoles(ROLES_LIST.Admin), adminUserController.deleteUser)

module.exports = router;