import { Response } from "express";
import Joi from "joi";
import Expense, { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "../models/expense.model";
import { AuthRequest } from "../middleware/auth.middleware";

// Validation lives here so it always matches what the app sends
const createExpenseSchema = Joi.object({
    amount: Joi.number().positive().required(),
    category: Joi.string().valid(...EXPENSE_CATEGORIES).required(),
    date: Joi.date().required(),
    paymentMethod: Joi.string().valid(...PAYMENT_METHODS).required(),
    description: Joi.string().allow("").optional(),
}).unknown(true); // ignore any extra fields

// Works whether protect sets req.userId or req.user
const getUserId = (req: AuthRequest): string | undefined => {
    const r = req as any;
    return r.userId ?? r.user?._id ?? r.user?.id;
};

// POST /api/expenses  (multipart/form-data)
export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        console.log("BODY:", req.body, "FILE:", (req as any).file?.filename, "USER:", getUserId(req));

        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, message: "Not authorized" });
            return;
        }

        const { error, value } = createExpenseSchema.validate(req.body, { convert: true });
        if (error) {
            res.status(400).json({ success: false, message: error.details[0].message });
            return;
        }

        const file = (req as any).file as Express.Multer.File | undefined;

        const expense = await Expense.create({
            amount: value.amount,
            category: value.category,
            date: value.date,
            paymentMethod: value.paymentMethod,
            description: value.description ?? "",
            user: userId,
            receiptUrl: file ? `/uploads/${file.filename}` : undefined,
        });

        res.status(201).json({ success: true, message: "Expense saved", data: { expense } });
    } catch (err: any) {
        console.error("Create Expense Error:", err);
        res.status(500).json({
            success: false,
            message: err?.message || "Something went wrong. Please try again later.",
        });
    }
};

// GET /api/expenses
export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, message: "Not authorized" });
            return;
        }

        const expenses = await Expense.find({ user: userId }).sort({ date: -1 });
        res.status(200).json({ success: true, data: { expenses } });
    } catch (err: any) {
        console.error("Get Expenses Error:", err);
        res.status(500).json({
            success: false,
            message: err?.message || "Something went wrong. Please try again later.",
        });
    }
};