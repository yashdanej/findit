import { randomBytes, randomUUID } from "node:crypto";
import { pool } from "../config/database.js";
import { HttpError } from "../utils/http.js";
import { sendCouponClaimEmail } from "./email.service.js";

const discountPercent = 10;
const code = () => `FINDIT-${randomBytes(8).toString("hex").toUpperCase()}`;

export async function claimCoupon(productId: string, userId: string) {
  const product = (await pool.query(`SELECT p.id,p.title,p.seller_id,p.base_price,s.shop_name,u.email
    FROM products p JOIN sellers s ON s.id=p.seller_id JOIN users u ON u.id=?
    WHERE p.id=? AND p.status='APPROVED' AND s.verification_status='VERIFIED'`, [userId, productId])).rows[0];
  if (!product) throw new HttpError(404, "This product is not available for a FindIt coupon.", "PRODUCT_NOT_AVAILABLE");
  const originalPrice = Number(product.base_price);
  if (!Number.isFinite(originalPrice) || originalPrice <= 0) throw new HttpError(422, "This product does not have a verified price yet.", "PRODUCT_PRICE_UNAVAILABLE");
  const existing = (await pool.query("SELECT id FROM coupon_claims WHERE user_id=? AND product_id=? AND status IN ('CLAIMED','VERIFIED') AND expires_at>NOW()", [userId, productId])).rows[0];
  if (existing) throw new HttpError(409, "You already have an active coupon for this product.", "COUPON_ALREADY_CLAIMED");
  const id = randomUUID();
  const couponCode = code();
  const discountAmount = Math.round(originalPrice * discountPercent) / 100;
  const finalPrice = Math.round((originalPrice - discountAmount) * 100) / 100;
  await pool.query(`INSERT INTO coupon_claims (id,code,user_id,seller_id,product_id,discount_percent,original_price,discount_amount,final_price,expires_at)
    VALUES (?,?,?,?,?,?,?,?,?,DATE_ADD(NOW(), INTERVAL 24 HOUR))`, [id, couponCode, userId, product.seller_id, productId, discountPercent, originalPrice, discountAmount, finalPrice]);
  try {
    await sendCouponClaimEmail({ to: product.email, code: couponCode, seller: product.shop_name, product: product.title, claimedAt: new Date() });
  } catch (error) {
    await pool.query("UPDATE coupon_claims SET status='CANCELLED' WHERE id=?", [id]);
    console.error("Coupon email failed", { claimId: id, error });
    throw new HttpError(502, "We could not send your coupon email, so the coupon was not created.", "COUPON_EMAIL_FAILED");
  }
  return { id, code: couponCode, discountPercent, originalPrice, discountAmount, finalPrice, expiresIn: "24 hours" };
}

export async function verifyCoupon(couponCode: string, sellerId: string) {
  const row = (await pool.query(`SELECT c.*,p.title product_title,u.full_name,u.email,s.shop_name
    FROM coupon_claims c JOIN products p ON p.id=c.product_id LEFT JOIN users u ON u.id=c.user_id JOIN sellers s ON s.id=c.seller_id
    WHERE c.code=? AND c.seller_id=?`, [couponCode.trim().toUpperCase(), sellerId])).rows[0];
  if (!row) throw new HttpError(404, "Coupon code is invalid or belongs to another seller.", "COUPON_NOT_FOUND");
  if (row.expires_at && new Date(row.expires_at) < new Date()) throw new HttpError(422, "This coupon has expired.", "COUPON_EXPIRED");
  if (row.status === "REDEEMED") throw new HttpError(409, "This coupon has already been used.", "COUPON_ALREADY_USED");
  if (row.status === "CANCELLED") throw new HttpError(422, "This coupon was cancelled.", "COUPON_CANCELLED");
  if (row.verification_status === "VERIFIED") throw new HttpError(409, "This coupon has already been verified.", "COUPON_ALREADY_VERIFIED");
  await pool.query("UPDATE coupon_claims SET status='VERIFIED',verification_status='VERIFIED',verified_at=NOW() WHERE id=? AND seller_id=? AND status='CLAIMED'", [row.id, sellerId]);
  return { ...row, status: "VERIFIED", verification_status: "VERIFIED" };
}

export async function redeemCoupon(couponCode: string, sellerId: string) {
  const result = await pool.query("UPDATE coupon_claims SET status='REDEEMED',redeemed_at=NOW() WHERE code=? AND seller_id=? AND status='VERIFIED'", [couponCode.trim().toUpperCase(), sellerId]);
  if (!result.affectedRows) throw new HttpError(404, "Verified coupon not found or has already been redeemed.", "COUPON_NOT_FOUND");
  return { success: true };
}