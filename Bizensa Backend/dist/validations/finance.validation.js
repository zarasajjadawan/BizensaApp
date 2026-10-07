"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceSchema = exports.customerSchema = exports.incomeSchema = exports.expenseSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const optionalText = joi_1.default.string().trim().allow("", null);
exports.expenseSchema = joi_1.default.object({
    amount: joi_1.default.number().greater(0).required(),
    category: joi_1.default.string().trim().required(),
    date: joi_1.default.date().iso().required(),
    paymentMethod: joi_1.default.string().trim().required(),
    description: optionalText,
});
exports.incomeSchema = joi_1.default.object({
    amount: joi_1.default.number().greater(0).required(),
    category: joi_1.default.string().trim().required(),
    customer: optionalText,
    date: joi_1.default.date().iso().required(),
    paymentMethod: joi_1.default.string().trim().required(),
    description: optionalText,
});
exports.customerSchema = joi_1.default.object({
    name: joi_1.default.string().trim().min(2).max(100).required(),
    businessName: optionalText,
    phone: optionalText,
    email: joi_1.default.string().trim().email().allow("", null),
    address: optionalText,
});
exports.invoiceSchema = joi_1.default.object({
    customer: joi_1.default.string().trim().required(),
    items: joi_1.default.array()
        .items(joi_1.default.object({
        name: joi_1.default.string().trim().required(),
        qty: joi_1.default.number().integer().min(1).required(),
        price: joi_1.default.number().min(0).required(),
    }))
        .min(1)
        .required(),
    dueDate: joi_1.default.date().iso().required(),
    // subtotal / tax / total are sent by the app but ignored; the server recalculates them
}).unknown(true);
//# sourceMappingURL=finance.validation.js.map