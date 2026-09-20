// Regras de upload de imagem — espelham backend/src/config/media.js.
// A validação real é do servidor; aqui só evitamos enviar o que já sabemos que será recusado.
export const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.gif,.webp,.svg";
export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
export const IMAGE_MAX_BYTES = 3 * 1024 * 1024;
export const IMAGE_RULES_TEXT = "JPEG, JPG, PNG, GIF, WEBP ou SVG · até 3 MB";

// Retorna a mensagem de erro (string) ou null se o arquivo pode ser enviado.
export function validateImageFile(file) {
  if (!file) return "Nenhum arquivo selecionado.";
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!IMAGE_EXTENSIONS.includes(ext)) return "Formato não permitido. Envie apenas jpeg, jpg, png, gif, webp ou svg.";
  if (file.size > IMAGE_MAX_BYTES) return "Arquivo maior que o limite permitido (3 MB).";
  return null;
}

// Mensagem devolvida pelo servidor (415/413/400) ou um texto padrão.
export function uploadErrorMessage(err, fallback = "Erro ao enviar a imagem.") {
  return err?.response?.data?.message || fallback;
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
