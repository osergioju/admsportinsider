import Stripe from "stripe";
import { db } from "../config/db.js";

export const stripeWebhookHandler = async (req, res) => {
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("Erro ao validar webhook:", err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  const data = event.data.object;

  switch (event.type) {
    
    // CHECKOUT COMPLETO
    case "checkout.session.completed": {
      const userId = data.metadata?.userId;
      const plan_id = Number(data.metadata?.plan_id);

      if (!userId || !plan_id) break;

      console.log("Checkout concluído para user:", userId);

      // Buscar line_items manualmente
      const session = await stripe.checkout.sessions.retrieve(data.id, {
        expand: ["line_items"],
      });

      const priceId = session.line_items.data[0].price.id;

      await db.query(
        `UPDATE users 
         SET plan_id = $1, stripe_price_id = $2 
         WHERE id = $3`,
        [plan_id, priceId, userId]
      );

      break;
    }

    // SUBSCRIPTION CREATED
    case "customer.subscription.created": {
      const {
        id: subscriptionId,
        customer,
        status,
        current_period_end,
        items,
      } = data;

      console.log('subscription.created', data);
      const priceId = items.data[0].price.id;

      console.log("🆕 Assinatura criada:", subscriptionId);

      await db.query(
        `UPDATE users SET 
          stripe_subscription_id = $1,
          stripe_price_id = $2,
          subscription_status = $3,
          subscription_current_period_end = to_timestamp($4)
         WHERE stripe_customer_id = $5`,
        [
          subscriptionId,
          priceId,
          status,
          current_period_end,
          customer,
        ]
      );

      break;
    }

    // ✔ SUBSCRIPTION UPDATED
    case "customer.subscription.updated": {
      const {
        customer,
        status,
        current_period_end,
        cancel_at_period_end,
        items,
      } = data;

      const priceId = items.data[0].price.id;

      console.log("🔄 Assinatura atualizada:", data.id);

      await db.query(
        `UPDATE users SET 
          subscription_status = $1,
          subscription_current_period_end = to_timestamp($2),
          cancel_at_period_end = $3,
          stripe_price_id = $4
         WHERE stripe_customer_id = $5`,
        [
          status,
          current_period_end,
          cancel_at_period_end,
          priceId,
          customer,
        ]
      );
      break;
    }

    // ✔ SUBSCRIPTION DELETED (CANCELADA)
    case "customer.subscription.deleted": {
      const { customer } = data;

      console.log("❌ Assinatura cancelada para customer:", customer);

      await db.query(
        `UPDATE users SET 
          plan_id = 1,
          subscription_status = 'canceled'
         WHERE stripe_customer_id = $1`,
        [customer]
      );

      break;
    }

    default:
      console.log(`⚠️ Evento não tratado: ${event.type}`);
  }

  res.json({ received: true });
};