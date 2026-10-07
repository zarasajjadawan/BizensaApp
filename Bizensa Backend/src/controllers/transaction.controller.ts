import { Response } from "express";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Expense from "../models/expense.model";
import Income from "../models/income.model";
import { AuthRequest } from "../middleware/auth.middleware";

// Works whether protect sets req.userId or req.user
const getUserId = (req: AuthRequest): string | undefined => {
    const r = req as any;
    return r.userId ?? r.user?._id ?? r.user?.id;
};

// Removes the uploaded receipt file (if any). Never throws.
const removeReceipt = async (receiptUrl?: string): Promise<void> => {
    if (!receiptUrl) return;
    try {
        const filePath = path.join(process.cwd(), "uploads", path.basename(receiptUrl));
        await fs.promises.unlink(filePath);
    } catch {
        // file already gone or never existed, ignore
    }
};

// DELETE /api/transactions/:id
// A "transaction" is either an expense or an income, so we look in both
// collections. Only the owner can delete their own record.
export const deleteTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, message: "Not authorized" });
            return;
        }

        // Accept plain Mongo ids, and also ids the app may prefix like "expense-<id>"
        const rawId = String(req.params.id).replace(/^(expense|income)[-_:]/i, "");

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
