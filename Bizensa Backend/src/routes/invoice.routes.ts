import { Router } from "express";
import { createInvoice, getInvoices } from "../controllers/invoice.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();
router.use(protect);
router.post("/", createInvoice);
router.get("/", getInvoices);
export default router;