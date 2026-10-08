"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_controller_1 = require("../controllers/customer.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
router.post("/", customer_controller_1.createCustomer);
router.get("/", customer_controller_1.getCustomers);
router.put("/:id", customer_controller_1.updateCustomer);
router.delete("/:id", customer_controller_1.deleteCustomer);
exports.default = router;
//# sourceMappingURL=customer.routes.js.map