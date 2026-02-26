import { sendEmailBrevo } from "../../src/utils/mailer.js";
import { emailLayout } from "../utils/templatemail/auth/mailLayout.js";

export async function sendContact(req, res) {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({
        error: "Campos obrigatórios não preenchidos.",
      });
    }

    /* ===============================
       EMAIL PARA TECNOLOGIA
    =============================== */

    const bodyTech = `
      <div style="font-family:Arial, sans-serif;">
        <h2>Novo chamado pelo site</h2>
        <p><strong>Nome:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefone:</strong> ${phone || "Não informado"}</p>
        <hr />
        <p><strong>Mensagem:</strong></p>
        <p>${message}</p>
      </div>
    `;

    await sendEmailBrevo({
      to: "tecnologia@sportinsider.com.br",
      subject: `Novo contato - ${firstName} ${lastName}`,
      html: emailLayout({ body: bodyTech }),
    });

    /* ===============================
       EMAIL PARA O USUÁRIO
    =============================== */

    const bodyUser = `
      <div style="font-family:Arial, sans-serif;">
        <h2>Recebemos sua mensagem 👊</h2>
        <p>Olá ${firstName},</p>
        <p>Recebemos seu contato e nossa equipe já foi notificada.</p>
        <p>Em breve retornaremos.</p>
        <br/>
        <p><strong>Sua mensagem:</strong></p>
        <p>${message}</p>
      </div>
    `;

    await sendEmailBrevo({
      to: email,
      subject: "Recebemos sua mensagem",
      html: emailLayout({ body: bodyUser }),
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Erro contato:", error);
    return res.status(500).json({
      error: "Erro ao enviar contato.",
    });
  }
}