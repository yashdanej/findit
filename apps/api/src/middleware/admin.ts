import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../utils/http.js";
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const token=req.header("authorization")?.replace(/^Bearer\s+/i,"");
  if (!token) return next(new HttpError(401,"Admin authentication is required.","ADMIN_AUTH_REQUIRED"));
  try { const data=jwt.verify(token,process.env.JWT_SECRET!) as {role?:string}; if(data.role!=="ADMIN") throw new Error(); next(); }
  catch { next(new HttpError(403,"You are not authorized to perform this action.","ADMIN_FORBIDDEN")); }
}
