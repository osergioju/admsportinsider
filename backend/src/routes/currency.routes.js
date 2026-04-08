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
} from "../controllers/currency.controller.js";
import { adminGuard } from "../middlewares/auth.middleware.js";

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

export default router;