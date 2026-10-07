import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
    name: string;
    businessName: string;
    businessType?: string;
    businessPhone?: string;
    businessAddress?: string;
    taxNumber?: string;
    email: string;
    password: string;
    resetCodeHash?: string;
    resetCodeExpires?: Date;
    resetAttempts?: number;
    resetRequestedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 6,
        },
        businessName: {
            type: String,
            required: [true, "Business name is required"],
            trim: true,
        },
        businessType: { type: String, trim: true, default: "" },
        businessPhone: { type: String, trim: true, default: "" },
        businessAddress: { type: String, trim: true, default: "" },
        taxNumber: { type: String, trim: true, default: "" },

        // Forgot-password (never returned unless explicitly selected)
        resetCodeHash: { type: String, select: false },
        resetCodeExpires: { type: Date, select: false },
        resetAttempts: { type: Number, default: 0, select: false },
        resetRequestedAt: { type: Date, select: false },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;