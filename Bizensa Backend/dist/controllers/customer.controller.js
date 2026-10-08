"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomer = exports.updateCustomer = exports.getCustomers = exports.createCustomer = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
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
// PUT /api/customers/:id
const updateCustomer = async (req, res) => {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: "Invalid customer id" });
            return;
        }
        const { error, value } = finance_validation_1.customerSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: error.details[0].message });
            return;
        }
        // Only the owner can edit their own customer
        const customer = await customer_model_1.default.findOneAndUpdate({ _id: req.params.id, user: req.userId }, { $set: value }, { new: true, runValidators: true });
        if (!customer) {
            res.status(404).json({ success: false, message: "Customer not found" });
            return;
        }
        res.status(200).json({ success: true, message: "Customer updated", data: { customer } });
    }
    catch (err) {
        console.error("Update Customer Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};
exports.updateCustomer = updateCustomer;
// DELETE /api/customers/:id
const deleteCustomer = async (req, res) => {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: "Invalid customer id" });
            return;
        }
        const customer = await customer_model_1.default.findOneAndDelete({ _id: req.params.id, user: req.userId });
        if (!customer) {
            res.status(404).json({ success: false, message: "Customer not found" });
            return;
        }
        res.status(200).json({ success: true, message: "Customer deleted", data: { id: req.params.id } });
    }
    catch (err) {
        console.error("Delete Customer Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};
exports.deleteCustomer = deleteCustomer;
//# sourceMappingURL=customer.controller.js.map