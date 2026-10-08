"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.changePassword = exports.updateMe = exports.getMe = exports.login = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const joi_1 = __importDefault(require("joi"));
const crypto_1 = __importDefault(require("crypto"));
const user_model_1 = __importDefault(require("../models/user.model"));
const auth_validation_1 = require("../validations/auth.validation");
const generateToken_1 = require("../utils/generateToken");
const Sendemail_1 = require("../utils/Sendemail");
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
                    businessType: user.businessType,
                    businessPhone: user.businessPhone,
                    businessAddress: user.businessAddress,
                    taxNumber: user.taxNumber,
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
const updateMeSchema = joi_1.default.object({
    name: joi_1.default.string().trim().min(2).max(60).messages({
        "string.empty": "Full name is required",
        "string.min": "Name must be at least 2 characters",
    }),
    businessName: joi_1.default.string().trim().min(2).max(100).messages({
        "string.empty": "Business name is required",
        "string.min": "Business name must be at least 2 characters",
    }),
    businessType: joi_1.default.string().trim().max(60).allow(""),
    businessPhone: joi_1.default.string().trim().max(30).allow(""),
    businessAddress: joi_1.default.string().trim().max(250).allow(""),
    taxNumber: joi_1.default.string().trim().max(40).allow(""),
}).or("name", "businessName", "businessType", "businessPhone", "businessAddress", "taxNumber")
    .messages({ "object.missing": "Nothing to update" });
// @route  PUT /api/auth/me
// Updates only the profile fields above. email / password are ignored.
const updateMe = async (req, res) => {
    try {
        const { error, value } = updateMeSchema.validate(req.body, { stripUnknown: true });
        if (error) {
            res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
            return;
        }
        const user = await user_model_1.default.findByIdAndUpdate(req.userId, { $set: value }, { new: true, runValidators: true }).select("-password");
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    businessName: user.businessName,
                    businessType: user.businessType,
                    businessPhone: user.businessPhone,
                    businessAddress: user.businessAddress,
                    taxNumber: user.taxNumber,
                    email: user.email,
                    createdAt: user.createdAt,
                },
            },
        });
    }
    catch (err) {
        console.error("UpdateMe Error:", err);
        res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};
exports.updateMe = updateMe;
const changePasswordSchema = joi_1.default.object({
    currentPassword: joi_1.default.string().required().messages({
        "string.empty": "Current password is required",
        "any.required": "Current password is required",
    }),
    newPassword: joi_1.default.string().min(8).max(128).required().messages({
        "string.empty": "New password is required",
        "string.min": "New password must be at least 8 characters",
        "any.required": "New password is required",
    }),
});
// @route  POST /api/auth/change-password
const changePassword = async (req, res) => {
    try {
        const { error, value } = changePasswordSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
            return;
        }
        const { currentPassword, newPassword } = value;
        const user = await user_model_1.default.findById(req.userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        const isCurrentCorrect = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isCurrentCorrect) {
            // 400 (not 401) so the app doesn't treat this as an expired session
            res.status(400).json({
                success: false,
                message: "Current password is incorrect",
            });
            return;
        }
        const isSameAsOld = await bcryptjs_1.default.compare(newPassword, user.password);
        if (isSameAsOld) {
            res.status(400).json({
                success: false,
                message: "New password must be different from the current password",
            });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        user.password = await bcryptjs_1.default.hash(newPassword, salt);
        await user.save();
        res.status(200).json({
            success: true,
            message: "Password updated successfully",
        });
    }
    catch (err) {
        console.error("ChangePassword Error:", err);
        res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};
exports.changePassword = changePassword;
/* =====================================================================
   Forgot / reset password (6-digit code sent by email)
   ===================================================================== */
const RESET_CODE_TTL_MS = 15 * 60 * 1000; // code is valid for 15 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 code per minute per account
const MAX_RESET_ATTEMPTS = 5; // wrong guesses before the code is burned
const hashCode = (email, code) => crypto_1.default.createHash("sha256").update(`${email}:${code}`).digest("hex");
const safeEqual = (a, b) => {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return bufA.length === bufB.length && crypto_1.default.timingSafeEqual(bufA, bufB);
};
const forgotPasswordSchema = joi_1.default.object({
    email: joi_1.default.string().trim().lowercase().email({ tlds: { allow: false } }).required().messages({
        "string.empty": "Email is required",
        "string.email": "Enter a valid email address",
        "any.required": "Email is required",
    }),
});
const resetPasswordSchema = joi_1.default.object({
    email: joi_1.default.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
    code: joi_1.default.string().pattern(/^\d{6}$/).required().messages({
        "string.pattern.base": "Enter the 6-digit code",
        "string.empty": "Enter the 6-digit code",
        "any.required": "Enter the 6-digit code",
    }),
    newPassword: joi_1.default.string().min(8).max(128).required().messages({
        "string.min": "New password must be at least 8 characters",
        "string.empty": "New password is required",
        "any.required": "New password is required",
    }),
});
// @route  POST /api/auth/forgot-password
// Always answers the same way, so nobody can find out which emails have accounts.
const forgotPassword = async (req, res) => {
    try {
        const { error, value } = forgotPasswordSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
            return;
        }
        const generic = {
            success: true,
            message: "If an account exists for this email, a reset code has been sent.",
        };
        const { email } = value;
        const user = await user_model_1.default.findOne({ email }).select("+resetRequestedAt");
        if (!user) {
            res.status(200).json(generic);
            return;
        }
        // Cooldown: ignore requests that come too fast (still answer the same)
        if (user.resetRequestedAt &&
            Date.now() - user.resetRequestedAt.getTime() < RESEND_COOLDOWN_MS) {
            res.status(200).json(generic);
            return;
        }
        const code = String(crypto_1.default.randomInt(100000, 1000000));
        await user_model_1.default.updateOne({ _id: user._id }, {
            $set: {
                resetCodeHash: hashCode(email, code),
                resetCodeExpires: new Date(Date.now() + RESET_CODE_TTL_MS),
                resetAttempts: 0,
                resetRequestedAt: new Date(),
            },
        });
        await (0, Sendemail_1.sendResetCodeEmail)(user.email, user.name, code);
        res.status(200).json(generic);
    }
    catch (err) {
        console.error("ForgotPassword Error:", err);
        res.status(500).json({
            success: false,
            message: "Could not send the reset code. Please try again later.",
        });
    }
};
exports.forgotPassword = forgotPassword;
// @route  POST /api/auth/reset-password
const resetPassword = async (req, res) => {
    try {
        const { error, value } = resetPasswordSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
            return;
        }
        const { email, code, newPassword } = value;
        const user = await user_model_1.default.findOne({ email }).select("+resetCodeHash +resetCodeExpires +resetAttempts");
        // ---- TEMP DEBUG LOG (testing ke baad hata dein) ----
        console.log("[RESET]", {
            found: !!user,
            hasHash: !!user?.resetCodeHash,
            expires: user?.resetCodeExpires,
            now: new Date(),
            attempts: user?.resetAttempts,
            hashMatches: user?.resetCodeHash
                ? safeEqual(hashCode(email, code), user.resetCodeHash)
                : null,
        });
        // ----------------------------------------------------
        const invalid = () => res.status(400).json({
            success: false,
            message: "Invalid or expired code",
        });
        if (!user ||
            !user.resetCodeHash ||
            !user.resetCodeExpires ||
            user.resetCodeExpires.getTime() < Date.now()) {
            invalid();
            return;
        }
        if ((user.resetAttempts ?? 0) >= MAX_RESET_ATTEMPTS) {
            res.status(400).json({
                success: false,
                message: "Too many wrong attempts. Please request a new code.",
            });
            return;
        }
        if (!safeEqual(hashCode(email, code), user.resetCodeHash)) {
            await user_model_1.default.updateOne({ _id: user._id }, { $inc: { resetAttempts: 1 } });
            invalid();
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, salt);
        await user_model_1.default.updateOne({ _id: user._id }, {
            $set: { password: hashedPassword },
            $unset: {
                resetCodeHash: "",
                resetCodeExpires: "",
                resetAttempts: "",
                resetRequestedAt: "",
            },
        });
        res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now log in.",
        });
    }
    catch (err) {
        console.error("ResetPassword Error:", err);
        res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=auth.controller.js.map