import stripe from "../config/stripe.js";
import db from  "../config/db.js";

const prod_url = process.env.PROD_URL;

export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan_id } = req.body;

    if (!plan_id) {
      return res.status(400).json({ error: "plan_id é obrigatório" });
    }

    // Buscar usuário
    const userResult = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
    const user = userResult.rows[0];

    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    // Quem já tem assinatura ativa não pode abrir um segundo checkout (cobraria duas vezes).
    // Troca de plano, cancelamento e cartão são feitos no Billing Portal.
    if (
      user.stripe_subscription_id &&
      ["active", "trialing", "past_due"].includes(user.subscription_status)
    ) {
      return res.status(409).json({
        error: "Você já possui uma assinatura ativa. Gerencie ou troque de plano pelo portal de cobrança.",
        code: "ALREADY_SUBSCRIBED",
      });
    }

    const planResult = await db.query("SELECT pagarme_plan_id FROM plans WHERE id = $1 AND active = true", [plan_id]);
    const priceId = planResult.rows[0]?.pagarme_plan_id;
    if (!priceId) return res.status(400).json({ error: "Plano inválido" });

    let stripeCustomerId = user.stripe_customer_id;

    // Criar customer se não existir
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create(
        {
          email: user.email,
          name: user.name,
          metadata: { userId: user.id }
        },
        { idempotencyKey: `customer-create-${user.id}` }
      );

      stripeCustomerId = customer.id;

      await db.query(
        "UPDATE users SET stripe_customer_id = $1 WHERE id = $2",
        [stripeCustomerId, user.id]
      );
    }

    // Janela de 30s: evita criar duas sessões em duplo clique/retry, sem travar tentativas futuras legítimas
    const attemptBucket = Math.floor(Date.now() / 30000);

    // Criar sessão do checkout
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        payment_method_types: ["card"],
        customer: stripeCustomerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: prod_url + `/pagamento-sucesso?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: prod_url + `/me/plans`,
        metadata: {
          userId: user.id,
          plan_id,
        }
      },
      { idempotencyKey: `checkout-${user.id}-${plan_id}-${attemptBucket}` }
    );

    return res.json({ url: session.url });

  } catch (error) {
    console.error("❌ Erro ao criar checkout session:", error);
    res.status(500).json({ error: "Erro ao criar session" });
  }
};


export async function createBillingPortal(req, res) {
  try {
    const userId = req.user.id;

    // Busca usuário
    const { rows } = await db.query(
      `
      SELECT stripe_customer_id
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0];

    if (!user.stripe_customer_id) {
      return res.status(403).json({
        error: "Billing portal is available only for active subscriptions"
      });
    }

    // Cria sessão do portal
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: prod_url + "/me/financial"
    });

    return res.json({ url: session.url });

  } catch (err) {
    console.error("❌ Billing portal error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Cartão da assinatura, só o que é seguro exibir (bandeira, final e validade) — nunca o número.
// Ordem: cartão padrão da assinatura → padrão do cliente → primeiro cartão salvo. Sem cartão/erro → null.
export async function getPaymentMethod(req, res) {
  try {
    const { rows } = await db.query(
      "SELECT stripe_customer_id, stripe_subscription_id FROM users WHERE id = $1",
      [req.user.id]
    );
    const u = rows[0];
    if (!u?.stripe_customer_id) return res.json({ payment_method: null });

    let pm = null;
    if (u.stripe_subscription_id) {
      const sub = await stripe.subscriptions.retrieve(u.stripe_subscription_id, { expand: ["default_payment_method"] });
      pm = sub.default_payment_method;
    }
    if (!pm || typeof pm === "string" || !pm.card) {
      const customer = await stripe.customers.retrieve(u.stripe_customer_id, {
        expand: ["invoice_settings.default_payment_method"],
      });
      pm = customer.invoice_settings?.default_payment_method;
    }
    if (!pm || typeof pm === "string" || !pm.card) {
      const list = await stripe.paymentMethods.list({ customer: u.stripe_customer_id, type: "card", limit: 1 });
      pm = list.data[0];
    }

    return res.json({
      payment_method: pm?.card
        ? { brand: pm.card.brand, last4: pm.card.last4, exp_month: pm.card.exp_month, exp_year: pm.card.exp_year }
        : null,
    });
  } catch (err) {
    console.error("❌ Erro ao buscar forma de pagamento:", err.message);
    return res.json({ payment_method: null }); // exibição opcional: não quebra a tela
  }
}
