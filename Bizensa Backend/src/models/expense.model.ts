import mongoose, { Schema, Types } from "mongoose";

export const EXPENSE_CATEGORIES = [
    "Office",
    "Travel",
    "Food",
    "Utilities",
    "Salaries",
    "Marketing",
    "Other",
] as const;

export const PAYMENT_METHODS = [
    "Cash",
    "Bank Account",
    "Credit Card",
    "Mobile Wallet",
] as const;

export interface IExpense {
    user: Types.ObjectId;
    amount: number;
    category: string;
    date: Date;
    paymentMethod: string;
    description?: string;
    receiptUrl?: string;
}

const expenseSchema = new Schema<IExpense>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        amount: { type: Number, required: true, min: [0.01, "Amount must be greater than 0"] },
        category: { type: String, required: true, trim: true, enum: EXPENSE_CATEGORIES },
        date: { type: Date, required: true, default: Date.now },
        paymentMethod: { type: String, required: true, trim: true, enum: PAYMENT_METHODS },
        description: { type: String, trim: true, default: "" },
        receiptUrl: { type: String },
    },
    { timestamps: true }
);

expenseSchema.index({ user: 1, date: -1 });

export default mongoose.model<IExpense>("Expense", expenseSchema);