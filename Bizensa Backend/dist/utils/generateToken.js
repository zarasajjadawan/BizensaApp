"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (userId) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not defined in .env file");
    }
    return jsonwebtoken_1.default.sign({ id: userId }, secret, {
        expiresIn: "7d",
    });
};
exports.generateToken = generateToken;
//# sourceMappingURL=generateToken.js.map