import { Response } from "express";
import Income from "../models/income.model";
import { incomeSchema } from "../validations/finance.validation";
import { AuthRequest } from "../middleware/auth.middleware";

// POST /api/income
export const createIncome = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { error, value } = incomeSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: error.details[0].message });
            return;
        }

        const income = await Income.create({ ...value, customer: value.customer || null, user: req.userId });
        res.status(201).json({ success: true, message: "Income saved", data: { income } });
    } catch (err) {
        console.error("Create Income Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};

// GET /api/income
export const getIncome = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const income = await Income.find({ user: req.userId }).sort({ date: -1 });
        res.status(200).json({ success: true, data: { income } });
    } catch (err) {
        console.error("Get Income Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};