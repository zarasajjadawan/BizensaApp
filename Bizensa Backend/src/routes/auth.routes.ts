import { Router } from "express";
import {signup, login, getMe, updateMe, changePassword, forgotPassword, resetPassword} from "../controllers/auth.controller";
import {protect} from "../middleware/auth.middleware";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.post("/change-password", protect, changePassword);

export default router;