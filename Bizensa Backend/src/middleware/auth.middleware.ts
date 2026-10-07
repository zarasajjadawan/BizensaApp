import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    userId?: string;
}

export const protect = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        res.status(401).json({
            success: false,
            message: "Not authorized, token missing",
        });
        return;
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
            id: string;
        };
        req.userId = decoded.id;
        next();
    } catch (err) {
        res.status(401).json({
            success: false,
            message: "Not authorized, token invalid or expired",
        });
    }
};