import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../utils/http.js";
export function requireSeller(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return next(new HttpError(401, "Authentication required"));
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET!) as {
      sellerId: string;
      role?: string;
    };
    if (!data.sellerId || data.role === "ADMIN") throw new Error();
    req.sellerId = data.sellerId;
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
}
