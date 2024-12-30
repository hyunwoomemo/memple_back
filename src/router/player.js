const express = require("express");
const router = express.Router();
const playerController = require("../controller/player");

router.post("/create", playerController.createPlayer);
router.post("/testLogin", playerController.testLogin);

module.exports = router;
