import multer from "multer";
import path from "path";
import fs from "fs";
import { UPLOADS_DIR } from "../config/paths.js";

const dest = path.join(UPLOADS_DIR, "ligas");
fs.mkdirSync(dest, { recursive: true }); // garante a pasta (multer falha se não existir)

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dest),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    cb(null, `league_${Date.now()}${ext}`);
  },
});

export const uploadLeagueImage = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Apenas imagens são permitidas."));
  },
}).single("file");
