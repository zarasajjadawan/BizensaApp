"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoice_controller_1 = require("../controllers/invoice.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
router.post("/", invoice_controller_1.createInvoice);
router.get("/", invoice_controller_1.getInvoices);
exports.default = router;
//# sourceMappingURL=invoice.routes.js.map