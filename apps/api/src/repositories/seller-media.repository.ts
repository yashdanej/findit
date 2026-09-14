import { pool } from "../config/database.js";
import { randomUUID } from "node:crypto";

export const sellerMediaRepository = {
  list: async (sellerId: string) =>
    (await pool.query("SELECT * FROM seller_media WHERE seller_id=? ORDER BY media_type", [sellerId])).rows,
  upsert: async (sellerId: string, mediaType: "PROFILE" | "BANNER", media: any) => {
    const id = randomUUID();
    await pool.query(
      "INSERT INTO seller_media (id,seller_id,media_type,url,public_id,format,file_size) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE url=VALUES(url),public_id=VALUES(public_id),format=VALUES(format),file_size=VALUES(file_size)",
      [id, sellerId, mediaType, media.url, media.publicId, media.format, media.fileSize],
    );
    return (await pool.query("SELECT * FROM seller_media WHERE seller_id=? AND media_type=?", [sellerId, mediaType])).rows[0];
  },
};
