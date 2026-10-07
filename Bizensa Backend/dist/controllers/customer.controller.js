"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomers = exports.createCustomer = void 0;
const customer_model_1 = __importDefault(require("../models/customer.model"));
const finance_validation_1 = require("../validations/finance.validation");
// POST /api/customers
const createCustomer = async (req, res) => {
    try {
        const { error, value } = finance_validation_1.customerSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: error.details[0].message });
            return;
        }
        const customer = await customer_model_1.default.create({ ...value, user: req.userId });
        res.status(201).json({ success: true, message: "Customer saved", data: { customer } });
    }
    catch (err) {
        console.error("Create Customer Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};
exports.createCustomer = createCustomer;
// GET /api/customers
const getCustomers = async (req, res) => {
    try {
        const customers = await customer_model_1.default.find({ user: req.userId }).sort({ name: 1 });
        res.status(200).json({ success: true, data: { customers } });
    }
    catch (err) {
        console.error("Get Customers Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};
exports.getCustomers = getCustomers;
//# sourceMappingURL=customer.controller.js.map