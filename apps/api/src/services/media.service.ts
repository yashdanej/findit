import { Readable } from "node:stream";
import type { Express } from "express";
import { cloudinary, cloudinaryReady } from "../config/cloudinary.js";
import { HttpError } from "../utils/http.js";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4"]);
export function validateMedia(file: Express.Multer.File) {
  if (!allowed.has(file.mimetype)) throw new HttpError(400, "File must be JPG, JPEG, PNG, WEBP or MP4 and must be less than 10 MB.");
  if (file.size > 10 * 1024 * 1024) throw new HttpError(400, "File must be JPG, JPEG, PNG, WEBP or MP4 and must be less than 10 MB.");
}
export async function uploadProductMedia(file: Express.Multer.File, sellerId: string, productId: string) {
  validateMedia(file);
  if (!cloudinaryReady) throw new HttpError(503, "Product media uploads are not configured. Add Cloudinary credentials to the server environment.");
  const resourceType = file.mimetype === "video/mp4" ? "video" : "image";
  return new Promise<{ url: string; publicId: string; resourceType: "image" | "video"; format: string; fileSize: number }>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream({ folder: `findit/sellers/${sellerId}/products/${productId}`, resource_type: resourceType }, (error, result) => {
      if (error || !result) return reject(new HttpError(502, "Unable to upload media. Please try again."));
      resolve({ url: result.secure_url, publicId: result.public_id, resourceType, format: result.format ?? "unknown", fileSize: result.bytes });
    });
    Readable.from(file.buffer).pipe(upload);
  });
}

export async function uploadShopImage(file: Express.Multer.File, sellerId: string, mediaType: "PROFILE" | "BANNER") {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype))
    throw new HttpError(400, "Shop images must be JPG, PNG, or WEBP files smaller than 10 MB.");
  if (file.size > 10 * 1024 * 1024) throw new HttpError(400, "Shop images must be smaller than 10 MB.");
  if (!cloudinaryReady) throw new HttpError(503, "Shop image uploads are not configured. Add Cloudinary credentials to the server environment.");
  return new Promise<{ url: string; publicId: string; format: string; fileSize: number }>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream({ folder: `findit/sellers/${sellerId}/shop`, public_id: mediaType.toLowerCase() }, (error, result) => {
      if (error || !result) return reject(new HttpError(502, "Unable to upload the shop image. Please try again."));
      resolve({ url: result.secure_url, publicId: result.public_id, format: result.format ?? "unknown", fileSize: result.bytes });
    });
    Readable.from(file.buffer).pipe(upload);
  });
}
