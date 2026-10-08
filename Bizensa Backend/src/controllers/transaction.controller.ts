import { Response } from "express";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Joi from "joi";
import Expense, { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "../models/expense.model";
import Income from "../models/income.model";
import { AuthRequest } from "../middleware/auth.middleware";

// Works whether protect sets req.userId or req.user
const getUserId = (req: AuthRequest): string | undefined => {
    const r = req as any;
    return r.userId ?? r.user?._id ?? r.user?.id;
};

// Accept plain Mongo ids, and also ids the app may prefix like "expense-<id>"
const cleanId = (id: unknown) => String(id).replace(/^(expense|income)[-_:]/i, "");

// Removes an uploaded receipt file (if any). Never throws.
const removeReceipt = async (receiptUrl?: string | null): Promise<void> => {
    if (!receiptUrl) return;
    try {
        const filePath = path.join(process.cwd(), "uploads", path.basename(receiptUrl));
        await fs.promises.unlink(filePath);
    } catch {
        // file already gone or never existed, ignore
    }
};

// Removes a file multer just saved (used when validation fails)
const removeUploaded = async (file?: Express.Multer.File): Promise<void> => {
    if (!file) return;
    try {
        await fs.promises.unlink(file.path);
    } catch {
        // ignore
    }
};

// Validation for editing
const expenseUpdateSchema = Joi.object({
    amount: Joi.number().positive().required(),
    category: Joi.string().valid(...EXPENSE_CATEGORIES).required(),
    date: Joi.date().required(),
    paymentMethod: Joi.string().valid(...PAYMENT_METHODS).required(),
    description: Joi.string().allow("").optional(),
}).unknown(true);

const incomeUpdateSchema = Joi.object({
    amount: Joi.number().positive().required(),
    category: Joi.string().trim().min(1).required(),
    date: Joi.date().required(),
    paymentMethod: Joi.string().valid(...PAYMENT_METHODS).required(),
    description: Joi.string().allow("").optional(),
    customer: Joi.string().allow("", null).optional(),
}).unknown(true);

// GET /api/transactions/options
export const getTransactionOptions = (_req: AuthRequest, res: Response): void => {
    res.status(200).json({
        success: true,
        data: {
            expenseCategories: [...EXPENSE_CATEGORIES],
            paymentMethods: [...PAYMENT_METHODS],
        },
    });
};

// PUT /api/transactions/:id
// Edits an expense or an income (whichever the id belongs to).
// Expense: JSON or multipart (optional new receipt, or removeReceipt=true).
export const updateTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    const file = (req as any).file as Express.Multer.File | undefined;

    try {
        const userId = getUserId(req);
        if (!userId) {
            await removeUploaded(file);
            res.status(401).json({ success: false, message: "Not authorized" });
            return;
        }

        const rawId = cleanId(req.params.id);
        if (!mongoose.isValidObjectId(rawId)) {
            await removeUploaded(file);
            res.status(400).json({ success: false, message: "Invalid transaction id" });
            return;
        }

        // Never let an undefined body crash the handler
        const body = req.body ?? {};

        const expense = await Expense.findOne({ _id: rawId, user: userId });
        const income = expense ? null : await Income.findOne({ _id: rawId, user: userId });

        if (!expense && !income) {
            await removeUploaded(file);
            res.status(404).json({ success: false, message: "Transaction not found" });
            return;
        }

        /* ---------- Expense ---------- */
        if (expense) {
            const { error, value } = expenseUpdateSchema.validate(body, { convert: true });
            if (error || !value) {
                await removeUploaded(file);
                res.status(400).json({
                    success: false,
                    message: error?.details[0].message ?? "Invalid data",
                });
                return;
            }

            const set: Record<string, unknown> = {
                amount: value.amount,
                category: value.category,
                date: value.date,
                paymentMethod: value.paymentMethod,
                description: value.description ?? "",
            };

            const oldReceipt = expense.receiptUrl;

            if (file) {
                // New receipt picked: store it (same format createExpense uses)
                set.receiptUrl = `/uploads/${file.filename}`;
            } else if (String(body.removeReceipt) === "true") {
                // User removed the receipt
                set.receiptUrl = null;
            }

            const updated = await Expense.findOneAndUpdate(
                { _id: rawId, user: userId },
                { $set: set },
                { new: true, runValidators: true }
            );

            // Delete the old file only after the DB update succeeded
            if (set.receiptUrl !== undefined && oldReceipt && oldReceipt !== set.receiptUrl) {
                await removeReceipt(oldReceipt);
            }

            res.status(200).json({
                success: true,
                message: "Transaction updated",
                data: { transaction: updated, type: "expense" },
            });
            return;
        }

        /* ---------- Income ---------- */
        const { error, value } = incomeUpdateSchema.validate(body, { convert: true });
        if (error || !value) {
            await removeUploaded(file);
            res.status(400).json({
                success: false,
                message: error?.details[0].message ?? "Invalid data",
            });
            return;
        }

        await removeUploaded(file); // income has no receipt

        const updated = await Income.findOneAndUpdate(
            { _id: rawId, user: userId },
            {
                $set: {
                    amount: value.amount,
                    category: value.category,
                    date: value.date,
                    paymentMethod: value.paymentMethod,
                    description: value.description ?? "",
                    customer: value.customer || null,
                },
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Transaction updated",
            data: { transaction: updated, type: "income" },
        });
    } catch (err: any) {
        await removeUploaded(file);
        console.error("Update Transaction Error:", err);
        res.status(500).json({
            success: false,
            message: err?.message || "Something went wrong. Please try again later.",
        });
    }
};

// DELETE /api/transactions/:id
export const deleteTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, message: "Not authorized" });
            return;
        }

        const rawId = cleanId(req.params.id);

        if (!mongoose.isValidObjectId(rawId)) {
            res.status(400).json({ success: false, message: "Invalid transaction id" });
            return;
        }

        // 1) Try expense
        const expense = await Expense.findOneAndDelete({ _id: rawId, user: userId });
        if (expense) {
            await removeReceipt(expense.receiptUrl);
            res.status(200).json({
                success: true,
                message: "Transaction deleted",
                data: { id: rawId, type: "expense" },
            });
            return;
        }

        // 2) Try income
        const income = await Income.findOneAndDelete({ _id: rawId, user: userId });
        if (income) {
            res.status(200).json({
                success: true,
                message: "Transaction deleted",
                data: { id: rawId, type: "income" },
            });
            return;
        }

        res.status(404).json({ success: false, message: "Transaction not found" });
    } catch (err: any) {
        console.error("Delete Transaction Error:", err);
        res.status(500).json({
            success: false,
            message: err?.message || "Something went wrong. Please try again later.",
        });
    }
};