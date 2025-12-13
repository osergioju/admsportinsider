import Stripe from "stripe";
import { db } from "../config/db.js";

const PRICE_IDS = {
  2: "price_1ScyEsGpvzwsEpHhVnmLViFU", // Premium
  3: "price_1ScyFiGpvzwsEpHh70blpgpx", // Business
};

export const createCheckoutSession = async (req, res) => {
  try {
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const { userId, plan_id } = req.body;

    if (!userId || !plan_id) {
      return res.status(400).json({ error: "userId e plan_id são obrigatórios" });
    }

    // Buscar usuário
    const userResult = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
    const user = userResult.rows[0];

    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const priceId = PRICE_IDS[plan_id];
    if (!priceId) return res.status(400).json({ error: "Plano inválido" });

    let stripeCustomerId = user.stripe_customer_id;

    // Criar customer se não existir
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id }
      });

      stripeCustomerId = customer.id;

      await db.query(
        "UPDATE users SET stripe_customer_id = $1 WHERE id = $2",
        [stripeCustomerId, user.id]
      );
    }

    // Criar sessão do checkout
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/pagamento-sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pagamento-cancelado`,
      metadata: {
        userId: user.id,
        plan_id,
      }
    });

    return res.json({ url: session.url });

  } catch (error) {
    console.error("Erro ao criar checkout session:", error);
    res.status(500).json({ error: "Erro ao criar session" });
  }
};