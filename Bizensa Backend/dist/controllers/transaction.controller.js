"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTransaction = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const expense_model_1 = __importDefault(require("../models/expense.model"));
const income_model_1 = __importDefault(require("../models/income.model"));
// Works whether protect sets req.userId or req.user
const getUserId = (req) => {
    const r = req;
    return r.userId ?? r.user?._id ?? r.user?.id;
};
// Removes the uploaded receipt file (if any). Never throws.
const removeReceipt = async (receiptUrl) => {
    if (!receiptUrl)
        return;
    try {
        const filePath = path_1.default.join(process.cwd(), "uploads", path_1.default.basename(receiptUrl));
        await fs_1.default.promises.unlink(filePath);
    }
    catch {
        // file already gone or never existed, ignore
    }
};
// DELETE /api/transactions/:id
// A "transaction" is either an expense or an income, so we look in both
// collections. Only the owner can delete their own record.
const deleteTransaction = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, message: "Not authorized" });
            return;
        }
        // Accept plain Mongo ids, and also ids the app may prefix like "expense-<id>"
        const rawId = String(req.params.id).replace(/^(expense|income)[-_:]/i, "");
        if (!mongoose_1.default.isValidObjectId(rawId)) {
            res.status(400).json({ success: false, message: "Invalid transaction id" });
            return;
        }
        // 1) Try expense
        const expense = await expense_model_1.default.findOneAndDelete({ _id: rawId, user: userId });
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
        const income = await income_model_1.default.findOneAndDelete({ _id: rawId, user: userId });
        if (income) {
            res.status(200).json({
                success: true,
                message: "Transaction deleted",
                data: { id: rawId, type: "income" },
            });
            return;
        }
        res.status(404).json({ success: false, message: "Transaction not found" });
    }
    catch (err) {
        console.error("Delete Transaction Error:", err);
        res.status(500).json({
            success: false,
            message: err?.message || "Something went wrong. Please try again later.",
        });
    }
};
exports.deleteTransaction = deleteTransaction;
//# sourceMappingURL=transaction.controller.js.map