import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import { signupSchema, loginSchema } from "../validations/auth.validation";
import { generateToken } from "../utils/generateToken";
import { AuthRequest } from "../middleware/auth.middleware";

// @route  POST /api/auth/signup
export const signup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { error, value } = signupSchema.validate(req.body);

        if (error) {
            res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
            return;
        }

        const { name, email, password ,businessName} = value;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            res.status(409).json({
                success: false,
                message: "An account with this email already exists",
            });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name,
            businessName,
            email,
            password: hashedPassword,
        });

        const token = generateToken(newUser._id.toString());

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            data: {
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    businessName: newUser.businessName,
                    email: newUser.email,
                },
                token,
            },
        });
    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};

// @route  POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
            return;
        }

        const { email, password } = value;

        const user = await User.findOne({ email });

        if (!user) {
            res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
            return;
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
            return;
        }

        const token = generateToken(user._id.toString());

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                },
                token,
            },
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};

// @route  GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.userId).select("-password");

        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    businessName: user.businessName,
                    email: user.email,
                    createdAt: user.createdAt,
                },
            },
        });
    } catch (err) {
        console.error("GetMe Error:", err);
        res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};
