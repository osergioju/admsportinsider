import multer from "multer";

export const uploadXlsx = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },

  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
      "text/csv",
      "application/csv",
      "application/vnd.ms-excel" // alguns CSVs vêm assim
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Arquivo inválido. Envie apenas arquivos XLSX."
        )
      );
    }
  }
}).single("file");
