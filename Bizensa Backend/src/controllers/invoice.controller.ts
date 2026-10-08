import { Response } from "express";
import mongoose from "mongoose";
import Invoice from "../models/invoice.model";
import { invoiceSchema } from "../validations/finance.validation";
import { AuthRequest } from "../middleware/auth.middleware";

// IMPORTANT: must be the same value as TAX_RATE in your app's constants/invoices.ts
const TAX_RATE = 0.17;

// Never trust totals from the client; always recalculate
const calcTotals = (items: { qty: number; price: number }[]) => {
    const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0);
    const tax = Math.round(subtotal * TAX_RATE);
    return { subtotal, tax, total: subtotal + tax };
};

// POST /api/invoices
export const createInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { error, value } = invoiceSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: error.details[0].message });
            return;
        }

        const { subtotal, tax, total } = calcTotals(value.items);

        // Per-user invoice number: INV-0001, INV-0002...
        const count = await Invoice.countDocuments({ user: req.userId });
        const invoiceNumber = `INV-${String(count + 1).padStart(4, "0")}`;

        const invoice = await Invoice.create({
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
    } catch (err) {
        console.error("Create Invoice Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};

// GET /api/invoices
export const getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const invoices = await Invoice.find({ user: req.userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: { invoices } });
    } catch (err) {
        console.error("Get Invoices Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};

// PUT /api/invoices/:id  (customer, items, dueDate). Paid invoices cannot be edited.
export const updateInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: "Invalid invoice id" });
            return;
        }

        const existing = await Invoice.findOne({ _id: req.params.id, user: req.userId });
        if (!existing) {
            res.status(404).json({ success: false, message: "Invoice not found" });
            return;
        }
        if (existing.status === "paid") {
            res.status(400).json({ success: false, message: "Paid invoices can't be edited" });
            return;
        }

        const { error, value } = invoiceSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: error.details[0].message });
            return;
        }

        const { subtotal, tax, total } = calcTotals(value.items);

        const invoice = await Invoice.findOneAndUpdate(
            { _id: req.params.id, user: req.userId },
            {
                $set: {
                    customer: value.customer,
                    items: value.items,
                    subtotal,
                    tax,
                    total,
                    dueDate: value.dueDate,
                },
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, message: "Invoice updated", data: { invoice } });
    } catch (err) {
        console.error("Update Invoice Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};

// PATCH /api/invoices/:id/pay  -> status "paid" + paidAt (today)
// NOTE: `paidAt` MUST exist in the Invoice schema (models/invoice.model.ts),
// otherwise Mongoose strict mode silently drops it.
export const markInvoicePaid = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: "Invalid invoice id" });
            return;
        }

        const existing = await Invoice.findOne({ _id: req.params.id, user: req.userId });
        if (!existing) {
            res.status(404).json({ success: false, message: "Invoice not found" });
            return;
        }
        if (existing.status === "paid") {
            res.status(400).json({ success: false, message: "Invoice is already paid" });
            return;
        }

        const invoice = await Invoice.findOneAndUpdate(
            { _id: req.params.id, user: req.userId },
            { $set: { status: "paid", paidAt: new Date() } },
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, message: "Invoice marked as paid", data: { invoice } });
    } catch (err) {
        console.error("Mark Invoice Paid Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};

// DELETE /api/invoices/:id
export const deleteInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: "Invalid invoice id" });
            return;
        }

        const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, user: req.userId });
        if (!invoice) {
            res.status(404).json({ success: false, message: "Invoice not found" });
            return;
        }

        res.status(200).json({ success: true, message: "Invoice deleted", data: { id: req.params.id } });
    } catch (err) {
        console.error("Delete Invoice Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};