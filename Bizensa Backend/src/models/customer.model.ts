import mongoose, { Schema, Types } from "mongoose";

export interface ICustomer {
    user: Types.ObjectId;
    name: string;
    businessName?: string;
    phone?: string;
    email?: string;
    address?: string;
}

const customerSchema = new Schema<ICustomer>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        name: { type: String, required: true, trim: true },
        businessName: { type: String, trim: true, default: "" },
        phone: { type: String, trim: true, default: "" },
        email: { type: String, trim: true, lowercase: true, default: "" },
        address: { type: String, trim: true, default: "" },
    },
    { timestamps: true }
);

export default mongoose.model<ICustomer>("Customer", customerSchema);