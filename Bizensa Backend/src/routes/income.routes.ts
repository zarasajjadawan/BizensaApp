import { Router } from "express";
import { createIncome, getIncome } from "../controllers/income.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();
router.use(protect);
router.post("/", createIncome);
router.get("/", getIncome);
export default router;