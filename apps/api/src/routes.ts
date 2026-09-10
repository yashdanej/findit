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
import { sellerRepository } from "./repositories/seller.repository.js";
import { productRepository } from "./repositories/product.repository.js";
import { productUpload } from "./middleware/upload.js";
import { productMediaRepository } from "./repositories/product-media.repository.js";
import { uploadProductMedia } from "./services/media.service.js";
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
api.get(
  "/public/products/:id",
  asyncHandler(async (req, res) => {
    const { pool } = await import("./config/database.js");
    const product = (
      await pool.query(
        "SELECT p.id,p.title,p.description,p.tags,p.status,p.created_at,p.seller_id,s.shop_name,s.email,s.mobile_number,s.address_line,s.area,s.city,s.state,s.pincode,s.latitude,s.longitude,s.location_url,s.verification_status FROM products p JOIN sellers s ON s.id=p.seller_id WHERE p.id=? AND p.status='APPROVED' AND s.verification_status='VERIFIED'",
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
        "SELECT id,shop_name,email,mobile_number,address_line,area,city,state,pincode,latitude,longitude,location_url,verification_status FROM sellers WHERE id=? AND verification_status='VERIFIED'",
        [req.params.id],
      )
    ).rows[0];
    if (!shop) throw new HttpError(404, "Shop not found.", "SHOP_NOT_FOUND");
    const products = (
      await pool.query(
        "SELECT p.id,p.title,p.description,p.tags,MIN(pm.url) image_url FROM products p LEFT JOIN product_media pm ON pm.product_id=p.id WHERE p.seller_id=? AND p.status='APPROVED' GROUP BY p.id ORDER BY p.created_at DESC",
        [req.params.id],
      )
    ).rows;
    res.json({ success: true, data: { shop, products } });
  }),
);
api.post(
  "/public/products/:id/coupon",
  asyncHandler(async (req, res) => {
    const { pool } = await import("./config/database.js");
    const product = (
      await pool.query(
        "SELECT id,seller_id FROM products WHERE id=? AND status='APPROVED'",
        [req.params.id],
      )
    ).rows[0];
    if (!product)
      throw new HttpError(404, "Product not found.", "PRODUCT_NOT_FOUND");
    const coupon = jwt.sign(
      {
        productId: product.id,
        sellerId: product.seller_id,
        discount: 10,
        purpose: "FINDIT_OFFLINE_DISCOUNT",
      },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" },
    );
    res
      .status(201)
      .json({
        success: true,
        data: { coupon, discount: 10, expiresIn: "24 hours" },
      });
  }),
);
api.post(
  "/seller/coupons/verify",
  requireSeller,
  asyncHandler(async (req, res) => {
    const value = String(req.body.coupon || "");
    try {
      const payload = jwt.verify(value, process.env.JWT_SECRET!) as {
        sellerId?: string;
        discount?: number;
        productId?: string;
        purpose?: string;
      };
      if (
        payload.purpose !== "FINDIT_OFFLINE_DISCOUNT" ||
        payload.sellerId !== req.sellerId
      )
        throw new Error("invalid");
      res.json({
        success: true,
        data: {
          valid: true,
          discount: payload.discount,
          productId: payload.productId,
        },
      });
    } catch {
      throw new HttpError(
        422,
        "This coupon is invalid or expired.",
        "COUPON_INVALID",
      );
    }
  }),
);
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
      (search ? " AND (p.title LIKE ? OR p.description LIKE ?)" : "");
    const values = search ? [`%${search}%`, `%${search}%`] : [];
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
        `SELECT p.id,p.title,p.description,p.tags,s.id seller_id,s.shop_name,s.area,s.mobile_number,s.address_line,s.latitude,s.longitude,MIN(pm.url) image_url FROM products p JOIN sellers s ON s.id=p.seller_id LEFT JOIN product_media pm ON pm.product_id=p.id WHERE ${where} GROUP BY p.id,s.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
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
        `SELECT p.id,p.title,p.description,p.tags,s.shop_name,s.mobile_number,s.area,s.address_line FROM products p JOIN sellers s ON s.id=p.seller_id WHERE p.id IN (${placeholders}) AND p.status='APPROVED' AND s.verification_status='VERIFIED'`,
        ids,
      )
    ).rows;
    const score = new Map(
      matches.map((x: { productId: string; similarity: number }) => [
        x.productId,
        x.similarity,
      ]),
    );
    res.json({
      success: true,
      data: products
        .map((p: any) => ({ ...p, similarity: score.get(p.id) || 0 }))
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
    res.json({ seller });
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
