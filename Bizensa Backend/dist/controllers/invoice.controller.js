"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInvoices = exports.createInvoice = void 0;
const invoice_model_1 = __importDefault(require("../models/invoice.model"));
const finance_validation_1 = require("../validations/finance.validation");
// IMPORTANT: must be the same value as TAX_RATE in your app's constants/invoices.ts
const TAX_RATE = 0.17;
// POST /api/invoices
const createInvoice = async (req, res) => {
    try {
        const { error, value } = finance_validation_1.invoiceSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: error.details[0].message });
            return;
        }
        // Never trust totals from the client; recalculate
        const subtotal = value.items.reduce((sum, i) => sum + i.qty * i.price, 0);
        const tax = Math.round(subtotal * TAX_RATE);
        const total = subtotal + tax;
        // Per-user invoice number: INV-0001, INV-0002...
        const count = await invoice_model_1.default.countDocuments({ user: req.userId });
        const invoiceNumber = `INV-${String(count + 1).padStart(4, "0")}`;
        const invoice = await invoice_model_1.default.create({
            user: req.userId,
            invoiceNumber,
            customer: value.customer,
            items: value.items,
            subtotal,
            tax,
            total,
            dueDate: value.dueDate,
        });
        res.status(201).json({ success: true, message: "Invoice created", data: { invoice } });
    }
    catch (err) {
        console.error("Create Invoice Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};
exports.createInvoice = createInvoice;
// GET /api/invoices
const getInvoices = async (req, res) => {
    try {
        const invoices = await invoice_model_1.default.find({ user: req.userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: { invoices } });
    }
    catch (err) {
        console.error("Get Invoices Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};
exports.getInvoices = getInvoices;
//# sourceMappingURL=invoice.controller.js.map