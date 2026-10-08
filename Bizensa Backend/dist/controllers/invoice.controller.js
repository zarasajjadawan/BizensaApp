"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInvoice = exports.markInvoicePaid = exports.updateInvoice = exports.getInvoices = exports.createInvoice = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const invoice_model_1 = __importDefault(require("../models/invoice.model"));
const finance_validation_1 = require("../validations/finance.validation");
// IMPORTANT: must be the same value as TAX_RATE in your app's constants/invoices.ts
const TAX_RATE = 0.17;
// Never trust totals from the client; always recalculate
const calcTotals = (items) => {
    const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0);
    const tax = Math.round(subtotal * TAX_RATE);
    return { subtotal, tax, total: subtotal + tax };
};
// POST /api/invoices
const createInvoice = async (req, res) => {
    try {
        const { error, value } = finance_validation_1.invoiceSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: error.details[0].message });
            return;
        }
        const { subtotal, tax, total } = calcTotals(value.items);
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
// PUT /api/invoices/:id  (customer, items, dueDate). Paid invoices cannot be edited.
const updateInvoice = async (req, res) => {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: "Invalid invoice id" });
            return;
        }
        const existing = await invoice_model_1.default.findOne({ _id: req.params.id, user: req.userId });
        if (!existing) {
            res.status(404).json({ success: false, message: "Invoice not found" });
            return;
        }
        if (existing.status === "paid") {
            res.status(400).json({ success: false, message: "Paid invoices can't be edited" });
            return;
        }
        const { error, value } = finance_validation_1.invoiceSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: error.details[0].message });
            return;
        }
        const { subtotal, tax, total } = calcTotals(value.items);
        const invoice = await invoice_model_1.default.findOneAndUpdate({ _id: req.params.id, user: req.userId }, {
            $set: {
                customer: value.customer,
                items: value.items,
                subtotal,
                tax,
                total,
                dueDate: value.dueDate,
            },
        }, { new: true, runValidators: true });
        res.status(200).json({ success: true, message: "Invoice updated", data: { invoice } });
    }
    catch (err) {
        console.error("Update Invoice Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};
exports.updateInvoice = updateInvoice;
// PATCH /api/invoices/:id/pay  -> status "paid" + paidAt (today)
// NOTE: `paidAt` MUST exist in the Invoice schema (models/invoice.model.ts),
// otherwise Mongoose strict mode silently drops it.
const markInvoicePaid = async (req, res) => {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: "Invalid invoice id" });
            return;
        }
        const existing = await invoice_model_1.default.findOne({ _id: req.params.id, user: req.userId });
        if (!existing) {
            res.status(404).json({ success: false, message: "Invoice not found" });
            return;
        }
        if (existing.status === "paid") {
            res.status(400).json({ success: false, message: "Invoice is already paid" });
            return;
        }
        const invoice = await invoice_model_1.default.findOneAndUpdate({ _id: req.params.id, user: req.userId }, { $set: { status: "paid", paidAt: new Date() } }, { new: true, runValidators: true });
        res.status(200).json({ success: true, message: "Invoice marked as paid", data: { invoice } });
    }
    catch (err) {
        console.error("Mark Invoice Paid Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};
exports.markInvoicePaid = markInvoicePaid;
// DELETE /api/invoices/:id
const deleteInvoice = async (req, res) => {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: "Invalid invoice id" });
            return;
        }
        const invoice = await invoice_model_1.default.findOneAndDelete({ _id: req.params.id, user: req.userId });
        if (!invoice) {
            res.status(404).json({ success: false, message: "Invoice not found" });
            return;
        }
        res.status(200).json({ success: true, message: "Invoice deleted", data: { id: req.params.id } });
    }
    catch (err) {
        console.error("Delete Invoice Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};
exports.deleteInvoice = deleteInvoice;
//# sourceMappingURL=invoice.controller.js.map