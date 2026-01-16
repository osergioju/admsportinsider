import { useState, useContext } from "react";
import { AuthContext } from "../../../../context/AuthContext";
import { api } from "../../../../services/api";
import { AlertTriangle, Trash2, Loader2, AlertCircle } from "lucide-react";

export default function PrivacyDelete() {
  const { logout, user } = useContext(AuthContext); // Importar logout para sair após deletar
  
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Palavra-chave para confirmação
  const KEYWORD = "DELETAR";

  async function handleDelete() {
    if (confirmText !== KEYWORD) return;

    setLoading(true);
    setError("");

    try {
      await api.delete(`/user/${user.id}`); 
      
      // Simulação de delay para UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Após deletar, desloga o usuário
      logout();
      
    } catch (err) {
      console.error("Erro ao deletar conta", err);
      setError("Ocorreu um erro ao tentar deletar sua conta. Tente novamente.");
      setLoading(false);
    }
  }

  // Classes CSS
  const inputClass = "w-full px-4 py-2.5 bg-white border border-red-200 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-gray-300 text-gray-900";
  const btnDangerClass = "flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20 w-full sm:w-auto";

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111]">Você tem certeza disso?</h1>
        <p className="text-sm text-gray-500 mt-1">
          As ações realizadas aqui são irreversíveis.
        </p>
      </div>

      {/* Card de Alerta Vermelho */}
      <div className="border border-red-100 bg-red-50/50 rounded-xl p-6">
        <div className="flex items-start gap-4">
            <div className="p-2 bg-red-100 rounded-full text-red-600 shrink-0">
                <AlertTriangle size={24} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-red-700 mb-1">Deletar conta permanentemente</h2>
                <p className="text-sm text-red-600/80 leading-relaxed mb-4">
                    Ao deletar sua conta, todos os seus dados, histórico de assinaturas e preferências serão removidos permanentemente dos nossos servidores. 
                    <strong className="block mt-1">Essa ação não pode ser desfeita.</strong>
                </p>

                {/* Input de Confirmação */}
                <div className="mt-6 p-4 bg-white rounded-lg border border-red-100 shadow-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Para confirmar, digite <span className="font-bold text-red-600 select-all">"{KEYWORD}"</span> abaixo:
                    </label>
                    <input 
                        type="text" 
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                        placeholder={KEYWORD}
                        className={inputClass}
                    />
                </div>

                {/* Mensagem de Erro (se houver) */}
                {error && (
                    <div className="mt-4 p-3 rounded-lg bg-red-100 border border-red-200 flex items-center gap-2 text-red-700 text-sm">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {/* Botão de Ação */}
                <div className="mt-6 flex justify-end">
                    <button 
                        onClick={handleDelete}
                        disabled={confirmText !== KEYWORD || loading}
                        className={btnDangerClass}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Deletando...
                            </>
                        ) : (
                            <>
                                <Trash2 size={16} /> Deletar minha conta
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}