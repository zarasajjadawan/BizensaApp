"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post("/signup", auth_controller_1.signup);
router.post("/login", auth_controller_1.login);
router.post("/forgot-password", auth_controller_1.forgotPassword);
router.post("/reset-password", auth_controller_1.resetPassword);
router.get("/me", auth_middleware_1.protect, auth_controller_1.getMe);
router.put("/me", auth_middleware_1.protect, auth_controller_1.updateMe);
router.post("/change-password", auth_middleware_1.protect, auth_controller_1.changePassword);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map