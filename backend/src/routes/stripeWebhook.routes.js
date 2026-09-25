import express from "express";
import { stripeWebhookHandler } from "../controllers/stripeWebhook.controller.js";
import { createBillingPortal, getPaymentMethod } from "../controllers/stripe.controller.js";
import { authGuard } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post( "/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);

// Redirect para a página dos invoicessss
router.post( "/billing/portal", authGuard, createBillingPortal);

// Cartão da assinatura (bandeira + final) pra tela de Assinatura e cobrança
router.get( "/billing/payment-method", authGuard, getPaymentMethod);

export default router;
 