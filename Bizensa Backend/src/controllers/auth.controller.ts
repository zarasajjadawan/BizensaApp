import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Joi from "joi";
import crypto from "crypto";
import User from "../models/user.model";
import { signupSchema, loginSchema } from "../validations/auth.validation";
import { generateToken } from "../utils/generateToken";
import { sendResetCodeEmail } from "../utils/Sendemail";
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
                    businessType: user.businessType,
                    businessPhone: user.businessPhone,
                    businessAddress: user.businessAddress,
                    taxNumber: user.taxNumber,
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

const updateMeSchema = Joi.object({
    name: Joi.string().trim().min(2).max(60).messages({
        "string.empty": "Full name is required",
        "string.min": "Name must be at least 2 characters",
    }),
    businessName: Joi.string().trim().min(2).max(100).messages({
        "string.empty": "Business name is required",
        "string.min": "Business name must be at least 2 characters",
    }),
    businessType: Joi.string().trim().max(60).allow(""),
    businessPhone: Joi.string().trim().max(30).allow(""),
    businessAddress: Joi.string().trim().max(250).allow(""),
    taxNumber: Joi.string().trim().max(40).allow(""),
}).or("name", "businessName", "businessType", "businessPhone", "businessAddress", "taxNumber")
    .messages({ "object.missing": "Nothing to update" });

// @route  PUT /api/auth/me
// Updates only the profile fields above. email / password are ignored.
export const updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { error, value } = updateMeSchema.validate(req.body, { stripUnknown: true });

        if (error) {
            res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
            return;
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { $set: value },
            { new: true, runValidators: true }
        ).select("-password");

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
    } catch (err) {
        console.error("UpdateMe Error:", err);
        res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required().messages({
        "string.empty": "Current password is required",
        "any.required": "Current password is required",
    }),
    newPassword: Joi.string().min(8).max(128).required().messages({
        "string.empty": "New password is required",
        "string.min": "New password must be at least 8 characters",
        "any.required": "New password is required",
    }),
});

// @route  POST /api/auth/change-password
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const user = await User.findById(req.userId);

        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }

        const isCurrentCorrect = await bcrypt.compare(currentPassword, user.password);

        if (!isCurrentCorrect) {
            // 400 (not 401) so the app doesn't treat this as an expired session
            res.status(400).json({
                success: false,
                message: "Current password is incorrect",
            });
            return;
        }

        const isSameAsOld = await bcrypt.compare(newPassword, user.password);

        if (isSameAsOld) {
            res.status(400).json({
                success: false,
                message: "New password must be different from the current password",
            });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password updated successfully",
        });
    } catch (err) {
        console.error("ChangePassword Error:", err);
        res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};

/* =====================================================================
   Forgot / reset password (6-digit code sent by email)
   ===================================================================== */

const RESET_CODE_TTL_MS = 15 * 60 * 1000; // code is valid for 15 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 code per minute per account
const MAX_RESET_ATTEMPTS = 5; // wrong guesses before the code is burned

const hashCode = (email: string, code: string) =>
    crypto.createHash("sha256").update(`${email}:${code}`).digest("hex");

const safeEqual = (a: string, b: string) => {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

const forgotPasswordSchema = Joi.object({
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required().messages({
        "string.empty": "Email is required",
        "string.email": "Enter a valid email address",
        "any.required": "Email is required",
    }),
});

const resetPasswordSchema = Joi.object({
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
    code: Joi.string().pattern(/^\d{6}$/).required().messages({
        "string.pattern.base": "Enter the 6-digit code",
        "string.empty": "Enter the 6-digit code",
        "any.required": "Enter the 6-digit code",
    }),
    newPassword: Joi.string().min(8).max(128).required().messages({
        "string.min": "New password must be at least 8 characters",
        "string.empty": "New password is required",
        "any.required": "New password is required",
    }),
});

// @route  POST /api/auth/forgot-password
// Always answers the same way, so nobody can find out which emails have accounts.
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
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

        const user = await User.findOne({ email }).select("+resetRequestedAt");

        if (!user) {
            res.status(200).json(generic);
            return;
        }

        // Cooldown: ignore requests that come too fast (still answer the same)
        if (
            user.resetRequestedAt &&
            Date.now() - user.resetRequestedAt.getTime() < RESEND_COOLDOWN_MS
        ) {
            res.status(200).json(generic);
            return;
        }

        const code = String(crypto.randomInt(100000, 1000000));

        await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    resetCodeHash: hashCode(email, code),
                    resetCodeExpires: new Date(Date.now() + RESET_CODE_TTL_MS),
                    resetAttempts: 0,
                    resetRequestedAt: new Date(),
                },
            }
        );

        await sendResetCodeEmail(user.email, user.name, code);

        res.status(200).json(generic);
    } catch (err) {
        console.error("ForgotPassword Error:", err);
        res.status(500).json({
            success: false,
            message: "Could not send the reset code. Please try again later.",
        });
    }
};

// @route  POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
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

        const user = await User.findOne({ email }).select(
            "+resetCodeHash +resetCodeExpires +resetAttempts"
        );

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

        const invalid = () =>
            res.status(400).json({
                success: false,
                message: "Invalid or expired code",
            });

        if (
            !user ||
            !user.resetCodeHash ||
            !user.resetCodeExpires ||
            user.resetCodeExpires.getTime() < Date.now()
        ) {
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
            await User.updateOne({ _id: user._id }, { $inc: { resetAttempts: 1 } });
            invalid();
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.updateOne(
            { _id: user._id },
            {
                $set: { password: hashedPassword },
                $unset: {
                    resetCodeHash: "",
                    resetCodeExpires: "",
                    resetAttempts: "",
                    resetRequestedAt: "",
                },
            }
        );

        res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now log in.",
        });
    } catch (err) {
        console.error("ResetPassword Error:", err);
        res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};