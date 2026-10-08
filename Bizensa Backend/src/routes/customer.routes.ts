import { Router } from "express";
import { createCustomer, getCustomers, updateCustomer, deleteCustomer } from "../controllers/customer.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();
router.use(protect);
router.post("/", createCustomer);
router.get("/", getCustomers);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);
export default router;