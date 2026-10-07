"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("./config/db"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const expense_routes_1 = __importDefault(require("./routes/expense.routes"));
const income_routes_1 = __importDefault(require("./routes/income.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const invoice_routes_1 = __importDefault(require("./routes/invoice.routes"));
const data_routes_1 = __importDefault(require("./routes/data.routes"));
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Request logger (remove once everything works)
app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} | ${req.headers["content-type"] ?? "no content-type"}`);
    next();
});
// Connect to MongoDB
(0, db_1.default)();
// Health check
app.get("/", (_req, res) => {
    res.json({ success: true, message: "API is running" });
});
// Routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/expenses", expense_routes_1.default);
app.use("/api/income", income_routes_1.default);
app.use("/api/customers", customer_routes_1.default);
app.use("/api/invoices", invoice_routes_1.default);
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
app.use("/api/data", data_routes_1.default);
app.use("/api/transactions", transaction_routes_1.default);
// 404 handler (always JSON)
app.use((req, res) => {
    console.log("404 NOT FOUND:", req.method, req.originalUrl);
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});
// Error handler (must be last)
app.use((err, _req, res, _next) => {
    console.error("Server error:", err);
    res.status(err.status || 400).json({ success: false, message: err.message || "Request failed" });
});
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map