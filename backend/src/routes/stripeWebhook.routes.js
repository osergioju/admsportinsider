import express from "express";
import { stripeWebhookHandler } from "../controllers/stripeWebhook.controller.js";

const router = express.Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler
);

export default router;
