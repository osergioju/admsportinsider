export const resetPasswordTemplate = (resetUrl) => `
  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <h2>Redefinição de senha</h2>
    <p>Você solicitou a redefinição da sua senha. Clique no link abaixo:</p>

    <a href="${resetUrl}" 
      style="background:#4c6ef5; padding:10px 18px; color:white; 
             border-radius:6px; text-decoration:none;">
      Redefinir senha
    </a>

    <p style="margin-top:20px; font-size:12px; color:#777;">
      Se você não solicitou isso, apenas ignore esta mensagem.
    </p>
  </div>
`;
