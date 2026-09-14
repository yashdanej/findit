import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../utils/http.js";

export function requireUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return next(new HttpError(401, "Sign in to claim a FindIt coupon.", "AUTHENTICATION_REQUIRED"));
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET!) as { userId?: string; role?: string };
    if (!data.userId || data.role !== "USER") throw new Error();
    req.userId = data.userId;
    next();
  } catch {
    next(new HttpError(401, "Your session has expired. Please sign in again.", "INVALID_USER_TOKEN"));
  }
}