import dotenv from "dotenv";
dotenv.config();

import {
  sendPlanActivatedEmail,
  sendSubscriptionCanceledEmail,
  sendSubscriptionExpiringEmail,
  sendSubscriptionEndedEmail,
  sendPaymentFailedEmail,
} from "./src/utils/mailer.js";

const TEST_EMAIL = process.env.TEST_EMAIL || "seu@email.com";

const templates = {
  activated: () => sendPlanActivatedEmail(TEST_EMAIL, {
    name: "João Teste",
    planName: "Pro",
    periodEnd: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // +30 dias
  }),
  canceled: () => sendSubscriptionCanceledEmail(TEST_EMAIL, {
    name: "João Teste",
    planName: "Pro",
    periodEnd: Math.floor(Date.now() / 1000) + 15 * 24 * 60 * 60, // +15 dias
  }),
  expiring: () => sendSubscriptionExpiringEmail(TEST_EMAIL, {
    name: "João Teste",
    planName: "Pro",
    periodEnd: Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60, // +3 dias
  }),
  ended: () => sendSubscriptionEndedEmail(TEST_EMAIL, {
    name: "João Teste",
  }),
  payment_failed: () => sendPaymentFailedEmail(TEST_EMAIL, {
    name: "João Teste",
  }),
};

const template = process.argv[2];

if (!template || !templates[template]) {
  console.log("Uso: node test-email.js <template>");
  console.log("Templates disponíveis:", Object.keys(templates).join(", "));
  process.exit(1);
}

console.log(`Enviando template "${template}" para ${TEST_EMAIL}...`);

templates[template]()
  .then(() => console.log("✅ E-mail enviado com sucesso!"))
  .catch((err) => console.error("❌ Erro:", err.message));
