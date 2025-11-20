import nodemailer from "nodemailer";

// Templates de e-mail do auth
import { resetPasswordTemplate } from "../utils/templatemail/auth/resetPasswordTemplate.js";

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
      from: `"Suporte" <${process.env.MAIL_USER}>`,
      to,
      subject: "Redefinição de senha",
      html
    });
    console.log("=== Email enviado com sucesso! ===");
  } catch (err) {
    console.error("Erro ao enviar email:", err);
  }
}
