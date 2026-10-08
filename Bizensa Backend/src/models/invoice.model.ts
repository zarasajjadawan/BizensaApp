import mongoose, { Schema, Types } from "mongoose";

export interface IInvoice {
    user: Types.ObjectId;
    invoiceNumber: string;
    customer: string;
    items: { name: string; qty: number; price: number }[];
    subtotal: number;
    tax: number;
    total: number;
    dueDate: Date;
    status: "unpaid" | "paid" | "overdue";
    paidAt?: Date | null;
}

const invoiceSchema = new Schema<IInvoice>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        invoiceNumber: { type: String, required: true },
        customer: { type: String, required: true, trim: true },
        items: [
            {
                _id: false,
                name: { type: String, required: true, trim: true },
                qty: { type: Number, required: true, min: 1 },
                price: { type: Number, required: true, min: 0 },
            },
        ],
        subtotal: { type: Number, required: true },
        tax: { type: Number, required: true },
        total: { type: Number, required: true },
        dueDate: { type: Date, required: true },
        status: { type: String, enum: ["unpaid", "paid", "overdue"], default: "unpaid" },
        paidAt: { type: Date, default: null },
    },
    { timestamps: true }
);

invoiceSchema.index({ user: 1, invoiceNumber: 1 }, { unique: true });

export default mongoose.model<IInvoice>("Invoice", invoiceSchema);