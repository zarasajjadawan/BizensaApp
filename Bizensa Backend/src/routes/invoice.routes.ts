import { Router } from "express";
import {createInvoice, getInvoices, updateInvoice, markInvoicePaid, deleteInvoice,} from "../controllers/invoice.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();
router.use(protect);
router.post("/", createInvoice);
router.get("/", getInvoices);
router.patch("/:id/pay", markInvoicePaid);
router.put("/:id", updateInvoice);
router.delete("/:id", deleteInvoice);
export default router;