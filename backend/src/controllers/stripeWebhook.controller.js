import stripe from "../config/stripe.js";
import db from "../config/db.js";
import {
  sendPlanActivatedEmail,
  sendSubscriptionCanceledEmail,
  sendSubscriptionEndedEmail,
  sendPaymentFailedEmail,
  updateContactPlanInBrevo,
} from "../utils/mailer.js";

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

  // Stripe pode reenviar o mesmo evento (retries) — evita reprocessar e duplicar efeitos colaterais (e-mails, etc.)
  const dedupe = await db.query(
    `INSERT INTO stripe_events (id, event_type) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING RETURNING id`,
    [event.id, event.type]
  );

  if (dedupe.rowCount === 0) {
    console.log("↩️ Evento já processado anteriormente, ignorando:", event.id);
    return res.json({ received: true, duplicate: true });
  }

  try {
    await processStripeEvent(event, data);
  } catch (err) {
    console.error("❌ Erro ao processar evento do webhook:", err);
    // Libera o evento pra Stripe poder tentar de novo (não deixamos marcado como processado)
    await db.query(`DELETE FROM stripe_events WHERE id = $1`, [event.id]).catch(() => {});
    return res.status(500).json({ error: "Erro ao processar evento" });
  }

  console.log("\n✅ ========== WEBHOOK PROCESSADO ==========\n");
  return res.json({ received: true });
};

async function processStripeEvent(event, data) {
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

      // ── E-mail: plano ativado ──
      console.log("\n📧 Tentando enviar e-mail de ativação de plano...");
      try {
        const userRes = await db.query(
          `SELECT u.name, u.email, p.name AS plan_name
           FROM users u
           JOIN plans p ON p.id = u.plan_id
           WHERE u.id = $1`,
          [userId]
        );
        if (userRes.rows[0]) {
          const { name, email, plan_name } = userRes.rows[0];
          console.log(`  → Destinatário: user ${userId} | Plano: ${plan_name}`);
          await sendPlanActivatedEmail(email, { name, planName: plan_name, periodEnd });
          console.log("  ✅ E-mail de ativação enviado com sucesso.");
          await updateContactPlanInBrevo({ email, planName: plan_name });
          console.log("  ✅ Brevo atualizado com novo plano:", plan_name);
        } else {
          console.log("  ⚠️ Usuário não encontrado no banco para userId:", userId);
        }
      } catch (emailErr) {
        console.error("  ❌ Falha ao enviar e-mail de ativação:", emailErr.message);
      }

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

      // Detecta transição pelo previous_attributes do próprio evento Stripe
      const previousAttributes = event.data.previous_attributes || {};
      const justCanceled = cancel_at_period_end === true && (
        previousAttributes.cancel_at_period_end === false ||  // via boolean
        previousAttributes.cancel_at === null                  // via timestamp (cancel_at: null → timestamp)
      );

      // Troca de plano pode acontecer pelo Billing Portal (self-service), não só pelo admin —
      // então precisamos re-sincronizar o plan_id local a partir do priceId em todo update, não só no checkout.
      const matchingPlan = await db.query(
        `SELECT id FROM plans WHERE pagarme_plan_id = $1`,
        [priceId]
      );
      const planId = matchingPlan.rows[0]?.id || null;

      console.log("\n💾 EXECUTANDO UPDATE NO BANCO:");
      console.log("  [1] subscription_status:", status);
      console.log("  [2] cancel_at_period_end:", cancel_at_period_end);
      console.log("  [3] stripe_price_id:", priceId);
      console.log("  [4] subscription_current_period_end:", current_period_end);
      console.log("  [5] plan_id (resolvido pelo priceId):", planId);
      console.log("  [6] stripe_customer_id (WHERE):", customer);

      const result = await db.query(
        `UPDATE users SET
          subscription_status = $1,
          cancel_at_period_end = $2,
          stripe_price_id = $3,
          subscription_current_period_end = to_timestamp($4),
          plan_id = COALESCE($6, plan_id)
        WHERE stripe_customer_id = $5
        RETURNING id, plan_id, cancel_at_period_end, subscription_current_period_end`,
        [status, cancel_at_period_end, priceId, current_period_end, customer, planId]
      );

      console.log("✅ UPDATE executado! Linhas afetadas:", result.rowCount);
      console.log("📄 Dados atualizados:", result.rows[0]);

      // ── E-mail: cancelamento agendado (só na transição false → true) ──
      console.log(`\n📧 cancel_at_period_end: ${cancel_at_period_end} | prev.cancel_at_period_end: ${previousAttributes.cancel_at_period_end} | prev.cancel_at: ${previousAttributes.cancel_at} | justCanceled: ${justCanceled}`);
      if (justCanceled) {
        console.log("  → Transição detectada via previous_attributes: enviando e-mail de cancelamento agendado...");
        try {
          const userRes = await db.query(
            `SELECT u.name, u.email, p.name AS plan_name
             FROM users u
             JOIN plans p ON p.id = u.plan_id
             WHERE u.stripe_customer_id = $1`,
            [customer]
          );
          if (userRes.rows[0]) {
            const { name, email, plan_name } = userRes.rows[0];
            console.log(`  → Destinatário: customer ${customer} | Plano: ${plan_name}`);
            await sendSubscriptionCanceledEmail(email, { name, planName: plan_name, periodEnd: current_period_end });
            console.log("  ✅ E-mail de cancelamento enviado com sucesso.");
          } else {
            console.log("  ⚠️ Usuário não encontrado no banco para customer:", customer);
          }
        } catch (emailErr) {
          console.error("  ❌ Falha ao enviar e-mail de cancelamento:", emailErr.message);
        }
      } else {
        console.log("  → Sem transição de cancelamento neste evento — e-mail não enviado.");
      }

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

      // Busca user antes de resetar para ter nome e e-mail
      const deletedUserRes = await db.query(
        `SELECT name, email FROM users WHERE stripe_customer_id = $1`,
        [customer]
      );

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

      // ── E-mail: assinatura encerrada ──
      console.log("\n📧 Tentando enviar e-mail de encerramento de assinatura...");
      if (deletedUserRes.rows[0]) {
        try {
          const { name, email } = deletedUserRes.rows[0];
          console.log(`  → Destinatário: customer ${customer}`);
          await sendSubscriptionEndedEmail(email, { name });
          console.log("  ✅ E-mail de encerramento enviado com sucesso.");
          const freePlanRes = await db.query(`SELECT name FROM plans WHERE id = 1`);
          const freePlanName = freePlanRes.rows[0]?.name || "Gratuito";
          await updateContactPlanInBrevo({ email, planName: freePlanName });
          console.log("  ✅ Brevo atualizado para plano:", freePlanName);
        } catch (emailErr) {
          console.error("  ❌ Falha ao enviar e-mail de encerramento:", emailErr.message);
        }
      } else {
        console.log("  ⚠️ Usuário não encontrado para customer:", customer);
      }

      break;
    }

    // ========================================
    // ✔ PAGAMENTO FALHOU
    // ========================================
    case "invoice.payment_failed": {
      console.log("\n💳 === INVOICE PAYMENT FAILED ===");

      const failedCustomer = data.customer;
      console.log("👤 Customer ID:", failedCustomer);

      // Marca a assinatura como inadimplente — sem isso o usuário mantinha acesso total
      // durante toda a janela de "smart retries" do Stripe mesmo sem pagar.
      await db.query(
        `UPDATE users SET subscription_status = 'past_due' WHERE stripe_customer_id = $1`,
        [failedCustomer]
      );

      console.log("\n📧 Tentando enviar e-mail de falha de pagamento...");
      try {
        const userRes = await db.query(
          `SELECT name, email FROM users WHERE stripe_customer_id = $1`,
          [failedCustomer]
        );
        if (userRes.rows[0]) {
          const { name, email } = userRes.rows[0];
          console.log(`  → Destinatário: customer ${failedCustomer}`);
          await sendPaymentFailedEmail(email, { name });
          console.log("  ✅ E-mail de falha de pagamento enviado com sucesso.");
        } else {
          console.log("  ⚠️ Usuário não encontrado para customer:", failedCustomer);
        }
      } catch (emailErr) {
        console.error("  ❌ Falha ao enviar e-mail de pagamento falhou:", emailErr.message);
      }

      break;
    }

    default:
      console.log(`⚠️ Evento não tratado: ${event.type}`);
  }
}