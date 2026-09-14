import mysql from "mysql2/promise";
const required = [
  "MYSQL_HOST",
  "MYSQL_DATABASE",
  "MYSQL_USER",
  "MYSQL_PASSWORD",
] as const;
for (const key of required)
  if (!process.env[key]) throw new Error(`${key} is required`);
export const rawPool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
});
export const pool = {
  query: async (sql: string, values: any[] = []): Promise<{ rows: any[]; affectedRows?: number }> => {
    const [rows] = await rawPool.query(sql.replace(/\$\d+/g, "?"), values);
    return { rows: Array.isArray(rows) ? rows : [], affectedRows: Array.isArray(rows) ? undefined : (rows as any).affectedRows };
  },
};
