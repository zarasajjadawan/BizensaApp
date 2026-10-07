"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const income_controller_1 = require("../controllers/income.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
router.post("/", income_controller_1.createIncome);
router.get("/", income_controller_1.getIncome);
exports.default = router;
//# sourceMappingURL=income.routes.js.map