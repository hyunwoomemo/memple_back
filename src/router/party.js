const express = require("express");
const router = express.Router();
const partyController = require("../controller/party");

router.post("/create", partyController.createParty);
router.get("/get/:world", partyController.getParties);
router.get("/player/:id", partyController.getPartyPlayer);
router.post("/add", partyController.addParty);
router.get("/my/:player_id", partyController.getMyParty);

module.exports = router;
