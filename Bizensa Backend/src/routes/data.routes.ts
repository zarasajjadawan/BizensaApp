import { Router } from "express";
import { getAllData } from "../controllers/data.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();
router.use(protect);
router.get("/", getAllData);
export default router;
