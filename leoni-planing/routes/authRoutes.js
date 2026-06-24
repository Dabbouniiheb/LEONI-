const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { auth } = require("../middlewares/auth");

router.get("/api/session", authController.getSession);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/change-password", auth, authController.changePassword);
router.post("/select-group", auth, authController.selectGroup);

module.exports = router;
