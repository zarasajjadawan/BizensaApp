import Joi from "joi";

const optionalText = Joi.string().trim().allow("", null);

export const expenseSchema = Joi.object({
    amount: Joi.number().greater(0).required(),
    category: Joi.string().trim().required(),
    date: Joi.date().iso().required(),
    paymentMethod: Joi.string().trim().required(),
    description: optionalText,
});

export const incomeSchema = Joi.object({
    amount: Joi.number().greater(0).required(),
    category: Joi.string().trim().required(),
    customer: optionalText,
    date: Joi.date().iso().required(),
    paymentMethod: Joi.string().trim().required(),
    description: optionalText,
});

export const customerSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    businessName: optionalText,
    phone: optionalText,
    email: Joi.string().trim().email().allow("", null),
    address: optionalText,
});

export const invoiceSchema = Joi.object({
    customer: Joi.string().trim().required(),
    items: Joi.array()
        .items(
            Joi.object({
                name: Joi.string().trim().required(),
                qty: Joi.number().integer().min(1).required(),
                price: Joi.number().min(0).required(),
            })
        )
        .min(1)
        .required(),
    dueDate: Joi.date().iso().required(),
    // subtotal / tax / total are sent by the app but ignored; the server recalculates them
}).unknown(true);