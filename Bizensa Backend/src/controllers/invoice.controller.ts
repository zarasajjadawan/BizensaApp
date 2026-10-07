import { Response } from "express";
import Invoice from "../models/invoice.model";
import { invoiceSchema } from "../validations/finance.validation";
import { AuthRequest } from "../middleware/auth.middleware";

// IMPORTANT: must be the same value as TAX_RATE in your app's constants/invoices.ts
const TAX_RATE = 0.17;

// POST /api/invoices
export const createInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { error, value } = invoiceSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: error.details[0].message });
            return;
        }

        // Never trust totals from the client; recalculate
        const subtotal = value.items.reduce(
            (sum: number, i: { qty: number; price: number }) => sum + i.qty * i.price,
            0
        );
        const tax = Math.round(subtotal * TAX_RATE);
        const total = subtotal + tax;

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