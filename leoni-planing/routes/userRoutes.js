const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { auth, requireRole, requireGroup } = require("../middlewares/auth");

router.get("/users", auth, requireGroup, requireRole(["Team Leader"]), userController.getUsers);
router.post("/register", auth, requireGroup, requireRole(["Team Leader"]), userController.createUser);
router.put("/users/:id", auth, requireGroup, requireRole(["Team Leader"]), userController.updateUser);
router.delete("/users/:id", auth, requireGroup, requireRole(["Team Leader"]), userController.deleteUser);

module.exports = router;
