const express = require("express");
const router = express.Router();
const playerController = require("../controller/player");

router.post("/create", playerController.createPlayer);
router.post("/testLogin", playerController.testLogin);
router.post("/register", playerController.register);
router.get("/my", playerController.getPlayers);
router.get("/info/:ocid", playerController.getInfo);
router.post("/select", playerController.select);
router.get("/selected", playerController.selectedPlayer);
router.post("/delete", playerController.delete);

module.exports = router;
