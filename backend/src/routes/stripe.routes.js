import express from "express";
import { createCheckoutSession } from "../controllers/stripe.controller.js";
import { authGuard } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create-checkout-session", authGuard, createCheckoutSession);

export default router;
