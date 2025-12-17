import express from "express";
import { stripeWebhookHandler } from "../controllers/stripeWebhook.controller.js";
import { createBillingPortal } from "../controllers/stripe.controller.js";
import { authGuard } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post( "/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);

// Redirect para a página dos invoicessss
router.post( "/billing/portal", authGuard, createBillingPortal);

export default router;
