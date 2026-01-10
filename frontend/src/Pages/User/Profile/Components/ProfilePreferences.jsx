import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../../context/AuthContext";
import { api } from "../../../../services/api";
import { Check, AlertCircle, Loader2 } from "lucide-react";

export default function ProfilePreferences() {
  const { user, setUser } = useContext(AuthContext);

  const [form, setForm] = useState({
    email_notifications: false,
    product_updates: false,
    language: "en",
    region: "Brasil"
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  if (!user) return null;

  /* =========================
     Hydrate / Fetch preferences
  ========================= */
  useEffect(() => {
    async function loadPreferences() {
      try {
        if (user.preferences) {
          setForm({
            email_notifications: !!user.preferences.email_notifications,
            product_updates: !!user.preferences.product_updates,
            language: user.preferences.language || "en",
            region: user.preferences.region || "Brasil"
          });
          setFetching(false);
          return;
        }

        const response = await api.get("/user/preferences");

        setForm({
          email_notifications: !!response.data.email_notifications,
          product_updates: !!response.data.product_updates,
          language: response.data.language || "en",
          region: response.data.region || "Brasil"
        });

        setUser(prev => ({
          ...prev,
          preferences: response.data
        }));

      } catch (err) {
        console.error("Error fetching preferences", err);
      } finally {
        setFetching(false);
      }
    }

    loadPreferences();
  }, [user, setUser]);

  /* =========================
     Handlers
  ========================= */
  function handleToggle(e) {
    const { name, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: checked }));
    setSuccess(false);
    setError("");
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setSuccess(false);
    setError("");
  }

  /* =========================
     Submit
  ========================= */
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");

    const payload = {};

    if (form.email_notifications !== user.preferences?.email_notifications) {
      payload.email_notifications = form.email_notifications;
    }
    if (form.product_updates !== user.preferences?.product_updates) {
      payload.product_updates = form.product_updates;
    }
    if (form.language !== user.preferences?.language) {
      payload.language = form.language;
    }
    if (form.region !== user.preferences?.region) {
      payload.region = form.region;
    }

    if (!Object.keys(payload).length) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.put("/user/preferences", payload);

      setUser(prev => ({
        ...prev,
        preferences: response.data.preferences || response.data
      }));

      setSuccess(true);
      
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error("Error updating preferences", err);
      setError("Ocorreu um erro ao salvar as suas preferências. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     Loading state
  ========================= */
  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-[#7F33D9]" size={24} />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-xl font-bold text-[#111]">Preferências</h1>
        <p className="text-sm text-gray-500 mt-1">
          Personalize como recebe notificações e o idioma da plataforma.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3 text-green-700 text-sm animate-fade-in">
          <Check size={18} />
          Preferências atualizadas com sucesso!
        </div>
      )}

      {/* AQUI: Removido 'max-w-lg' e adicionado 'w-full' para ocupar todo o modal e centralizar */}
      <form onSubmit={handleSubmit} className="space-y-8 w-full">
        
        {/* Bloco de Notificações */}
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Notificações</h3>
            
            <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-colors bg-gray-50/50">
            <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">Notificações por e-mail</span>
                <span className="text-xs text-gray-500">Receba resumos e alertas importantes</span>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    name="email_notifications"
                    checked={form.email_notifications}
                    onChange={handleToggle}
                    className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7F33D9]"></div>
            </div>
            </label>

            <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-colors bg-gray-50/50">
            <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">Atualizações de Produto</span>
                <span className="text-xs text-gray-500">Novidades e melhorias do Sport Insider</span>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    name="product_updates"
                    checked={form.product_updates}
                    onChange={handleToggle}
                    className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7F33D9]"></div>
            </div>
            </label>
        </div>

        <hr className="border-gray-100" />

        {/* Bloco de Localização */}
        <div className="space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Localização</h3>
            
            {/* O Grid agora ocupará 100% da largura do modal, ficando balanceado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Região</label>
                    <div className="relative">
                        <select
                            name="region"
                            value={form.region}
                            onChange={handleChange}
                            className="w-full appearance-none bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#7F33D9] focus:border-[#7F33D9] block p-2.5 pr-8"
                        >
                            <option value="Brasil">Brasil</option>
                            <option value="Inglaterra">Inglaterra</option>
                            <option value="Portugal">Portugal</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
                    <div className="relative">
                        <select
                            name="language"
                            value={form.language}
                            onChange={handleChange}
                            className="w-full appearance-none bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#7F33D9] focus:border-[#7F33D9] block p-2.5 pr-8"
                        >
                            <option value="en">English</option>
                            <option value="es">Espanhol</option>
                            <option value="pt-BR">Português (Brasil)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-medium hover:bg-[#6025A8] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
          >
            {loading ? (
                <>
                    <Loader2 size={16} className="animate-spin" />
                    Salvando...
                </>
            ) : (
                "Salvar preferências"
            )}
          </button>
        </div>

      </form>
    </div>
  );
}