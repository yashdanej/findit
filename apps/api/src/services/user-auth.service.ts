import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { pool } from "../config/database.js";
import { HttpError } from "../utils/http.js";

const makeToken = (userId: string) => jwt.sign({ userId, role: "USER" }, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as jwt.SignOptions);
export const userAuthService = {
  register: async (email: string, password: string, fullName?: string) => {
    const exists = (await pool.query("SELECT id FROM users WHERE email=?", [email])).rows[0];
    if (exists) throw new HttpError(409, "Email is already registered.", "EMAIL_ALREADY_REGISTERED", { email: "This email is already registered." });
    const id = randomUUID();
    await pool.query("INSERT INTO users (id,email,password_hash,full_name) VALUES (?,?,?,?)", [id, email, await bcrypt.hash(password, 12), fullName || null]);
    return { user: { id, email, fullName: fullName || null }, token: makeToken(id) };
  },
  login: async (email: string, password: string) => {
    const user = (await pool.query("SELECT * FROM users WHERE email=?", [email])).rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) throw new HttpError(401, "Invalid email or password.", "INVALID_CREDENTIALS");
    return { user: { id: user.id, email: user.email, fullName: user.full_name }, token: makeToken(user.id) };
  },
};
