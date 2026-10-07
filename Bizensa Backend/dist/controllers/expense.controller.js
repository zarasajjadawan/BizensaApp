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
exports.getExpenses = exports.createExpense = void 0;
const joi_1 = __importDefault(require("joi"));
const expense_model_1 = __importStar(require("../models/expense.model"));
// Validation lives here so it always matches what the app sends
const createExpenseSchema = joi_1.default.object({
    amount: joi_1.default.number().positive().required(),
    category: joi_1.default.string().valid(...expense_model_1.EXPENSE_CATEGORIES).required(),
    date: joi_1.default.date().required(),
    paymentMethod: joi_1.default.string().valid(...expense_model_1.PAYMENT_METHODS).required(),
    description: joi_1.default.string().allow("").optional(),
}).unknown(true); // ignore any extra fields
// Works whether protect sets req.userId or req.user
const getUserId = (req) => {
    const r = req;
    return r.userId ?? r.user?._id ?? r.user?.id;
};
// POST /api/expenses  (multipart/form-data)
const createExpense = async (req, res) => {
    try {
        console.log("BODY:", req.body, "FILE:", req.file?.filename, "USER:", getUserId(req));
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
        const file = req.file;
        const expense = await expense_model_1.default.create({
            amount: value.amount,
            category: value.category,
            date: value.date,
            paymentMethod: value.paymentMethod,
            description: value.description ?? "",
            user: userId,
            receiptUrl: file ? `/uploads/${file.filename}` : undefined,
        });
        res.status(201).json({ success: true, message: "Expense saved", data: { expense } });
    }
    catch (err) {
        console.error("Create Expense Error:", err);
        res.status(500).json({
            success: false,
            message: err?.message || "Something went wrong. Please try again later.",
        });
    }
};
exports.createExpense = createExpense;
// GET /api/expenses
const getExpenses = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, message: "Not authorized" });
            return;
        }
        const expenses = await expense_model_1.default.find({ user: userId }).sort({ date: -1 });
        res.status(200).json({ success: true, data: { expenses } });
    }
    catch (err) {
        console.error("Get Expenses Error:", err);
        res.status(500).json({
            success: false,
            message: err?.message || "Something went wrong. Please try again later.",
        });
    }
};
exports.getExpenses = getExpenses;
//# sourceMappingURL=expense.controller.js.map