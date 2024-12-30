const express = require("express");
const router = express.Router();
const userController = require("../controller/user");

router.post("/login/:social", userController.login);

module.exports = router;
