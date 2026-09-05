import { useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { api } from "../../../services/api";

export default function EmbedModal({ chart, onClose }) {
  const [copied, setCopied] = useState(false);

  const targetId = `si-chart-${chart.embed_token}`;
  const embedBase = api.defaults.baseURL;
  const snippet = `<div id="${targetId}"></div>
<script src="${embedBase}/public/embed/chart-embed.js" data-chart-token="${chart.embed_token}" data-target="${targetId}" async></script>`;

  function handleCopy() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Incorporar "{chart.title}"</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Cole este trecho na página onde o gráfico deve aparecer (WordPress, site de parceiro etc.). O gráfico
            incorporado sempre mostra a marca Sport Insider no rodapé.
          </p>
          <pre className="bg-gray-900 text-gray-100 text-xs p-4 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
            {snippet}
          </pre>
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copiado!" : "Copiar código"}
          </button>
        </div>
      </div>
    </div>
  );
}
