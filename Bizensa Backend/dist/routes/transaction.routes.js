"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transaction_controller_1 = require("../controllers/transaction.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
// Must stay above "/:id" so "options" is not treated as an id
router.get("/options", transaction_controller_1.getTransactionOptions);
router.put("/:id", upload_middleware_1.upload.single("receipt"), transaction_controller_1.updateTransaction); // multer must be here
router.delete("/:id", transaction_controller_1.deleteTransaction);
exports.default = router;
//# sourceMappingURL=transaction.routes.js.map