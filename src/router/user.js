const express = require("express");
const router = express.Router();
const userController = require("../controller/user");

router.post("/login/:social", userController.login);
router.post("/kakaoLogin", userController.kakaoLogin);
router.post("/refreshToken", userController.refreshToken);
router.get("/info", userController.getInfo);

module.exports = router;
