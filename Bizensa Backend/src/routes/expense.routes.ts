import { Router } from "express";
import { createExpense, getExpenses } from "../controllers/expense.controller";
import { protect } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

const router = Router();
router.use(protect);
router.post("/", upload.single("receipt"), createExpense); // field name must be "receipt"
router.get("/", getExpenses);
export default router;