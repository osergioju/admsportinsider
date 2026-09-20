import multer from "multer";

export function multerErrorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "Arquivo maior que o limite permitido (3 MB)." });
    }
    return res.status(400).json({
      message: err.message
    });
  }

  if (err.code === "MEDIA_INVALID_TYPE") {
    return res.status(415).json({ message: err.message });
  }

  if (err.message?.includes("Arquivo inválido")) {
    return res.status(400).json({
      message: err.message
    });
  }

  next(err);
}
