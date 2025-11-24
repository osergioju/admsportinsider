export const resetPasswordTemplateSucess = (siteUrl) => `
  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <h2>Atualização de senha</h2>
    <p>Sua senha foi redefinida com sucesso, entre com suas credenciais clicando no botão abaixo:</p>

    <a href="${siteUrl}" 
      style="background:#4c6ef5; padding:10px 18px; color:white; 
             border-radius:6px; text-decoration:none;">
      acessar
    </a>

    <p style="margin-top:20px; font-size:12px; color:#777;">
      Se você não solicitou isso, entre em contato imediatamente com o suporte no e-mail <a href="mailto:suporte@sportinsider.com.br">suporte@sportinsider.com.br</a>
    </p>
  </div>
`;
