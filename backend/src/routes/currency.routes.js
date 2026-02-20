
import { Router } from "express";
import { getAllCurrencies, getCurrencyById, createCurrency, updateCurrency, disableCurrency, getAvailableCountries, getOtherCurrencies, getCurrencyPairs, createCurrencyPair, deleteCurrencyPair, getCurrencyRates, createCurrencyRate, updateCurrencyRate, deleteCurrencyRate } from "../controllers/currency.controller.js";

const router = Router();

// ROTAS DE MOEDAS
router.get('/currencies', getAllCurrencies);
router.get('/currencies/:id', getCurrencyById);
router.post('/currencies', createCurrency);
router.put('/currencies/:id', updateCurrency);
router.delete('/currencies/:id', disableCurrency);

// ROTAS AUXILIARES
router.get('/currencies/available/countries', getAvailableCountries);
router.get('/currencies/:currencyId/other-currencies', getOtherCurrencies);

// ROTAS DE PARES DE CÂMBIO
router.get('/currencies/:currencyId/pairs', getCurrencyPairs);
router.post('/currency-pairs', createCurrencyPair);
router.delete('/currency-pairs/:id', deleteCurrencyPair);

// ROTAS DE TAXAS DE CÂMBIO
router.get('/currency-pairs/:pairId/rates', getCurrencyRates);
router.post('/currency-rates', createCurrencyRate);
router.put('/currency-rates/:id', updateCurrencyRate);
router.delete('/currency-rates/:id', deleteCurrencyRate);

export default router;
