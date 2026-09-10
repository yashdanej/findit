import multer from "multer";
import { HttpError } from "../utils/http.js";
export const productUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
    if (!allowed.includes(file.mimetype)) {
      cb(new HttpError(400, "File must be JPG, JPEG, PNG, WEBP or MP4 and must be less than 10 MB."));
      return;
    }
    cb(null, true);
  },
});
