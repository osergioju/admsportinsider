import Stripe from "stripe";
import db from  from "../config/db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhookHandler = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("❌ Erro ao validar webhook:", err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  const data = event.data.object;

  console.log("\n🔔 ========== NOVO EVENTO RECEBIDO ==========");
  console.log("📋 Tipo do evento:", event.type);
  console.log("🆔 ID do objeto:", data.id);

  switch (event.type) {
    // ========================================
    // ✔ CHECKOUT COMPLETED (ATIVA PLANO)
    // ========================================
    case "checkout.session.completed": {
      console.log("\n💰 === CHECKOUT SESSION COMPLETED ===");
      
      const userId = data.metadata?.userId;
      const plan_id = Number(data.metadata?.plan_id);

      console.log("👤 userId do metadata:", userId);
      console.log("📦 plan_id do metadata:", plan_id);

      if (!userId || !plan_id) {
        console.log("⚠️ ATENÇÃO: userId ou plan_id não encontrados no metadata!");
        break;
      }

      console.log("💰 Checkout concluído para user:", userId);

      const session = await stripe.checkout.sessions.retrieve(data.id, {
        expand: ["subscription", "line_items"],
      });

      console.log("📄 Session recuperada:");
      console.log("  - subscription ID:", session.subscription?.id);

      if (!session.subscription) {
        console.log("⚠️ ATENÇÃO: Nenhuma subscription encontrada na session!");
        break;
      }

      const subscription = session.subscription;
      const priceId = session.line_items.data[0].price.id;
      
      const periodEnd = subscription.items?.data?.[0]?.current_period_end || subscription.current_period_end;

      console.log("\n📊 DADOS DA SUBSCRIPTION:");
      console.log("  - subscription.id:", subscription.id);
      console.log("  - subscription.status:", subscription.status);
      console.log("  - subscription.cancel_at_period_end:", subscription.cancel_at_period_end);
      console.log("  - periodEnd (do items):", periodEnd);
      console.log("  - priceId:", priceId);

      console.log("\n💾 EXECUTANDO UPDATE NO BANCO:");
      console.log("  Valores que serão salvos:");
      console.log("  [1] plan_id:", plan_id);
      console.log("  [2] stripe_subscription_id:", subscription.id);
      console.log("  [3] stripe_price_id:", priceId);
      console.log("  [4] subscription_status:", subscription.status);
      console.log("  [5] cancel_at_period_end:", subscription.cancel_at_period_end);
      console.log("  [6] subscription_current_period_end (timestamp):", periodEnd);
      console.log("  [7] userId (WHERE):", userId);

      const result = await db.query(
        `UPDATE users SET
          plan_id = $1,
          stripe_subscription_id = $2,
          stripe_price_id = $3,
          subscription_status = $4,
          cancel_at_period_end = $5,
          subscription_current_period_end = to_timestamp($6)
        WHERE id = $7
        RETURNING id, plan_id, cancel_at_period_end, subscription_current_period_end`,
        [
          plan_id,
          subscription.id,
          priceId,
          subscription.status,
          subscription.cancel_at_period_end,
          periodEnd,
          userId,
        ]
      );

      console.log("✅ UPDATE executado! Linhas afetadas:", result.rowCount);
      console.log("📄 Dados atualizados:", result.rows[0]);

      break;
    }

    // ========================================
    // ✔ SUBSCRIPTION CREATED
    // ========================================
    case "customer.subscription.created": {
      console.log("\n🆕 === SUBSCRIPTION CREATED ===");
      
      const { id, customer, status, items, cancel_at_period_end } = data;

      const priceId = items.data[0].price.id;
      const current_period_end = items.data[0].current_period_end;

      console.log("📊 DADOS RECEBIDOS:");
      console.log("  - subscription id:", id);
      console.log("  - customer:", customer);
      console.log("  - status:", status);
      console.log("  - cancel_at_period_end:", cancel_at_period_end);
      console.log("  - current_period_end (do items):", current_period_end);
      console.log("  - priceId:", priceId);

      console.log("\n💾 EXECUTANDO UPDATE NO BANCO:");
      console.log("  [1] stripe_subscription_id:", id);
      console.log("  [2] stripe_price_id:", priceId);
      console.log("  [3] subscription_status:", status);
      console.log("  [4] cancel_at_period_end:", cancel_at_period_end);
      console.log("  [5] subscription_current_period_end:", current_period_end);
      console.log("  [6] stripe_customer_id (WHERE):", customer);

      const result = await db.query(
        `UPDATE users SET
          stripe_subscription_id = $1,
          stripe_price_id = $2,
          subscription_status = $3,
          cancel_at_period_end = $4,
          subscription_current_period_end = to_timestamp($5)
         WHERE stripe_customer_id = $6
         RETURNING id, cancel_at_period_end, subscription_current_period_end`,
        [id, priceId, status, cancel_at_period_end, current_period_end, customer]
      );

      console.log("✅ UPDATE executado! Linhas afetadas:", result.rowCount);
      console.log("📄 Dados atualizados:", result.rows[0]);

      break;
    }

    // ========================================
    // ✔ SUBSCRIPTION UPDATED
    // ========================================
    case "customer.subscription.updated": {
      console.log("\n🔄 === SUBSCRIPTION UPDATED ===");
      
      const {
        id,
        customer,
        status,
        items,
      } = data;

      const priceId = items.data[0].price.id;
      const current_period_end = items.data[0].current_period_end;

      // 🔥 BUSCA A SUBSCRIPTION COMPLETA DIRETO DO STRIPE PRA GARANTIR
      console.log("🔍 Buscando subscription completa do Stripe...");
      const fullSubscription = await stripe.subscriptions.retrieve(id);
      
      // 🔥 VERIFICA TANTO cancel_at_period_end QUANTO cancel_at
      const cancel_at_period_end = fullSubscription.cancel_at_period_end || !!fullSubscription.cancel_at;

      console.log("📊 DADOS RECEBIDOS:");
      console.log("  - subscription id:", id);
      console.log("  - customer:", customer);
      console.log("  - status:", status);
      console.log("  - cancel_at_period_end (do webhook):", data.cancel_at_period_end);
      console.log("  - cancel_at (timestamp do Stripe):", fullSubscription.cancel_at);
      console.log("  - cancel_at_period_end (calculado): 🔥", cancel_at_period_end);
      console.log("  - current_period_end (do items):", current_period_end);
      console.log("  - priceId:", priceId);

      console.log("\n💾 EXECUTANDO UPDATE NO BANCO:");
      console.log("  [1] subscription_status:", status);
      console.log("  [2] cancel_at_period_end:", cancel_at_period_end);
      console.log("  [3] stripe_price_id:", priceId);
      console.log("  [4] subscription_current_period_end:", current_period_end);
      console.log("  [5] stripe_customer_id (WHERE):", customer);

      const result = await db.query(
        `UPDATE users SET
          subscription_status = $1,
          cancel_at_period_end = $2,
          stripe_price_id = $3,
          subscription_current_period_end = to_timestamp($4)
        WHERE stripe_customer_id = $5
        RETURNING id, cancel_at_period_end, subscription_current_period_end`,
        [status, cancel_at_period_end, priceId, current_period_end, customer]
      );

      console.log("✅ UPDATE executado! Linhas afetadas:", result.rowCount);
      console.log("📄 Dados atualizados:", result.rows[0]);

      break;
    }

    // ========================================
    // ✔ INVOICE PAID (PERÍODO PAGO REAL)
    // ========================================
    case "invoice.payment_succeeded":
    case "invoice.paid": {
      console.log("\n🧾 === INVOICE PAID ===");
      
      const invoiceId = data.id;

      console.log("📄 Invoice ID:", invoiceId);

      // 🔥 BUSCA O INVOICE COMPLETO
      const fullInvoice = await stripe.invoices.retrieve(invoiceId);

      console.log("📋 Invoice completo recuperado:");
      console.log("  - subscription:", fullInvoice.subscription);

      if (!fullInvoice.subscription) {
        console.log("⚠️ ATENÇÃO: Nenhuma subscription encontrada no invoice!");
        break;
      }

      const periodEndRaw = fullInvoice.lines?.data?.[0]?.period?.end;

      console.log("⏰ periodEndRaw (antes conversão):", periodEndRaw);

      if (!periodEndRaw) {
        console.log("⚠️ ATENÇÃO: Nenhum period.end encontrado no invoice!");
        break;
      }

      const periodEnd = periodEndRaw > 1e12 ? periodEndRaw / 1000 : periodEndRaw;

      console.log("⏰ periodEnd (após conversão):", periodEnd);
      console.log("📅 Data legível:", new Date(periodEnd * 1000));

      console.log("\n💾 EXECUTANDO UPDATE NO BANCO:");
      console.log("  [1] subscription_current_period_end:", periodEnd);
      console.log("  [2] stripe_subscription_id (WHERE):", fullInvoice.subscription);

      const result = await db.query(
        `UPDATE users SET
          subscription_current_period_end = to_timestamp($1)
        WHERE stripe_subscription_id = $2
        RETURNING id, subscription_current_period_end`,
        [periodEnd, fullInvoice.subscription]
      );

      console.log("✅ UPDATE executado! Linhas afetadas:", result.rowCount);
      console.log("📄 Dados atualizados:", result.rows[0]);

      break;
    }

    // ========================================
    // ✔ SUBSCRIPTION DELETED (DOWNGRADE FINAL)
    // ========================================
    case "customer.subscription.deleted": {
      console.log("\n❌ === SUBSCRIPTION DELETED ===");
      
      const { customer } = data;

      console.log("👤 Customer ID:", customer);
      console.log("🔄 Resetando plano para FREE (plan_id = 1)");

      const result = await db.query(
        `UPDATE users SET
          plan_id = 1,
          subscription_status = 'canceled',
          stripe_subscription_id = NULL,
          stripe_price_id = NULL,
          cancel_at_period_end = false,
          subscription_current_period_end = NULL
         WHERE stripe_customer_id = $1
         RETURNING id, plan_id, subscription_status`,
        [customer]
      );

      console.log("✅ UPDATE executado! Linhas afetadas:", result.rowCount);
      console.log("📄 Dados atualizados:", result.rows[0]);

      break;
    }

    default:
      console.log(`⚠️ Evento não tratado: ${event.type}`);
  }

  console.log("\n✅ ========== WEBHOOK PROCESSADO ==========\n");
  res.json({ received: true });
};