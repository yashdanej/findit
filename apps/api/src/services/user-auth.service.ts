import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { pool } from "../config/database.js";
import { HttpError } from "../utils/http.js";

const makeToken = (userId: string) => jwt.sign({ userId, role: "USER" }, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as jwt.SignOptions);
export const userAuthService = {
  register: async (email: string | undefined, mobileNumber: string | undefined, password: string, fullName?: string) => {
    const exists = (await pool.query("SELECT id FROM users WHERE (email IS NOT NULL AND email=?) OR (mobile_number IS NOT NULL AND mobile_number=?)", [email || "", mobileNumber || ""])).rows[0];
    if (exists) throw new HttpError(409, "This email or mobile number is already registered.", "ACCOUNT_ALREADY_REGISTERED", { email: "Use different account details." });
    const id = randomUUID();
    await pool.query("INSERT INTO users (id,email,mobile_number,password_hash,full_name) VALUES (?,?,?,?,?)", [id, email || null, mobileNumber || null, await bcrypt.hash(password, 12), fullName?.trim() || null]);
    return { user: { id, email: email || null, mobileNumber: mobileNumber || null, fullName: fullName || null }, token: makeToken(id) };
  },
  login: async (identifier: string, password: string) => {
    const user = (await pool.query("SELECT * FROM users WHERE email=? OR mobile_number=?", [identifier, identifier])).rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) throw new HttpError(401, "Invalid email or password.", "INVALID_CREDENTIALS");
    return { user: { id: user.id, email: user.email, fullName: user.full_name }, token: makeToken(user.id) };
  },
};
