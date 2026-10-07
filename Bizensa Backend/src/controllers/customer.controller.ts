import { Response } from "express";
import Customer from "../models/customer.model";
import { customerSchema } from "../validations/finance.validation";
import { AuthRequest } from "../middleware/auth.middleware";

// POST /api/customers
export const createCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { error, value } = customerSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: error.details[0].message });
            return;
        }

        const customer = await Customer.create({ ...value, user: req.userId });
        res.status(201).json({ success: true, message: "Customer saved", data: { customer } });
    } catch (err) {
        console.error("Create Customer Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};

// GET /api/customers
export const getCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const customers = await Customer.find({ user: req.userId }).sort({ name: 1 });
        res.status(200).json({ success: true, data: { customers } });
    } catch (err) {
        console.error("Get Customers Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};