"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllData = void 0;
const expense_model_1 = __importDefault(require("../models/expense.model"));
const income_model_1 = __importDefault(require("../models/income.model"));
const customer_model_1 = __importDefault(require("../models/customer.model"));
const invoice_model_1 = __importDefault(require("../models/invoice.model"));
// Builds an optional { $gte, $lte } date filter from ?from=YYYY-MM-DD&to=YYYY-MM-DD
const buildDateFilter = (from, to) => {
    const filter = {};
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
const sum = (list) => list.reduce((total, item) => total + item.amount, 0);
// GET /api/data            -> everything for the logged-in user
// GET /api/data?from=2026-01-01&to=2026-01-31 -> expenses & income limited to that range
const getAllData = async (req, res) => {
    try {
        const dateFilter = buildDateFilter(req.query.from, req.query.to);
        const expenseQuery = { user: req.userId };
        const incomeQuery = { user: req.userId };
        if (dateFilter) {
            expenseQuery.date = dateFilter;
            incomeQuery.date = dateFilter;
        }
        const [expenses, income, customers, invoices] = await Promise.all([
            expense_model_1.default.find(expenseQuery).sort({ date: -1 }).lean(),
            income_model_1.default.find(incomeQuery).sort({ date: -1 }).lean(),
            customer_model_1.default.find({ user: req.userId }).sort({ name: 1 }).lean(),
            invoice_model_1.default.find({ user: req.userId }).sort({ createdAt: -1 }).lean(),
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
    }
    catch (err) {
        console.error("Get All Data Error:", err);
        res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};
exports.getAllData = getAllData;
//# sourceMappingURL=data.controller.js.map