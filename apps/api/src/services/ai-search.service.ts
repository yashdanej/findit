import { QdrantClient } from "@qdrant/js-client-rest";
import { pipeline, RawImage } from "@huggingface/transformers";
import { randomUUID } from "node:crypto";

const collection = process.env.QDRANT_COLLECTION || "product_images";
const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || "http://qdrant:6333", checkCompatibility: false });
let extractor: any;

async function embed(input: string | Buffer): Promise<number[]> {
  extractor ??= await pipeline("image-feature-extraction", "Xenova/clip-vit-base-patch32");
  const image = Buffer.isBuffer(input)
    ? await RawImage.fromBlob(new Blob([Uint8Array.from(input)]))
    : await RawImage.fromURL(input);
  const output: any = await extractor(image, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

async function ensure() {
  try { await qdrant.getCollection(collection); }
  catch { await qdrant.createCollection(collection, { vectors: { size: 512, distance: "Cosine" } }); }
}

export async function indexProductImage(productId: string, imageUrl: string) {
  await ensure();
  const vector = await embed(imageUrl);
  await qdrant.upsert(collection, { wait: true, points: [{ id: randomUUID(), vector, payload: { productId, imageUrl } }] });
}

export async function findSimilarProducts(image: string | Buffer) {
  await ensure();
  const vector = await embed(image);
  const result: any = await qdrant.query(collection, {
    query: vector,
    limit: 24,
    score_threshold: 0.35,
    with_payload: true,
  });
  const bestByProduct = new Map<string, { productId: string; similarity: number; matchType: string }>();
  for (const row of result?.points || []) {
    const productId = String(row.payload?.productId || row.id);
    const similarity = Number(row.score || 0);
    if (similarity < 0.35 || bestByProduct.has(productId)) continue;
    bestByProduct.set(productId, {
      productId,
      similarity,
      matchType: similarity >= 0.72 ? "STRONG_MATCH" : similarity >= 0.55 ? "SIMILAR_MATCH" : "CLOSEST_MATCH",
    });
  }
  return [...bestByProduct.values()].sort((a, b) => b.similarity - a.similarity).slice(0, 12);
}
