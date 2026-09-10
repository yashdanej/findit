import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sellerRepository } from "../repositories/seller.repository.js";
import { HttpError } from "../utils/http.js";
const token = (sellerId: string) =>
  jwt.sign({ sellerId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  } as jwt.SignOptions);
export const authService = {
  register: async (x: {
    email: string;
    mobileNumber?: string;
    shopName: string;
    password: string;
  }) => {
    if (await sellerRepository.findByEmail(x.email))
      throw new HttpError(409, "Email is already registered.", "EMAIL_ALREADY_REGISTERED", { email: "This email is already registered." });
    const seller = await sellerRepository.create(
      x.email,
      x.mobileNumber || null,
      x.shopName,
      await bcrypt.hash(x.password, 12),
    );
    return { seller, token: token(seller.id) };
  },
  login: async (email: string, password: string) => {
    const seller = await sellerRepository.findByEmail(email);
    if (!seller || !(await bcrypt.compare(password, seller.password_hash)))
      throw new HttpError(401, "Invalid mobile number or password.", "INVALID_CREDENTIALS");
    return {
      seller: {
        id: seller.id,
        shopName: seller.shop_name,
        verificationStatus: seller.verification_status,
      },
      token: token(seller.id),
    };
  },
};
