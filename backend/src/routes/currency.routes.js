import { Router } from "express";
import {
  getAllCurrencies,
  getCurrencyById,
  createCurrency,
  disableCurrency,
  getAvailableCountries,
  getOtherCurrencies,
  getCurrencyPairs,
  getRatesByPair,
  createOrUpdateRate,
  deleteRate,
  deletePair,
  bulkImportExchangeRates,
} from "../controllers/currency.controller.js";
import { adminGuard } from "../middlewares/auth.middleware.js";
import { uploadXlsx } from "../middlewares/uploadXlsx.js";

const router = Router();

// Moedas
router.get("/currencies", getAllCurrencies);
router.get("/currencies/available/countries", getAvailableCountries); // antes de /:id
router.get("/currencies/:id", getCurrencyById);
router.post("/currencies", adminGuard, createCurrency);
router.delete("/currencies/:id", adminGuard, disableCurrency);

// Auxiliar
router.get("/currencies/:currencyId/other-currencies", getOtherCurrencies);

// Pares (agrupados por base+reference)
router.get("/currencies/:currencyId/pairs", getCurrencyPairs);
router.delete("/currency-pairs/:base/:reference", adminGuard, deletePair);

// Taxas individuais
router.get("/currency-rates/:baseCurrencyCode/:referenceCurrencyCode", getRatesByPair);
router.post("/currency-rates", adminGuard, createOrUpdateRate);
router.delete("/currency-rates/:id", adminGuard, deleteRate);

// Importação em lote via XLSX
router.post("/bulk-import-xlsx", adminGuard, uploadXlsx, bulkImportExchangeRates);

export default router;