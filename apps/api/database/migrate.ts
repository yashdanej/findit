import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { rawPool } from "../src/config/database.js";

async function migrate() {
  const directory = join(process.cwd(), "database", "migrations");

  await rawPool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const files = (await readdir(directory))
    .filter((filename) => filename.endsWith(".sql"))
    .sort();

  for (const filename of files) {
    const [done] = await rawPool.query(
      "SELECT 1 FROM schema_migrations WHERE filename = ?",
      [filename]
    );

    if ((done as any[]).length) {
      continue;
    }

    const connection = await rawPool.getConnection();

    try {
      await connection.beginTransaction();

      const sql = await readFile(
        join(directory, filename),
        "utf8"
      );

      await connection.query(sql);

      await connection.query(
        "INSERT INTO schema_migrations (filename) VALUES (?)",
        [filename]
      );

      await connection.commit();

      console.log(`Applied ${filename}`);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  await rawPool.end();

  console.log("Migrations completed successfully.");
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});