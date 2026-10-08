import { Response } from "express";
import mongoose from "mongoose";
import Customer from "../models/customer.model";
import { customerSchema } from "../validations/finance.validation";
import { AuthRequest } from "../middleware/auth.middleware";

// POST /api/customers
export const createCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { error, value } = customerSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: error.details[0].message });
            return;
        }

        const customer = await Customer.create({ ...value, user: req.userId });
        res.status(201).json({ success: true, message: "Customer saved", data: { customer } });
    } catch (err) {
        console.error("Create Customer Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};

// GET /api/customers
export const getCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const customers = await Customer.find({ user: req.userId }).sort({ name: 1 });
        res.status(200).json({ success: true, data: { customers } });
    } catch (err) {
        console.error("Get Customers Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};

// PUT /api/customers/:id
export const updateCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: "Invalid customer id" });
            return;
        }

        const { error, value } = customerSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: error.details[0].message });
            return;
        }

        // Only the owner can edit their own customer
        const customer = await Customer.findOneAndUpdate(
            { _id: req.params.id, user: req.userId },
            { $set: value },
            { new: true, runValidators: true }
        );

        if (!customer) {
            res.status(404).json({ success: false, message: "Customer not found" });
            return;
        }

        res.status(200).json({ success: true, message: "Customer updated", data: { customer } });
    } catch (err) {
        console.error("Update Customer Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};

// DELETE /api/customers/:id
export const deleteCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: "Invalid customer id" });
            return;
        }

        const customer = await Customer.findOneAndDelete({ _id: req.params.id, user: req.userId });

        if (!customer) {
            res.status(404).json({ success: false, message: "Customer not found" });
            return;
        }

        res.status(200).json({ success: true, message: "Customer deleted", data: { id: req.params.id } });
    } catch (err) {
        console.error("Delete Customer Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};