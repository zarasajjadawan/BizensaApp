"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTransaction = exports.updateTransaction = exports.getTransactionOptions = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const joi_1 = __importDefault(require("joi"));
const expense_model_1 = __importStar(require("../models/expense.model"));
const income_model_1 = __importDefault(require("../models/income.model"));
// Works whether protect sets req.userId or req.user
const getUserId = (req) => {
    const r = req;
    return r.userId ?? r.user?._id ?? r.user?.id;
};
// Accept plain Mongo ids, and also ids the app may prefix like "expense-<id>"
const cleanId = (id) => String(id).replace(/^(expense|income)[-_:]/i, "");
// Removes an uploaded receipt file (if any). Never throws.
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
// Removes a file multer just saved (used when validation fails)
const removeUploaded = async (file) => {
    if (!file)
        return;
    try {
        await fs_1.default.promises.unlink(file.path);
    }
    catch {
        // ignore
    }
};
// Validation for editing
const expenseUpdateSchema = joi_1.default.object({
    amount: joi_1.default.number().positive().required(),
    category: joi_1.default.string().valid(...expense_model_1.EXPENSE_CATEGORIES).required(),
    date: joi_1.default.date().required(),
    paymentMethod: joi_1.default.string().valid(...expense_model_1.PAYMENT_METHODS).required(),
    description: joi_1.default.string().allow("").optional(),
}).unknown(true);
const incomeUpdateSchema = joi_1.default.object({
    amount: joi_1.default.number().positive().required(),
    category: joi_1.default.string().trim().min(1).required(),
    date: joi_1.default.date().required(),
    paymentMethod: joi_1.default.string().valid(...expense_model_1.PAYMENT_METHODS).required(),
    description: joi_1.default.string().allow("").optional(),
    customer: joi_1.default.string().allow("", null).optional(),
}).unknown(true);
// GET /api/transactions/options
const getTransactionOptions = (_req, res) => {
    res.status(200).json({
        success: true,
        data: {
            expenseCategories: [...expense_model_1.EXPENSE_CATEGORIES],
            paymentMethods: [...expense_model_1.PAYMENT_METHODS],
        },
    });
};
exports.getTransactionOptions = getTransactionOptions;
// PUT /api/transactions/:id
// Edits an expense or an income (whichever the id belongs to).
// Both: JSON or multipart (optional new receipt, or removeReceipt=true).
const updateTransaction = async (req, res) => {
    const file = req.file;
    try {
        const userId = getUserId(req);
        if (!userId) {
            await removeUploaded(file);
            res.status(401).json({ success: false, message: "Not authorized" });
            return;
        }
        const rawId = cleanId(req.params.id);
        if (!mongoose_1.default.isValidObjectId(rawId)) {
            await removeUploaded(file);
            res.status(400).json({ success: false, message: "Invalid transaction id" });
            return;
        }
        // Never let an undefined body crash the handler
        const body = req.body ?? {};
        const expense = await expense_model_1.default.findOne({ _id: rawId, user: userId });
        const income = expense ? null : await income_model_1.default.findOne({ _id: rawId, user: userId });
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
            const set = {
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
            }
            else if (String(body.removeReceipt) === "true") {
                // User removed the receipt
                set.receiptUrl = null;
            }
            const updated = await expense_model_1.default.findOneAndUpdate({ _id: rawId, user: userId }, { $set: set }, { new: true, runValidators: true });
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
        const set = {
            amount: value.amount,
            category: value.category,
            date: value.date,
            paymentMethod: value.paymentMethod,
            description: value.description ?? "",
            customer: value.customer || null,
        };
        const oldReceipt = income.receiptUrl;
        if (file) {
            set.receiptUrl = `/uploads/${file.filename}`;
        }
        else if (String(body.removeReceipt) === "true") {
            set.receiptUrl = null;
        }
        const updated = await income_model_1.default.findOneAndUpdate({ _id: rawId, user: userId }, { $set: set }, { new: true, runValidators: true });
        // Delete the old file only after the DB update succeeded
        if (set.receiptUrl !== undefined && oldReceipt && oldReceipt !== set.receiptUrl) {
            await removeReceipt(oldReceipt);
        }
        res.status(200).json({
            success: true,
            message: "Transaction updated",
            data: { transaction: updated, type: "income" },
        });
    }
    catch (err) { // <-- restored
        await removeUploaded(file); // <-- restored
        console.error("Update Transaction Error:", err); // <-- restored
        res.status(500).json({
            success: false, // <-- restored
            message: err?.message || "Something went wrong. Please try again later.", // <-- restored
        }); // <-- restored
    } // <-- restored
}; // <-- restored
exports.updateTransaction = updateTransaction;
// DELETE /api/transactions/:id
const deleteTransaction = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, message: "Not authorized" });
            return;
        }
        const rawId = cleanId(req.params.id);
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
            await removeReceipt(income.receiptUrl);
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