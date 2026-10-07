import { Response } from "express";
import Expense from "../models/expense.model";
import Income from "../models/income.model";
import Customer from "../models/customer.model";
import Invoice from "../models/invoice.model";
import { AuthRequest } from "../middleware/auth.middleware";

// Builds an optional { $gte, $lte } date filter from ?from=YYYY-MM-DD&to=YYYY-MM-DD
const buildDateFilter = (from?: unknown, to?: unknown) => {
    const filter: { $gte?: Date; $lte?: Date } = {};

    if (typeof from === "string" && !isNaN(Date.parse(from))) {
        filter.$gte = new Date(from);
    }
    if (typeof to === "string" && !isNaN(Date.parse(to))) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999); // include the whole "to" day
        filter.$lte = end;
    }

    return Object.keys(filter).length ? filter : undefined;
};

const sum = (list: { amount: number }[]) =>
    list.reduce((total, item) => total + item.amount, 0);

// GET /api/data            -> everything for the logged-in user
// GET /api/data?from=2026-01-01&to=2026-01-31 -> expenses & income limited to that range
export const getAllData = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const dateFilter = buildDateFilter(req.query.from, req.query.to);

        const expenseQuery: Record<string, unknown> = { user: req.userId };
        const incomeQuery: Record<string, unknown> = { user: req.userId };
        if (dateFilter) {
            expenseQuery.date = dateFilter;
            incomeQuery.date = dateFilter;
        }

        const [expenses, income, customers, invoices] = await Promise.all([
            Expense.find(expenseQuery).sort({ date: -1 }).lean(),
            Income.find(incomeQuery).sort({ date: -1 }).lean(),
            Customer.find({ user: req.userId }).sort({ name: 1 }).lean(),
            Invoice.find({ user: req.userId }).sort({ createdAt: -1 }).lean(),
        ]);

        const totalExpenses = sum(expenses);
        const totalIncome = sum(income);

        const unpaidInvoices = invoices.filter((i) => i.status !== "paid");
        const unpaidTotal = unpaidInvoices.reduce((t, i) => t + i.total, 0);

        res.status(200).json({
            success: true,
            data: {
                expenses,
                income,
                customers,
                invoices,
                summary: {
                    totalIncome,
                    totalExpenses,
                    balance: totalIncome - totalExpenses,
                    customerCount: customers.length,
                    invoiceCount: invoices.length,
                    unpaidInvoiceCount: unpaidInvoices.length,
                    unpaidInvoiceTotal: unpaidTotal,
                },
            },
        });
    } catch (err) {
        console.error("Get All Data Error:", err);
        res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};
