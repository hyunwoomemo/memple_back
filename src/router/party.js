const express = require("express");
const router = express.Router();
const partyController = require("../controller/party");

router.post("/create", partyController.createParty);
router.get("/get", partyController.getParty);
router.get("/player/:id", partyController.getPartyPlayer);
router.post("/add", partyController.addParty);

module.exports = router;
