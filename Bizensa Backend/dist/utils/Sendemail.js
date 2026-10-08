"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResetCodeEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendResetCodeEmail = async (to, name, code) => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("Email service is not configured");
        }
        console.log("[MAIL] SMTP env vars missing (check .env is loaded). " +
            `SMTP_HOST=${!!SMTP_HOST} SMTP_USER=${!!SMTP_USER} SMTP_PASS=${!!SMTP_PASS}`);
        console.log(`[DEV] Password reset code for ${to}: ${code}`);
        return;
    }
    const port = Number(SMTP_PORT || 587);
    const transporter = nodemailer_1.default.createTransport({
        host: SMTP_HOST,
        port,
        secure: port === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    // Login/connection check: clear error throwega (e.g. 535 Invalid login, ETIMEDOUT)
    try {
        await transporter.verify();
        console.log("[MAIL] SMTP connection verified");
    }
    catch (err) {
        console.error("[MAIL] SMTP verify FAILED:", err);
        throw err;
    }
    try {
        const info = await transporter.sendMail({
            from: MAIL_FROM || SMTP_USER,
            to,
            subject: "Your password reset code",
            text: `Hi ${name},\n\n` +
                `Your password reset code is: ${code}\n\n` +
                `It expires in 15 minutes. If you didn't ask for this, you can ignore this email.`,
            html: `<div style="font-family:Arial,sans-serif;max-width:420px">` +
                `<p>Hi ${name},</p>` +
                `<p>Your password reset code is:</p>` +
                `<p style="font-size:32px;font-weight:700;letter-spacing:6px">${code}</p>` +
                `<p>It expires in 15 minutes. If you didn't ask for this, you can ignore this email.</p>` +
                `</div>`,
        });
        console.log("[MAIL] Sent:", info.messageId, "| accepted:", info.accepted, "| rejected:", info.rejected);
    }
    catch (err) {
        console.error("[MAIL] sendMail FAILED:", err);
        throw err;
    }
};
exports.sendResetCodeEmail = sendResetCodeEmail;
//# sourceMappingURL=Sendemail.js.map