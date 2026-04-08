// Templates de e-mail
import { emailLayout } from "../utils/templatemail/auth/mailLayout.js";

/**
 * Função base para enviar e-mail pela API da Brevo
 */
export async function sendEmailBrevo({ to, subject, html }) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "Sport Insider",
        email: "editorial@sportinsider.com.br", // precisa estar validado no Brevo
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  const data = await response.json();

  //. se sucesso
  console.log(response);

  if (!response.ok) {
    console.error("Erro Brevo:", data);
    throw new Error(data.message || "Erro ao enviar e-mail via Brevo");
  }

  return data;
}

/**
 * Envia e-mail de redefinição de senha
 */
export async function sendResetEmail(to, token) {
  const resetUrl = `${process.env.PROD_URL}/reset?token=${token}`;

  const body = `
    <div style="font-family:Arial, sans-serif; color:#111111;">

      <h2 style="margin:0 0 12px 0; font-size:26px; font-weight:700;">
        Redefinição de senha
      </h2>

      <p style="margin:0 0 24px 0; font-size:16px; line-height:1.6; color:#444444;">
        Você solicitou a redefinição da sua senha.
        Para continuar, clique no botão abaixo:
      </p>

      <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
        <tr>
          <td>
            <a
              href="${resetUrl}"
              style="
                display:inline-block;
                background:#6d28d9;
                color:#ffffff;
                text-decoration:none;
                padding:14px 28px;
                border-radius:8px;
                font-size:16px;
                font-weight:600;
              "
            >
              Redefinir senha
            </a>
          </td>
        </tr>
      </table>

      <p style="margin-top:24px; font-size:13px; color:#777777; line-height:1.5;">
        Se você não solicitou essa ação, apenas ignore este e-mail.
      </p>

    </div>
  `;

  const html = emailLayout({ body });

  return await sendEmailBrevo({
    to,
    subject: "Redefinição de senha",
    html,
  });
}

/**
 * Envia e-mail de sucesso após redefinir senha
 */
export async function sendResetEmailSucess(to) {
  const siteUrl = `${process.env.PROD_URL}/login`;

  const body = `
    <div style="font-family:Arial, sans-serif; color:#111111;">

      <h2 style="margin:0 0 12px 0; font-size:26px; font-weight:700;">
        Senha atualizada com sucesso
      </h2>

      <p style="margin:0 0 24px 0; font-size:16px; line-height:1.6; color:#444444;">
        Sua senha foi redefinida com sucesso.
        Você já pode acessar sua conta utilizando suas novas credenciais.
      </p>

      <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
        <tr>
          <td>
            <a
              href="${siteUrl}"
              style="
                display:inline-block;
                background:#6d28d9;
                color:#ffffff;
                text-decoration:none;
                padding:14px 28px;
                border-radius:8px;
                font-size:16px;
                font-weight:600;
                text-transform:capitalize;
              "
            >
              Acessar conta
            </a>
          </td>
        </tr>
      </table>

      <p style="margin-top:24px; font-size:13px; color:#777777; line-height:1.5;">
        Se você não realizou esta alteração, entre em contato imediatamente com nosso suporte pelo e-mail
        <a
          href="mailto:suporte@sportinsider.com.br"
          style="color:#6d28d9; text-decoration:none; font-weight:600;"
        >
          suporte@sportinsider.com.br
        </a>.
      </p>

    </div>
  `;

  const html = emailLayout({ body });

  return await sendEmailBrevo({
    to,
    subject: "Sua senha foi redefinida com sucesso",
    html,
  });
}

/**
 * Adiciona ou atualiza um contato na lista do Brevo.
 * updateEnabled: true → cria se não existe, atualiza se já existe.
 */
export async function addContactToBrevo({ email, name, planName }) {
  const parts = (name || "").trim().split(/\s+/);
  const firstName = parts[0] || "";
  const lastName = parts.length > 1 ? parts[parts.length - 1] : "";

  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email,
      attributes: {
        NOME: firstName,
        SOBRENOME: lastName,
        FROM_PRO: "sim",
        PLANO_PRO: planName,
      },
      listIds: [6],
      updateEnabled: true,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("[Brevo] Erro ao adicionar contato:", data);
    throw new Error(data.message || "Erro ao adicionar contato no Brevo");
  }

  return data;
}

/**
 * Atualiza apenas o atributo PLANO_PRO de um contato já existente no Brevo.
 * Usa PUT (não POST) para não adicionar o contato a nenhuma lista.
 * Se o contato não existir (não aceitou newsletter), a chamada retorna 404
 * e o erro é ignorado silenciosamente pelo chamador.
 */
export async function updateContactPlanInBrevo({ email, planName }) {
  const encoded = encodeURIComponent(email);
  const response = await fetch(`https://api.brevo.com/v3/contacts/${encoded}`, {
    method: "PUT",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      attributes: { PLANO_PRO: planName },
    }),
  });

  // 404 = contato não existe (não aceitou newsletter) → ignora
  if (response.status === 404) return;

  if (!response.ok) {
    const data = await response.json();
    console.error("[Brevo] Erro ao atualizar plano do contato:", data);
    throw new Error(data.message || "Erro ao atualizar contato no Brevo");
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateBR(timestamp) {
  const date = typeof timestamp === "number"
    ? new Date(timestamp * 1000)
    : new Date(timestamp);
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

const manageUrl = `${process.env.PROD_URL}/account`;
const renewUrl = `${process.env.PROD_URL}/planos`;

// ─── E-mails de assinatura ────────────────────────────────────────────────────

/**
 * Plano ativado com sucesso (checkout.session.completed)
 */
export async function sendPlanActivatedEmail(to, { name, planName, periodEnd }) {
  const body = `
    <div style="font-family:Arial, sans-serif; color:#111111;">

      <h2 style="margin:0 0 12px 0; font-size:26px; font-weight:700;">
        Bem-vindo ao ${planName}! 🎉
      </h2>

      <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#444444;">
        Olá, <strong>${name}</strong>!<br/>
        Sua assinatura foi ativada com sucesso. A partir de agora você tem acesso completo ao Sport Insider.
      </p>

      <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#444444;">
        Seu próximo ciclo de cobrança é em <strong>${formatDateBR(periodEnd)}</strong>.
      </p>

      <table cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;">
        <tr>
          <td>
            <a href="${process.env.PROD_URL}"
              style="display:inline-block; background:#6d28d9; color:#ffffff; text-decoration:none;
                     padding:14px 28px; border-radius:8px; font-size:16px; font-weight:600;">
              Acessar o Sport Insider
            </a>
          </td>
        </tr>
      </table>

      <p style="font-size:13px; color:#777777; line-height:1.5;">
        Dúvidas? Fale com nosso suporte:
        <a href="mailto:suporte@sportinsider.com.br" style="color:#6d28d9; text-decoration:none;">
          suporte@sportinsider.com.br
        </a>
      </p>

    </div>
  `;

  return sendEmailBrevo({ to, subject: `Sua assinatura ${planName} foi ativada!`, html: emailLayout({ body }) });
}

/**
 * Assinatura cancelada — acesso garantido até fim do ciclo (subscription.updated + cancel_at_period_end=true)
 */
export async function sendSubscriptionCanceledEmail(to, { name, planName, periodEnd }) {
  const body = `
    <div style="font-family:Arial, sans-serif; color:#111111;">

      <h2 style="margin:0 0 12px 0; font-size:26px; font-weight:700;">
        Cancelamento confirmado
      </h2>

      <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#444444;">
        Olá, <strong>${name}</strong>.<br/>
        Recebemos a solicitação de cancelamento do seu plano <strong>${planName}</strong>.
      </p>

      <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#444444;">
        Você continua com acesso completo até <strong>${formatDateBR(periodEnd)}</strong>.
        Após essa data, sua conta será migrada para o plano gratuito automaticamente.
      </p>

      <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#444444;">
        Mudou de ideia? Você pode reativar sua assinatura a qualquer momento antes dessa data.
      </p>

      <table cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;">
        <tr>
          <td>
            <a href="${renewUrl}"
              style="display:inline-block; background:#6d28d9; color:#ffffff; text-decoration:none;
                     padding:14px 28px; border-radius:8px; font-size:16px; font-weight:600;">
              Reativar assinatura
            </a>
          </td>
        </tr>
      </table>

      <p style="font-size:13px; color:#777777; line-height:1.5;">
        Dúvidas? Fale com a gente:
        <a href="mailto:suporte@sportinsider.com.br" style="color:#6d28d9; text-decoration:none;">
          suporte@sportinsider.com.br
        </a>
      </p>

    </div>
  `;

  return sendEmailBrevo({ to, subject: "Sua assinatura foi cancelada — veja o que acontece agora", html: emailLayout({ body }) });
}

/**
 * Lembrete: plano encerrando em breve (cron ~3 dias antes)
 */
export async function sendSubscriptionExpiringEmail(to, { name, planName, periodEnd }) {
  const body = `
    <div style="font-family:Arial, sans-serif; color:#111111;">

      <h2 style="margin:0 0 12px 0; font-size:26px; font-weight:700;">
        Seu acesso encerra em breve
      </h2>

      <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#444444;">
        Olá, <strong>${name}</strong>!<br/>
        Seu plano <strong>${planName}</strong> se encerra no dia <strong>${formatDateBR(periodEnd)}</strong>.
      </p>

      <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#444444;">
        Após essa data você perderá acesso às análises, dados e relatórios exclusivos do Sport Insider.
        Renove agora e não perca nada.
      </p>

      <table cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;">
        <tr>
          <td>
            <a href="${renewUrl}"
              style="display:inline-block; background:#6d28d9; color:#ffffff; text-decoration:none;
                     padding:14px 28px; border-radius:8px; font-size:16px; font-weight:600;">
              Renovar assinatura
            </a>
          </td>
        </tr>
      </table>

      <p style="font-size:13px; color:#777777; line-height:1.5;">
        Prefere não renovar? Tudo bem — seu acesso segue normalmente até <strong>${formatDateBR(periodEnd)}</strong>.
      </p>

    </div>
  `;

  return sendEmailBrevo({ to, subject: "Seu plano Sport Insider encerra em breve — renove agora", html: emailLayout({ body }) });
}

/**
 * Assinatura encerrada — voltou para o plano gratuito (subscription.deleted)
 */
export async function sendSubscriptionEndedEmail(to, { name }) {
  const body = `
    <div style="font-family:Arial, sans-serif; color:#111111;">

      <h2 style="margin:0 0 12px 0; font-size:26px; font-weight:700;">
        Sua assinatura foi encerrada
      </h2>

      <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#444444;">
        Olá, <strong>${name}</strong>.<br/>
        Sua assinatura chegou ao fim e sua conta foi migrada para o plano gratuito.
      </p>

      <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#444444;">
        Sentimos sua falta! Se quiser voltar, basta assinar um dos nossos planos — é rápido e você retoma o acesso imediatamente.
      </p>

      <table cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;">
        <tr>
          <td>
            <a href="${renewUrl}"
              style="display:inline-block; background:#6d28d9; color:#ffffff; text-decoration:none;
                     padding:14px 28px; border-radius:8px; font-size:16px; font-weight:600;">
              Ver planos
            </a>
          </td>
        </tr>
      </table>

      <p style="font-size:13px; color:#777777; line-height:1.5;">
        Dúvidas? Fale com a gente:
        <a href="mailto:suporte@sportinsider.com.br" style="color:#6d28d9; text-decoration:none;">
          suporte@sportinsider.com.br
        </a>
      </p>

    </div>
  `;

  return sendEmailBrevo({ to, subject: "Sua assinatura Sport Insider foi encerrada", html: emailLayout({ body }) });
}

/**
 * Falha no pagamento (invoice.payment_failed)
 */
export async function sendPaymentFailedEmail(to, { name }) {
  const body = `
    <div style="font-family:Arial, sans-serif; color:#111111;">

      <h2 style="margin:0 0 12px 0; font-size:26px; font-weight:700;">
        Tivemos um problema com seu pagamento
      </h2>

      <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#444444;">
        Olá, <strong>${name}</strong>.<br/>
        Não conseguimos processar o pagamento da sua assinatura Sport Insider.
      </p>

      <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#444444;">
        Para manter seu acesso ativo, atualize suas informações de pagamento o quanto antes.
        O Stripe tentará cobrar novamente nos próximos dias, mas recomendamos verificar agora.
      </p>

      <table cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;">
        <tr>
          <td>
            <a href="${manageUrl}"
              style="display:inline-block; background:#6d28d9; color:#ffffff; text-decoration:none;
                     padding:14px 28px; border-radius:8px; font-size:16px; font-weight:600;">
              Atualizar forma de pagamento
            </a>
          </td>
        </tr>
      </table>

      <p style="font-size:13px; color:#777777; line-height:1.5;">
        Precisa de ajuda? Entre em contato:
        <a href="mailto:suporte@sportinsider.com.br" style="color:#6d28d9; text-decoration:none;">
          suporte@sportinsider.com.br
        </a>
      </p>

    </div>
  `;

  return sendEmailBrevo({ to, subject: "Falha no pagamento — atualize sua forma de pagamento", html: emailLayout({ body }) });
}

/**
 * Reenvia e-mail de verificação
 */
export async function reSendMail(to, token) {
  const verifyUrl = `${process.env.PROD_URL}/verify-email?token=${token}`;

  const body = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Confirme seu e-mail</h2>
      <p>Confirme seu e-mail clicando no botão abaixo:</p>

      <a href="${verifyUrl}" 
        style="background:#6d28d9; padding:10px 18px; color:white; 
              border-radius:6px; text-decoration:none;">
        Confirmar e-mail
      </a>

      <p style="margin-top:20px; font-size:12px; color:#777;">
        Se você não solicitou isso, entre em contato imediatamente com o suporte no e-mail
        <a href="mailto:suporte@sportinsider.com.br">suporte@sportinsider.com.br</a>
      </p>
    </div>
  `;

  const html = emailLayout({ body });

  return await sendEmailBrevo({
    to,
    subject: "Confirme seu e-mail",
    html,
  });
}
