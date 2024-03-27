const express = require('express');
const router = express.Router();
const profilesController = require('../../controller/UserControllers/profileController');
const ROLES_LIST = require('../../config/roles_list');
const verifyRoles = require('../../middleware/verifyRoles');

// Used by the users
router.route('/personalinfo')
    .get(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor, ROLES_LIST.User), profilesController.getPersonalInfo)
    .put(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor, ROLES_LIST.User), profilesController.updatePersonalInfo)

router.route('/address')
    .get(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor, ROLES_LIST.User), profilesController.getAddresses)
    .post(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor, ROLES_LIST.User), profilesController.addAddress)
    .put(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor, ROLES_LIST.User), profilesController.updateAddress)
    .delete(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor, ROLES_LIST.User), profilesController.deleteAddress)

router.route('/address/default')
    .put(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor, ROLES_LIST.User), profilesController.updateDefaultAddress)

// Used by the admins and editors
// TODO

module.exports = router;