import "dotenv/config";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { pool, rawPool } from "../src/config/database.js";
import { indexProductImage } from "../src/services/ai-search.service.js";

async function seed() {
const passwordHash = await bcrypt.hash("FindItDemo@123", 12);
const shops = [
  { email: "rajhans.demo@findit.surat", mobile: "9876543210", name: "Rajhans Textiles", area: "Ring Road", address: "Shop 14, Textile Market, Ring Road, Surat", lat: 21.1938, lng: 72.8314 },
  { email: "mahalaxmi.demo@findit.surat", mobile: "9825011223", name: "Mahalaxmi Sarees", area: "Sahara Darwaja", address: "Building B, Sahara Darwaja Market, Surat", lat: 21.1852, lng: 72.8385 },
  { email: "kesar.demo@findit.surat", mobile: "9898077123", name: "Kesar Fashion Hub", area: "Vesu", address: "Galaxy Circle, Vesu, Surat", lat: 21.1448, lng: 72.7702 },
];
const catalog = [
  { shop: 0, title: "Dola Silk Zari Saree", description: "Rich Dola silk saree with traditional zari detailing for festive occasions.", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85", tags: ["saree", "silk", "zari"] },
  { shop: 0, title: "Banarasi Tissue Saree", description: "Luminous Banarasi tissue weave with a timeless wedding-ready finish.", image: "https://images.unsplash.com/photo-1605763240000-7e93b172d754?auto=format&fit=crop&w=900&q=85", tags: ["saree", "banarasi", "wedding"] },
  { shop: 1, title: "Organza Floral Edit", description: "Lightweight organza with an all-over floral edit and matching blouse options.", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85", tags: ["organza", "floral", "saree"] },
  { shop: 1, title: "Festive Purple Silk", description: "A deep purple silk drape with detailed gold border for celebrations.", image: "https://images.unsplash.com/photo-1605763240000-7e93b172d754?auto=format&fit=crop&w=900&q=85", tags: ["silk", "purple", "festive"] },
  { shop: 2, title: "Mirror Work Festive Set", description: "Contemporary festive set with mirror work and a comfortable finish.", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85", tags: ["mirror work", "festive", "set"] },
];

for (const shop of shops) {
  await pool.query(
    "INSERT INTO sellers (id,email,mobile_number,shop_name,address_line,area,city,state,pincode,latitude,longitude,verification_status,password_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE shop_name=VALUES(shop_name),verification_status='VERIFIED',password_hash=VALUES(password_hash)",
    [randomUUID(), shop.email, shop.mobile, shop.name, shop.address, shop.area, "Surat", "Gujarat", "395003", shop.lat, shop.lng, "VERIFIED", passwordHash],
  );
}

const sellerRows = (await pool.query("SELECT id,email FROM sellers WHERE email IN (?,?,?)", shops.map((shop) => shop.email))).rows as { id: string; email: string }[];
for (const item of catalog) {
  const seller = sellerRows.find((row) => row.email === shops[item.shop].email);
  if (!seller) throw new Error(`Missing seeded seller ${shops[item.shop].email}`);
  const existing = (await pool.query("SELECT id FROM products WHERE seller_id=? AND title=?", [seller.id, item.title])).rows[0] as { id?: string } | undefined;
  const productId = existing?.id || randomUUID();
  await pool.query(
    "INSERT INTO products (id,seller_id,title,description,tags,status) VALUES (?,?,?,?,?,'APPROVED') ON DUPLICATE KEY UPDATE description=VALUES(description),tags=VALUES(tags),status='APPROVED'",
    [productId, seller.id, item.title, item.description, JSON.stringify(item.tags)],
  );
  const media = (await pool.query("SELECT id FROM product_media WHERE product_id=? LIMIT 1", [productId])).rows[0];
  if (!media) await pool.query("INSERT INTO product_media (id,product_id,url,public_id,resource_type,format,file_size) VALUES (?,?,?,?,?,?,?)", [randomUUID(), productId, item.image, `seed/${productId}`, "image", "jpg", 0]);
  else await pool.query("UPDATE product_media SET url=? WHERE product_id=?", [item.image, productId]);
  console.log(`Indexing ${item.title} in Qdrant...`);
  await indexProductImage(productId, item.image);
}
await rawPool.end();
console.log("Seeded verified shops, approved products, media, and Qdrant embeddings.");
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
