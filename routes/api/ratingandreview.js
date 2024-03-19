const express = require('express');
const router = express.Router();
const usersController = require('../../controller/UserControllers/usersController');
const ROLES_LIST = require('../../config/roles_list');
const verifyRoles = require('../../middleware/verifyRoles');


module.exports = router;