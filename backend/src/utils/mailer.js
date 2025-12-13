import nodemailer from "nodemailer";

// Templates de e-mail do auth
import { resetPasswordTemplate } from "../utils/templatemail/auth/resetPasswordTemplate.js";
import { resetPasswordTemplateSucess } from "../utils/templatemail/auth/resetPasswordTemplateSucess.js";
import { resendMailTemplate } from "../utils/templatemail/auth/resendMailTemplate.js";

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
  const html = resetPasswordTemplate(resetUrl);

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
  const html = resetPasswordTemplateSucess(siteUrl_send);

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

  // Esta linha garante que o link vá para o React (Porta 5173)
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const html = resendMailTemplate(verifyUrl);

  try {
    
    await transporter.sendMail({
      from: `"${process.env.SENDER_SUPORTE}" <${process.env.MAIL_USER}>`,
      to,
      subject: "Confirme seu e-mail",
      html
    });

  } catch (err) {
    console.error("Erro ao enviar email de verificação:", err);
  }
}
