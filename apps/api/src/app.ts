import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import { ZodError } from "zod";
import { api } from "./routes.js";
import { HttpError } from "./utils/http.js";
export const app = express();
app.use(helmet());
const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) return callback(null, true);
      return callback(new HttpError(403, "This website is not allowed to access the API.", "CORS_ORIGIN_BLOCKED"));
    },
  }),
);
app.use(express.json({ limit: "1mb" }));
app.get("/health", (_q, r) => r.json({ status: "ok" }));
app.use("/api/v1", api);
app.use((err: any, req: any, res: any, _next: any) => {
  const isZod = err instanceof ZodError;
  const isMulter = err instanceof multer.MulterError;
  const pgCode = err?.code as string | undefined;
  let status = 500, message = "We could not complete this request.", code = "INTERNAL_ERROR", errors: Record<string,string> | undefined;
  if (err instanceof HttpError) ({ status, message, code, errors } = err);
  else if (isZod) { status = 422; code = "VALIDATION_ERROR"; message = "Please correct the highlighted fields."; errors = Object.fromEntries(err.issues.map((i:any)=>[i.path.join(".") || "form", i.message])); }
  else if (isMulter) { status = 400; code = "MEDIA_INVALID"; message = err.code === "LIMIT_FILE_SIZE" ? "Each media file must be smaller than 10 MB." : "Please upload a supported image or video file."; }
  else if (["23505","ER_DUP_ENTRY"].includes(pgCode || "")) { status = 409; code = "DUPLICATE_RECORD"; message = "A record with these details already exists."; }
  else if (["23503","ER_NO_REFERENCED_ROW_2","ER_ROW_IS_REFERENCED_2"].includes(pgCode || "")) { status = 409; code = "RELATED_RECORD_MISSING"; message = "This record cannot be changed because it is linked to other data."; }
  else if (["23502","23514","22P02","ER_BAD_NULL_ERROR","ER_CHECK_CONSTRAINT_VIOLATED","ER_TRUNCATED_WRONG_VALUE"].includes(pgCode || "")) { status = 422; code = "INVALID_DATA"; message = "One or more values are invalid."; }
  else if (["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "PROTOCOL_CONNECTION_LOST"].includes(pgCode || "")) { status = 503; code = "DATABASE_UNAVAILABLE"; message = "The database is temporarily unavailable. Please try again."; }
  if (status >= 500) console.error("API service error", { method: req.method, path: req.originalUrl, code: err?.code, error: err?.stack || err });
  res.status(status).json({ success: false, message, code, ...(errors ? { errors } : {}) });
});
