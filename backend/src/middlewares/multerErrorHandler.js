import multer from "multer";

export function multerErrorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message: err.message
    });
  }

  if (err.message?.includes("Arquivo inválido")) {
    return res.status(400).json({
      message: err.message
    });
  }

  next(err);
}
