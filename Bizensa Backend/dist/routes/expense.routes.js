"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const expense_controller_1 = require("../controllers/expense.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
router.post("/", upload_middleware_1.upload.single("receipt"), expense_controller_1.createExpense); // field name must be "receipt"
router.get("/", expense_controller_1.getExpenses);
exports.default = router;
//# sourceMappingURL=expense.routes.js.map