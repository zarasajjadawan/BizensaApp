"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIncome = exports.createIncome = void 0;
const income_model_1 = __importDefault(require("../models/income.model"));
const finance_validation_1 = require("../validations/finance.validation");
// POST /api/income
const createIncome = async (req, res) => {
    try {
        const { error, value } = finance_validation_1.incomeSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: error.details[0].message });
            return;
        }
        const income = await income_model_1.default.create({ ...value, customer: value.customer || null, user: req.userId });
        res.status(201).json({ success: true, message: "Income saved", data: { income } });
    }
    catch (err) {
        console.error("Create Income Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};
exports.createIncome = createIncome;
// GET /api/income
const getIncome = async (req, res) => {
    try {
        const income = await income_model_1.default.find({ user: req.userId }).sort({ date: -1 });
        res.status(200).json({ success: true, data: { income } });
    }
    catch (err) {
        console.error("Get Income Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};
exports.getIncome = getIncome;
//# sourceMappingURL=income.controller.js.map