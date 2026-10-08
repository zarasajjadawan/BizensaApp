import { Response } from "express";
import fs from "fs";
import Income from "../models/income.model";
import { incomeSchema } from "../validations/finance.validation";
import { AuthRequest } from "../middleware/auth.middleware";

// Removes a file multer just saved (used when validation fails). Never throws.
const removeUploaded = async (file?: Express.Multer.File): Promise<void> => {
    if (!file) return;
    try {
        await fs.promises.unlink(file.path);
    } catch {
        // ignore
    }
};

// POST /api/income  (multipart/form-data, optional "receipt" image)
export const createIncome = async (req: AuthRequest, res: Response): Promise<void> => {
    const file = (req as any).file as Express.Multer.File | undefined;

    try {
        console.log("INCOME BODY:", req.body, "FILE:", file?.filename, "TYPE:", req.headers["content-type"]);

        const { error, value } = incomeSchema.validate(req.body ?? {}, {
            convert: true,       // multipart sends everything as strings ("5000" -> 5000)
            allowUnknown: true,  // ignore extra fields
        });
        if (error) {
            await removeUploaded(file);
            res.status(400).json({ success: false, message: error.details[0].message });
            return;
        }

        const income = await Income.create({
            ...value,
            customer: value.customer || null,
            user: req.userId,
            receiptUrl: file ? `/uploads/${file.filename}` : undefined,
        });
        res.status(201).json({ success: true, message: "Income saved", data: { income } });
    } catch (err) {
        await removeUploaded(file);
        console.error("Create Income Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};

// GET /api/income
export const getIncome = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const income = await Income.find({ user: req.userId }).sort({ date: -1 });
        res.status(200).json({ success: true, data: { income } });
    } catch (err) {
        console.error("Get Income Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};