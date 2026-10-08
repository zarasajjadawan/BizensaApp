import { Router } from "express";
import { createIncome, getIncome } from "../controllers/income.controller";
import { protect } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

const router = Router();
router.use(protect);
router.post("/", upload.single("receipt"), createIncome);
router.get("/", getIncome);
export default router;