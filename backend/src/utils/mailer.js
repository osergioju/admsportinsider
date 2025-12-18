import nodemailer from "nodemailer";

// Templates de e-mail do auth
import { resetPasswordTemplateSucess } from "../utils/templatemail/auth/resetPasswordTemplateSucess.js";
import { resendMailTemplate } from "../utils/templatemail/auth/resendMailTemplate.js";
import { emailLayout } from "../utils/templatemail/auth/mailLayout.js";

export function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS 
    }
  });
}

export async function sendResetEmail(to, token) {
  const transporter = createTransporter();

  const resetUrl = `${process.env.FRONTEND_URL}/reset?token=${token}`;
  const body = `
    <div style="font-family:Arial, sans-serif; color:#111111;">

      <h2 style="
        margin:0 0 12px 0;
        font-size:26px;
        font-weight:700;
      ">
        Redefinição de senha
      </h2>

      <p style="
        margin:0 0 24px 0;
        font-size:16px;
        line-height:1.6;
        color:#444444;
      ">
        Você solicitou a redefinição da sua senha.
        Para continuar, clique no botão abaixo:
      </p>

      <!-- BOTÃO -->
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

      <p style="
        margin-top:24px;
        font-size:13px;
        color:#777777;
        line-height:1.5;
      ">
        Se você não solicitou essa ação, apenas ignore este e-mail.
      </p>

    </div>
  `;
  
  const html = emailLayout({ body });

  try {
    console.log("=== Enviando email para:", to);
    await transporter.sendMail({
      from: `"${process.env.SENDER_SUPORTE}" <${process.env.MAIL_USER}>`,
      to,
      subject: "Redefinição de senha",
      html
    });
    console.log("=== Email enviado com sucesso! ===");
  } catch (err) {
    console.error("Erro ao enviar email:", err);
  }
}


export async function sendResetEmailSucess(to) {
  const transporter = createTransporter();
  const siteUrl_send = `${process.env.FRONTEND_URL}/login`;
  const body = ` 
    <div style="font-family:Arial, sans-serif; color:#111111;">

      <h2 style="
        margin:0 0 12px 0;
        font-size:26px;
        font-weight:700;
      ">
        Senha atualizada com sucesso
      </h2>

      <p style="
        margin:0 0 24px 0;
        font-size:16px;
        line-height:1.6;
        color:#444444;
      ">
        Sua senha foi redefinida com sucesso.
        Você já pode acessar sua conta utilizando suas novas credenciais.
      </p>

      <!-- BOTÃO -->
      <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
        <tr>
          <td>
            <a
              href="${siteUrl_send}"
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

      <p style="
        margin-top:24px;
        font-size:13px;
        color:#777777;
        line-height:1.5;
      ">
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

  try {
    console.log("=== Enviando email para:", to);
    await transporter.sendMail({
      from: `"${process.env.SENDER_SUPORTE}" <${process.env.MAIL_USER}>`,
      to,
      subject: "Sua senha foi redefinida com sucesso",
      html
    });
    console.log("=== Email enviado com sucesso! ===");
  } catch (err) {
    console.error("Erro ao enviar email:", err);
  }
}


export async function reSendMail(to, token) {
  const transporter = createTransporter();
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  const body =  `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Confirme seu e-mail</h2>
      <p>Confirme seu e-mail clicando no botão abaixo:</p>

      <a href="${verifyUrl}" 
        style="background:#4c6ef5; padding:10px 18px; color:white; 
              border-radius:6px; text-decoration:none;">
        confirmar e-mail
      </a>

      <p style="margin-top:20px; font-size:12px; color:#777;">
        Se você não solicitou isso, entre em contato imediatamente com o suporte no e-mail <a href="mailto:suporte@sportinsider.com.br">suporte@sportinsider.com.br</a>
      </p>
    </div>
  `;

  const html = emailLayout({ body });

  await transporter.sendMail({
    from: `"${process.env.SENDER_SUPORTE}" <${process.env.MAIL_USER}>`,
    to,
    subject: "Confirme seu e-mail",
    html
  });
}
