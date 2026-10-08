import mongoose, { Schema, Types } from "mongoose";

export interface IIncome {
    user: Types.ObjectId;
    amount: number;
    category: string;
    customer: string | null;
    date: Date;
    paymentMethod: string;
    description?: string;
    receiptUrl?: string | null;
}

const incomeSchema = new Schema<IIncome>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        amount: { type: Number, required: true, min: 0.01 },
        category: { type: String, required: true, trim: true },
        customer: { type: String, default: null },
        date: { type: Date, required: true },
        paymentMethod: { type: String, required: true },
        description: { type: String, trim: true, default: "" },
        receiptUrl: { type: String, default: null },
    },
    { timestamps: true }
);

export default mongoose.model<IIncome>("Income", incomeSchema);