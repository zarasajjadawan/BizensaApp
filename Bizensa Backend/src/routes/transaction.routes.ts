import { Router } from "express";
import {
    deleteTransaction,
    getTransactionOptions,
    updateTransaction,
} from "../controllers/transaction.controller";
import { protect } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

const router = Router();
router.use(protect);

// Must stay above "/:id" so "options" is not treated as an id
router.get("/options", getTransactionOptions);
router.put("/:id", upload.single("receipt"), updateTransaction); // multer must be here
router.delete("/:id", deleteTransaction);

export default router;