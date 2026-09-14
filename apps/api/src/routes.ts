import { Router } from "express";
import { authService } from "./services/auth.service.js";
import { asyncHandler, HttpError } from "./utils/http.js";
import {
  loginSchema,
  productSchema,
  registerSchema,
  shopSchema,
} from "./validators/seller.js";
import { requireSeller } from "./middleware/auth.js";
import { requireUser } from "./middleware/user-auth.js";
import { sellerRepository } from "./repositories/seller.repository.js";
import { productRepository } from "./repositories/product.repository.js";
import { productUpload } from "./middleware/upload.js";
import { shopImageUpload } from "./middleware/upload.js";
import { productMediaRepository } from "./repositories/product-media.repository.js";
import { uploadProductMedia, uploadShopImage } from "./services/media.service.js";
import { sellerMediaRepository } from "./repositories/seller-media.repository.js";
import { notificationRepository } from "./repositories/notification.repository.js";
import { requireAdmin } from "./middleware/admin.js";
import jwt from "jsonwebtoken";
import { reviewSchema } from "./validators/seller.js";
import { reviewRepository } from "./repositories/review.repository.js";
import {
  findSimilarProducts,
  indexProductImage,
} from "./services/ai-search.service.js";
import { userAuthService } from "./services/user-auth.service.js";
import { userAuthSchema } from "./validators/seller.js";
import { claimCoupon, redeemCoupon, verifyCoupon } from "./services/coupon.service.js";
export const api = Router();
api.post(
  "/user/auth/register",
  asyncHandler(async (req, res) => {
    const input = userAuthSchema.parse({
      ...req.body,
      email: String(req.body.email || "")
        .trim()
        .toLowerCase(),
    });
    res
      .status(201)
      .json(
        await userAuthService.register(
          input.email,
          input.password,
          input.fullName,
        ),
      );
  }),
);
api.post(
  "/user/auth/login",
  asyncHandler(async (req, res) => {
    const input = userAuthSchema.pick({ email: true, password: true }).parse({
      ...req.body,
      email: String(req.body.email || "")
        .trim()
        .toLowerCase(),
    });
    res.json(await userAuthService.login(input.email, input.password));
  }),
);
api.get("/user/me", requireUser, asyncHandler(async (req, res) => {
  const { pool } = await import("./config/database.js");
  const user = (await pool.query("SELECT id,email,full_name,mobile_number FROM users WHERE id=?", [req.userId])).rows[0];
  if (!user) throw new HttpError(404, "Your profile could not be found.", "USER_NOT_FOUND");
  res.json({ success: true, data: user });
}));
api.patch("/user/me", requireUser, asyncHandler(async (req, res) => {
  const fullName = String(req.body.fullName || "").trim();
  const mobileNumber = String(req.body.mobileNumber || "").replace(/\D/g, "");
  const errors: Record<string, string> = {};
  if (fullName.length < 2) errors.fullName = "Name must contain at least 2 characters.";
  if (!/^[6-9]\d{9}$/.test(mobileNumber)) errors.mobileNumber = "Enter a valid 10 digit Indian mobile number.";
  if (Object.keys(errors).length) throw new HttpError(422, "Please correct your profile details.", "PROFILE_VALIDATION_ERROR", errors);
  const { pool } = await import("./config/database.js");
  const existing = (await pool.query("SELECT id FROM users WHERE mobile_number=? AND id<>?", [mobileNumber, req.userId])).rows[0];
  if (existing) throw new HttpError(409, "This mobile number is already linked to another account.", "MOBILE_ALREADY_REGISTERED", { mobileNumber: "Use a different mobile number." });
  await pool.query("UPDATE users SET full_name=?,mobile_number=? WHERE id=?", [fullName, mobileNumber, req.userId]);
  res.json({ success: true, data: (await pool.query("SELECT id,email,full_name,mobile_number FROM users WHERE id=?", [req.userId])).rows[0] });
}));
api.get("/user/favorites", requireUser, asyncHandler(async (req, res) => {
  const { pool } = await import("./config/database.js");
  const rows = (await pool.query("SELECT p.id,p.title,p.description,p.base_price,p.tags,s.id seller_id,s.shop_name,s.area,s.mobile_number,s.address_line,s.location_url,MIN(pm.url) image_url FROM user_favorites f JOIN products p ON p.id=f.product_id JOIN sellers s ON s.id=p.seller_id LEFT JOIN product_media pm ON pm.product_id=p.id WHERE f.user_id=? AND p.status='APPROVED' AND s.verification_status='VERIFIED' GROUP BY p.id,s.id ORDER BY f.created_at DESC", [req.userId])).rows;
  res.json({ success: true, data: rows });
}));
api.post("/user/favorites/:productId", requireUser, asyncHandler(async (req, res) => {
  const { pool } = await import("./config/database.js");
  const product = (await pool.query("SELECT p.id FROM products p JOIN sellers s ON s.id=p.seller_id WHERE p.id=? AND p.status='APPROVED' AND s.verification_status='VERIFIED'", [req.params.productId])).rows[0];
  if (!product) throw new HttpError(404, "This product is not available to save.", "PRODUCT_NOT_FOUND");
  await pool.query("INSERT IGNORE INTO user_favorites (user_id,product_id) VALUES (?,?)", [req.userId, product.id]);
  res.status(201).json({ success: true, data: { productId: product.id, saved: true } });
}));
api.delete("/user/favorites/:productId", requireUser, asyncHandler(async (req, res) => {
  const { pool } = await import("./config/database.js");
  await pool.query("DELETE FROM user_favorites WHERE user_id=? AND product_id=?", [req.userId, req.params.productId]);
  res.json({ success: true, data: { productId: req.params.productId, saved: false } });
}));
api.get(
  "/public/products/:id",
  asyncHandler(async (req, res) => {
    const { pool } = await import("./config/database.js");
    const product = (
      await pool.query(
        "SELECT p.id,p.title,p.description,p.base_price,p.tags,p.status,p.created_at,p.seller_id,s.shop_name,s.email,s.mobile_number,s.address_line,s.area,s.city,s.state,s.pincode,s.latitude,s.longitude,s.location_url,s.verification_status FROM products p JOIN sellers s ON s.id=p.seller_id WHERE p.id=? AND p.status='APPROVED' AND s.verification_status='VERIFIED'",
        [req.params.id],
      )
    ).rows[0];
    if (!product)
      throw new HttpError(404, "Product not found.", "PRODUCT_NOT_FOUND");
    const media = await productMediaRepository.list(req.params.id);
    res.json({ success: true, data: { product, media } });
  }),
);
api.get(
  "/public/shops/:id",
  asyncHandler(async (req, res) => {
    const { pool } = await import("./config/database.js");
    const shop = (
      await pool.query(
        "SELECT id,shop_name,email,mobile_number,address_line,area,city,state,pincode,location_url,verification_status FROM sellers WHERE id=? AND verification_status='VERIFIED'",
        [req.params.id],
      )
    ).rows[0];
    if (!shop) throw new HttpError(404, "Shop not found.", "SHOP_NOT_FOUND");
    const products = (
      await pool.query(
        "SELECT p.id,p.title,p.description,p.base_price,p.tags,MIN(pm.url) image_url FROM products p LEFT JOIN product_media pm ON pm.product_id=p.id WHERE p.seller_id=? AND p.status='APPROVED' GROUP BY p.id ORDER BY p.created_at DESC",
        [req.params.id],
      )
    ).rows;
    const shopMedia = await sellerMediaRepository.list(shop.id);
    const productsWithMedia = await Promise.all(products.map(async (product: any) => ({ ...product, media: await productMediaRepository.list(product.id) })));
    res.json({ success: true, data: { shop, shopMedia, products: productsWithMedia } });
  }),
);
api.post(
  "/public/products/:id/coupon",
  requireUser,
  asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await claimCoupon(req.params.id, req.userId!) });
  }),
);
api.post(
  "/seller/coupons/verify",
  requireSeller,
  asyncHandler(async (req, res) => {
    const coupon = String(req.body.coupon || "").trim();
    if (!coupon) throw new HttpError(422, "Enter a coupon code.", "COUPON_REQUIRED", { coupon: "Coupon code is required." });
    res.json({ success: true, data: await verifyCoupon(coupon, req.sellerId!) });
  }),
);
api.post("/seller/coupons/redeem", requireSeller, asyncHandler(async (req, res) => {
  const coupon = String(req.body.coupon || "").trim();
  if (!coupon) throw new HttpError(422, "Enter a coupon code.", "COUPON_REQUIRED");
  res.json(await redeemCoupon(coupon, req.sellerId!));
}));
api.get(
  "/public/products/:id/reviews",
  asyncHandler(async (req, res) =>
    res.json({
      success: true,
      data: await reviewRepository.listProduct(req.params.id),
    }),
  ),
);
api.get(
  "/public/products",
  asyncHandler(async (req, res) => {
    const { pool } = await import("./config/database.js");
    const page = Math.max(1, Number(req.query.page) || 1),
      limit = Math.min(30, Math.max(1, Number(req.query.limit) || 12)),
      search =
        typeof req.query.search === "string" ? req.query.search.trim() : "";
    const where =
      "p.status='APPROVED' AND s.verification_status='VERIFIED'" +
      (search ? " AND (p.title LIKE ? OR p.description LIKE ? OR CAST(p.tags AS CHAR) LIKE ? OR s.shop_name LIKE ? OR s.area LIKE ?)" : "");
    const values = search ? [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`] : [];
    const total = Number(
      (
        await pool.query(
          `SELECT COUNT(*) total FROM products p JOIN sellers s ON s.id=p.seller_id WHERE ${where}`,
          values,
        )
      ).rows[0].total,
    );
    const rows = (
      await pool.query(
        `SELECT p.id,p.title,p.description,p.tags,s.id seller_id,s.shop_name,s.area,s.mobile_number,s.address_line,s.location_url,MIN(pm.url) image_url FROM products p JOIN sellers s ON s.id=p.seller_id LEFT JOIN product_media pm ON pm.product_id=p.id WHERE ${where} GROUP BY p.id,s.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
        [...values, limit, (page - 1) * limit],
      )
    ).rows;
    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }),
);
api.post(
  "/public/products/:id/reviews",
  asyncHandler(async (req, res) => {
    const x = reviewSchema.parse(req.body);
    await reviewRepository.addProduct(req.params.id, x);
    res
      .status(201)
      .json({ success: true, message: "Thank you for your review." });
  }),
);
api.get(
  "/public/shops/:id/reviews",
  asyncHandler(async (req, res) =>
    res.json({
      success: true,
      data: await reviewRepository.listShop(req.params.id),
    }),
  ),
);
api.post(
  "/public/shops/:id/reviews",
  asyncHandler(async (req, res) => {
    const x = reviewSchema.parse(req.body);
    await reviewRepository.addShop(req.params.id, x);
    res
      .status(201)
      .json({ success: true, message: "Thank you for your review." });
  }),
);
api.post(
  "/public/ai-search",
  productUpload.single("image"),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file)
      throw new HttpError(
        400,
        "Please choose an image to search.",
        "IMAGE_REQUIRED",
      );
    if (!file.mimetype.startsWith("image/"))
      throw new HttpError(
        422,
        "Choose a JPG, PNG, or WEBP image for visual search.",
        "IMAGE_REQUIRED",
      );
    const matches = await findSimilarProducts(file.buffer);
    if (!matches.length) return res.json({ success: true, data: [] });
    const { pool } = await import("./config/database.js");
    const ids = matches.map((x: { productId: string }) => x.productId);
    const placeholders = ids.map(() => "?").join(",");
    const products = (
      await pool.query(
        `SELECT p.id,p.title,p.description,p.tags,p.base_price,s.id seller_id,s.shop_name,s.mobile_number,s.area,s.address_line,MIN(pm.url) image_url FROM products p JOIN sellers s ON s.id=p.seller_id LEFT JOIN product_media pm ON pm.product_id=p.id WHERE p.id IN (${placeholders}) AND p.status='APPROVED' AND s.verification_status='VERIFIED' GROUP BY p.id,s.id`,
        ids,
      )
    ).rows;
    const score = new Map(
      matches.map((x: { productId: string; similarity: number; matchType: string }) => [
        x.productId,
        { similarity: x.similarity, matchType: x.matchType },
      ]),
    );
    res.json({
      success: true,
      data: products
        .map((p: any) => ({ ...p, ...(score.get(p.id) || { similarity: 0, matchType: "CLOSEST_MATCH" }) }))
        .sort((a: any, b: any) => b.similarity - a.similarity),
    });
  }),
);
api.post(
  "/auth/register",
  asyncHandler(async (req, res) => {
    const x = registerSchema.parse({
      ...req.body,
      email: String(req.body.email || "")
        .trim()
        .toLowerCase(),
      mobileNumber: req.body.mobileNumber
        ? String(req.body.mobileNumber).replace(/\D/g, "")
        : undefined,
    });
    res.status(201).json(await authService.register(x));
  }),
);
api.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    const x = loginSchema.parse({
      ...req.body,
      email: String(req.body.email || "")
        .trim()
        .toLowerCase(),
    });
    res.json(await authService.login(x.email, x.password));
  }),
);
api.get(
  "/seller/me",
  requireSeller,
  asyncHandler(async (req, res) => {
    const seller = await sellerRepository.findById(req.sellerId!);
    if (!seller) throw new HttpError(404, "Seller not found");
    res.json({ seller, media: await sellerMediaRepository.list(req.sellerId!) });
  }),
);
api.post(
  "/seller/shop/media/:type",
  requireSeller,
  shopImageUpload.single("image"),
  asyncHandler(async (req, res) => {
    const mediaType = String(req.params.type).toUpperCase();
    if (mediaType !== "PROFILE" && mediaType !== "BANNER") throw new HttpError(422, "Choose either a profile image or a banner image.", "INVALID_SHOP_MEDIA_TYPE");
    if (!req.file) throw new HttpError(400, "Choose an image to upload.", "SHOP_IMAGE_REQUIRED");
    const uploaded = await uploadShopImage(req.file, req.sellerId!, mediaType);
    res.status(201).json({ media: await sellerMediaRepository.upsert(req.sellerId!, mediaType, uploaded) });
  }),
);
api.put(
  "/seller/shop",
  requireSeller,
  asyncHandler(async (req, res) =>
    res.json({
      seller: await sellerRepository.updateShop(
        req.sellerId!,
        shopSchema.parse(req.body),
      ),
    }),
  ),
);
api.get(
  "/seller/products",
  requireSeller,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1),
      limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : undefined;
    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;
    if (status && !["PENDING", "APPROVED", "REJECTED"].includes(status))
      throw new HttpError(422, "Status filter is invalid.", "INVALID_FILTER");
    const result = await productRepository.list(req.sellerId!, {
      page,
      limit,
      search,
      status,
    });
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  }),
);
api.get(
  "/seller/notifications",
  requireSeller,
  asyncHandler(async (req, res) =>
    res.json({
      success: true,
      data: await notificationRepository.list(req.sellerId!),
    }),
  ),
);
api.get("/seller/dashboard", requireSeller, asyncHandler(async (req, res) => {
  const { pool } = await import("./config/database.js");
  const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));
  const [products, active, claims, verified, trend] = await Promise.all([
    pool.query("SELECT COUNT(*) total FROM products WHERE seller_id=?", [req.sellerId]),
    pool.query("SELECT COUNT(*) total FROM products WHERE seller_id=? AND status='APPROVED'", [req.sellerId]),
    pool.query("SELECT COUNT(*) total FROM coupon_claims WHERE seller_id=? AND claimed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)", [req.sellerId, days]),
    pool.query("SELECT COUNT(*) total FROM coupon_claims WHERE seller_id=? AND verification_status='VERIFIED' AND claimed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)", [req.sellerId, days]),
    pool.query("SELECT DATE_FORMAT(claimed_at,'%Y-%m-%d') date,COUNT(*) claims,SUM(verification_status='VERIFIED') verified FROM coupon_claims WHERE seller_id=? AND claimed_at >= DATE_SUB(NOW(), INTERVAL ? DAY) GROUP BY DATE_FORMAT(claimed_at,'%Y-%m-%d') ORDER BY date", [req.sellerId, days]),
  ]);
  res.json({ success: true, data: { periodDays: days, metrics: { totalProducts: Number(products.rows[0].total), activeProducts: Number(active.rows[0].total), couponClaims: Number(claims.rows[0].total), couponVerifications: Number(verified.rows[0].total) }, trend: trend.rows } });
}));
api.patch(
  "/seller/notifications/:id/read",
  requireSeller,
  asyncHandler(async (req, res) => {
    if (!(await notificationRepository.read(req.params.id, req.sellerId!)))
      throw new HttpError(
        404,
        "Notification not found.",
        "NOTIFICATION_NOT_FOUND",
      );
    res.json({ success: true });
  }),
);

api.post(
  "/admin/login",
  asyncHandler(async (req, res) => {
    if (
      !process.env.ADMIN_MOBILE ||
      !process.env.ADMIN_PASSWORD ||
      req.body.mobileNumber !== process.env.ADMIN_MOBILE ||
      req.body.password !== process.env.ADMIN_PASSWORD
    )
      throw new HttpError(
        401,
        "Invalid admin mobile number or password.",
        "INVALID_ADMIN_CREDENTIALS",
      );
    res.json({
      success: true,
      token: jwt.sign({ role: "ADMIN" }, process.env.JWT_SECRET!, {
        expiresIn: "8h",
      }),
    });
  }),
);
api.get("/admin/shops", requireAdmin, asyncHandler(async (req, res) => {
  const { pool } = await import("./config/database.js");
  const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const status = typeof req.query.status === "string" && ["PENDING", "VERIFIED", "REJECTED"].includes(req.query.status) ? req.query.status : "";
  const where = ["1=1"], values: any[] = [];
  if (search) { where.push("(shop_name LIKE ? OR email LIKE ? OR mobile_number LIKE ? OR area LIKE ?)"); values.push(...Array(4).fill(`%${search}%`)); }
  if (status) { where.push("verification_status=?"); values.push(status); }
  const filter = where.join(" AND ");
  const total = Number((await pool.query(`SELECT COUNT(*) total FROM sellers WHERE ${filter}`, values)).rows[0].total);
  const rows = (await pool.query(`SELECT id,email,mobile_number,shop_name,address_line,area,city,state,pincode,location_url,verification_status,created_at FROM sellers WHERE ${filter} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...values, limit, (page - 1) * limit])).rows;
  res.json({ success: true, data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));
api.get("/admin/shops/:id", requireAdmin, asyncHandler(async (req, res) => {
  const { pool } = await import("./config/database.js");
  const shop = (await pool.query("SELECT id,email,mobile_number,shop_name,address_line,area,city,state,pincode,location_url,verification_status,created_at FROM sellers WHERE id=?", [req.params.id])).rows[0];
  if (!shop) throw new HttpError(404, "Shop not found.", "SHOP_NOT_FOUND");
  const media = (await pool.query("SELECT * FROM seller_media WHERE seller_id=?", [shop.id])).rows;
  const products = (await pool.query("SELECT p.id,p.title,p.description,p.base_price,p.tags,p.status,p.rejection_reason,p.created_at FROM products p WHERE p.seller_id=? ORDER BY p.created_at DESC", [shop.id])).rows;
  const productsWithMedia = await Promise.all(products.map(async (product: any) => ({ ...product, media: await productMediaRepository.list(product.id) })));
  res.json({ success: true, data: { shop, media, products: productsWithMedia } });
}));
api.get("/admin/products", requireAdmin, asyncHandler(async (req, res) => {
  const { pool } = await import("./config/database.js");
  const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const status = typeof req.query.status === "string" && ["PENDING", "APPROVED", "REJECTED"].includes(req.query.status) ? req.query.status : "";
  const where = ["1=1"], values: any[] = [];
  if (search) { where.push("(p.title LIKE ? OR p.description LIKE ? OR CAST(p.tags AS CHAR) LIKE ? OR s.shop_name LIKE ?)"); values.push(...Array(4).fill(`%${search}%`)); }
  if (status) { where.push("p.status=?"); values.push(status); }
  const filter = where.join(" AND ");
  const total = Number((await pool.query(`SELECT COUNT(*) total FROM products p JOIN sellers s ON s.id=p.seller_id WHERE ${filter}`, values)).rows[0].total);
  const rows = (await pool.query(`SELECT p.id,p.title,p.description,p.tags,p.base_price,p.status,p.rejection_reason,p.seller_id,s.shop_name,s.verification_status,MIN(pm.url) image_url FROM products p JOIN sellers s ON s.id=p.seller_id LEFT JOIN product_media pm ON pm.product_id=p.id WHERE ${filter} GROUP BY p.id,s.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?`, [...values, limit, (page - 1) * limit])).rows;
  res.json({ success: true, data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));
api.get("/admin/products/:id", requireAdmin, asyncHandler(async (req, res) => {
  const { pool } = await import("./config/database.js");
  const product = (await pool.query("SELECT p.*,s.shop_name,s.verification_status FROM products p JOIN sellers s ON s.id=p.seller_id WHERE p.id=?", [req.params.id])).rows[0];
  if (!product) throw new HttpError(404, "Product not found.", "PRODUCT_NOT_FOUND");
  res.json({ success: true, data: { product, media: await productMediaRepository.list(product.id) } });
}));
api.get(
  "/admin/pending",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const sellers = (
      await (
        await import("./config/database.js")
      ).pool.query(
        "SELECT id,mobile_number,shop_name,verification_status,created_at FROM sellers WHERE verification_status='PENDING' ORDER BY created_at",
      )
    ).rows;
    const products = (
      await (
        await import("./config/database.js")
      ).pool.query(
        "SELECT p.id,p.title,p.seller_id,p.status,p.created_at,s.shop_name FROM products p JOIN sellers s ON s.id=p.seller_id WHERE p.status='PENDING' ORDER BY p.created_at",
      )
    ).rows;
    res.json({ success: true, data: { sellers, products } });
  }),
);
api.get(
  "/admin/dashboard",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const { pool } = await import("./config/database.js");
    const [sellers, products, verifiedSellers, approvedProducts] = await Promise.all([
      pool.query("SELECT COUNT(*) total FROM sellers WHERE verification_status='PENDING'"),
      pool.query("SELECT COUNT(*) total FROM products WHERE status='PENDING'"),
      pool.query("SELECT COUNT(*) total FROM sellers WHERE verification_status='VERIFIED'"),
      pool.query("SELECT COUNT(*) total FROM products WHERE status='APPROVED'"),
    ]);
    res.json({
      success: true,
      data: {
        pendingSellers: Number(sellers.rows[0].total),
        pendingProducts: Number(products.rows[0].total),
        verifiedSellers: Number(verifiedSellers.rows[0].total),
        approvedProducts: Number(approvedProducts.rows[0].total),
      },
    });
  }),
);
api.post(
  "/admin/sellers/:id/approve",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { pool } = await import("./config/database.js");
    const seller = (
      await pool.query("SELECT id,shop_name FROM sellers WHERE id=?", [
        req.params.id,
      ])
    ).rows[0];
    if (!seller)
      throw new HttpError(404, "Seller not found.", "SELLER_NOT_FOUND");
    await pool.query(
      "UPDATE sellers SET verification_status='VERIFIED' WHERE id=?",
      [seller.id],
    );
    await notificationRepository.create(
      seller.id,
      "SHOP_APPROVED",
      "Shop approved",
      `Your shop \"${seller.shop_name}\" has been approved.`,
      seller.id,
    );
    res.json({ success: true, data: seller });
  }),
);
api.post(
  "/admin/products/:id/approve",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { pool } = await import("./config/database.js");
    const product = (
      await pool.query("SELECT id,title,seller_id FROM products WHERE id=?", [
        req.params.id,
      ])
    ).rows[0];
    if (!product)
      throw new HttpError(404, "Product not found.", "PRODUCT_NOT_FOUND");
    const seller = (await pool.query("SELECT verification_status FROM sellers WHERE id=?", [product.seller_id])).rows[0];
    if (seller?.verification_status !== "VERIFIED")
      throw new HttpError(409, "Approve this seller's shop before approving the product.", "SHOP_APPROVAL_REQUIRED", { shop: "The shop must be approved before this product can go live." });
    await pool.query("UPDATE products SET status='APPROVED' WHERE id=?", [
      product.id,
    ]);
    await notificationRepository.create(
      product.seller_id,
      "PRODUCT_APPROVED",
      "Product approved",
      `Your product \"${product.title}\" has been approved.`,
      product.id,
    );
    res.json({ success: true, data: product });
  }),
);
api.post(
  "/admin/sellers/:id/reject",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { pool } = await import("./config/database.js");
    const seller = (await pool.query("SELECT id FROM sellers WHERE id=?", [req.params.id])).rows[0];
    if (!seller) throw new HttpError(404, "Seller not found.", "SELLER_NOT_FOUND");
    await pool.query("UPDATE sellers SET verification_status='REJECTED' WHERE id=?", [seller.id]);
    res.json({ success: true, data: seller });
  }),
);
api.post(
  "/admin/products/:id/reject",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { pool } = await import("./config/database.js");
    const product = (await pool.query("SELECT id FROM products WHERE id=?", [req.params.id])).rows[0];
    if (!product) throw new HttpError(404, "Product not found.", "PRODUCT_NOT_FOUND");
    await pool.query("UPDATE products SET status='REJECTED', rejection_reason=? WHERE id=?", [
      String(req.body.reason || "Rejected by administrator").slice(0, 500),
      product.id,
    ]);
    res.json({ success: true, data: product });
  }),
);
api.post(
  "/seller/products",
  requireSeller,
  asyncHandler(async (req, res) =>
    res.status(201).json({
      product: await productRepository.create(
        req.sellerId!,
        productSchema.parse(req.body),
      ),
    }),
  ),
);
api.get(
  "/seller/products/:id",
  requireSeller,
  asyncHandler(async (req, res) => {
    const product = await productRepository.findOwned(
      req.params.id,
      req.sellerId!,
    );
    if (!product) throw new HttpError(404, "Product not found");
    res.json({ product });
  }),
);
api.put(
  "/seller/products/:id",
  requireSeller,
  asyncHandler(async (req, res) => {
    const product = await productRepository.update(
      req.params.id,
      req.sellerId!,
      productSchema.parse(req.body),
    );
    if (!product) throw new HttpError(404, "Product not found");
    res.json({ product });
  }),
);
api.delete(
  "/seller/products/:id",
  requireSeller,
  asyncHandler(async (req, res) => {
    if (!(await productRepository.remove(req.params.id, req.sellerId!)))
      throw new HttpError(404, "Product not found");
    res.status(204).send();
  }),
);
api.get(
  "/seller/products/:id/media",
  requireSeller,
  asyncHandler(async (req, res) => {
    if (!(await productRepository.findOwned(req.params.id, req.sellerId!)))
      throw new HttpError(404, "Product not found");
    res.json({ media: await productMediaRepository.list(req.params.id) });
  }),
);
api.post(
  "/seller/products/:id/media",
  requireSeller,
  productUpload.array("media", 8),
  asyncHandler(async (req, res) => {
    if (!(await productRepository.findOwned(req.params.id, req.sellerId!)))
      throw new HttpError(404, "Product not found");
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length)
      throw new HttpError(400, "Select at least one product image or video.");
    const media = await Promise.all(
      files.map(async (file) => {
        const uploaded = await uploadProductMedia(
          file,
          req.sellerId!,
          req.params.id,
        );
        const saved = await productMediaRepository.create(
          req.params.id,
          uploaded,
        );
        if (uploaded.resourceType === "image")
          void indexProductImage(req.params.id, uploaded.url).catch((error) =>
            console.error("Product image indexing failed", {
              productId: req.params.id,
              error,
            }),
          );
        return saved;
      }),
    );
    res.status(201).json({ media });
  }),
);
api.delete(
  "/seller/products/:productId/media/:mediaId",
  requireSeller,
  asyncHandler(async (req, res) => {
    if (
      !(await productRepository.findOwned(req.params.productId, req.sellerId!))
    )
      throw new HttpError(404, "Product not found.", "PRODUCT_NOT_FOUND");
    const media = await productMediaRepository.remove(
      req.params.mediaId,
      req.params.productId,
    );
    if (!media)
      throw new HttpError(404, "Media file not found.", "MEDIA_NOT_FOUND");
    res.json({ success: true, data: media });
  }),
);
