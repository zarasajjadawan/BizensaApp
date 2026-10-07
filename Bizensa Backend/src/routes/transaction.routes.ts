import { Router } from "express";
import { deleteTransaction } from "../controllers/transaction.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();
router.use(protect);
router.delete("/:id", deleteTransaction);
export default router;
