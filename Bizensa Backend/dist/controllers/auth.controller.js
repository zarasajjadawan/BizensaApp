"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = __importDefault(require("../models/user.model"));
const auth_validation_1 = require("../validations/auth.validation");
const generateToken_1 = require("../utils/generateToken");
// @route  POST /api/auth/signup
const signup = async (req, res) => {
    try {
        const { error, value } = auth_validation_1.signupSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
            return;
        }
        const { name, email, password, businessName } = value;
        const existingUser = await user_model_1.default.findOne({ email });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: "An account with this email already exists",
            });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const newUser = await user_model_1.default.create({
            name,
            businessName,
            email,
            password: hashedPassword,
        });
        const token = (0, generateToken_1.generateToken)(newUser._id.toString());
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
    }
    catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};
exports.signup = signup;
// @route  POST /api/auth/login
const login = async (req, res) => {
    try {
        const { error, value } = auth_validation_1.loginSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
            return;
        }
        const { email, password } = value;
        const user = await user_model_1.default.findOne({ email });
        if (!user) {
            res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
            return;
        }
        const isPasswordCorrect = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordCorrect) {
            res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
            return;
        }
        const token = (0, generateToken_1.generateToken)(user._id.toString());
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
    }
    catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};
exports.login = login;
// @route  GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const user = await user_model_1.default.findById(req.userId).select("-password");
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
    }
    catch (err) {
        console.error("GetMe Error:", err);
        res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};
exports.getMe = getMe;
//# sourceMappingURL=auth.controller.js.map