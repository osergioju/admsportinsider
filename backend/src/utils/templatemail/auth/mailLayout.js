// emails/layout.js
export const emailLayout = ({ body : body }) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
  </head>

  <body style="margin:0; padding:0;>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">

          <!-- CONTAINER -->
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">

            <!-- HEADER (IMAGEM) -->
            <tr>
              <td>
                <img
                  src="https://blqkwuxtdyfddpxdzgov.supabase.co/storage/v1/object/public/assets/header%20(1).png"
                  width="600"
                  style="display:block; width:600px; max-width:100%;"
                  alt="Sportinsider"
                />
              </td>
            </tr>

            <!-- CONTEÚDO -->
            <tr>
              <td style="padding:40px 40px 32px 40px; font-family:Arial, sans-serif; color:#111111;">
                <div style="font-size:16px; line-height:1.6;">
                  ${body}
                </div>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background:#f1f1f1; padding:32px 40px; font-family:Arial, sans-serif;">

                <!-- LOGO -->
                <img
                  src="https://blqkwuxtdyfddpxdzgov.supabase.co/storage/v1/object/public/assets/Group%2061%20(1).png"
                  width="160"
                  alt="Sportinsider"
                  style="display:block; margin-bottom:16px;"
                />

                <p style="font-size:14px; color:#6d28d9; margin:0 0 12px 0;">
                  SIGA
                </p>

                <!-- SOCIAL ICONS -->
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:12px;">
                      <a href="#">
                        <img src="https://blqkwuxtdyfddpxdzgov.supabase.co/storage/v1/object/public/assets/Mask%20group.png" width="24" />
                      </a>
                    </td>
                    <td style="padding-right:12px;">
                      <a href="#">
                        <img src="https://blqkwuxtdyfddpxdzgov.supabase.co/storage/v1/object/public/assets/Vector-1.png" width="24" />
                      </a>
                    </td>
                    <td style="padding-right:12px;">
                      <a href="#">
                        <img src="https://blqkwuxtdyfddpxdzgov.supabase.co/storage/v1/object/public/assets/Vector-2.png" width="24" />
                      </a>
                    </td>
                    <td style="padding-right:12px;">
                      <a href="#">
                        <img src="https://blqkwuxtdyfddpxdzgov.supabase.co/storage/v1/object/public/assets/Vector.png" width="24" />
                      </a>
                    </td>
                    <td>
                      <a href="#">
                        <img src="https://blqkwuxtdyfddpxdzgov.supabase.co/storage/v1/object/public/assets/Vector-3.png" width="24" />
                      </a>
                    </td>
                  </tr>
                </table>

                <hr style="border:none; border-top:1px solid #cccccc; margin:24px 0;" />

                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:12px; color:#555;">
                      Sport Insider, todos os direitos reservados
                    </td>
                    <td align="right" style="font-size:12px; color:#555;">
                      ${new Date().getFullYear()}
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </body>
</html>
`;
