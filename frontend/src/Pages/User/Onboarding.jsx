import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Globe, Coins, Check, ArrowRight, Loader2 } from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const { updateUser } = useContext(AuthContext);

  const [regions, setRegions] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  const [regionId, setRegionId] = useState("");
  const [currencyId, setCurrencyId] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [regionsRes, currenciesRes] = await Promise.all([
          api.get("/user/regions"),
          api.get("/user/currencies"),
        ]);

        setRegions(regionsRes.data);
        setCurrencies(currenciesRes.data);
      } catch (error) {
        console.error("Erro ao carregar onboarding", error);
      }
    }

    loadData();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!regionId || !currencyId) return;

    try {
      setLoading(true);
      setSuccess(false);

      await api.post("/user/preferences", {
        region_id: regionId,
        currency_id: currencyId,
      });

      // ATUALIZA O USER NO CONTEXT
      updateUser({
        preferences: {
          region_id: regionId,
          currency_id: currencyId,
          first_login_completed: true,
        },
      });

      setSuccess(true);

      setTimeout(() => {
        navigate("/dashboard");
      }, 800);
    } catch (error) {
      console.error("Erro ao salvar preferências", error);
    } finally {
      setLoading(false);
    }
  }

  const selectClass = "w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-base sm:text-sm text-[#111] focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all shadow-sm appearance-none cursor-pointer";

  return (
    <div className="max-w-4xl mx-auto bg-gray-50/50 flex items-center justify-center p-4 sm:p-6">
      
      <div className="w-full max-w-2xl">
        
        {/* --- HEADER --- */}
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111]">
            Configuração Inicial
          </h1>
          <p className="text-gray-500 text-sm sm:text-base mt-2 max-w-md mx-auto sm:mx-0">
            Para personalizar sua experiência no dashboard, precisamos definir sua região e moeda preferida.
          </p>
        </div>

        {/* --- CARD PRINCIPAL --- */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          
          {/* Barra de Progresso*/}
          <div className="h-1 w-full bg-gray-100">
              <div className="h-full bg-[#7F33D9] w-1/2 rounded-r-full"></div>
          </div>

          <div className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                  
                  {/* Campo Região */}
                  <div className="space-y-3">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#7F33D9]/10 flex items-center justify-center text-[#7F33D9] shrink-0">
                              <Globe size={18} strokeWidth={2.5} />
                          </div>
                          <label className="text-sm font-semibold text-[#111]">
                              Região & Idioma
                          </label>
                      </div>
                      
                      <div className="relative group">
                          <select
                              value={regionId}
                              onChange={(e) => setRegionId(e.target.value)}
                              className={selectClass}
                              required
                          >
                              <option value="" disabled>Selecione sua região de operação</option>
                              {regions.map((region) => (
                                  <option key={region.id} value={region.id}>
                                      {region.name}
                                  </option>
                              ))}
                          </select>
                          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 group-hover:text-[#7F33D9] transition-colors">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                          </div>
                      </div>
                      <p className="text-xs text-gray-400 pl-1">Isso define quais ligas aparecerão primeiro para você.</p>
                  </div>

                  <div className="border-t border-gray-100"></div>

                  {/* Campo Moeda */}
                  <div className="space-y-3">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#7F33D9]/10 flex items-center justify-center text-[#7F33D9] shrink-0">
                              <Coins size={18} strokeWidth={2.5} />
                          </div>
                          <label className="text-sm font-semibold text-[#111]">
                              Moeda Principal
                          </label>
                      </div>

                      <div className="relative group">
                          <select
                              value={currencyId}
                              onChange={(e) => setCurrencyId(e.target.value)}
                              className={selectClass}
                              required
                          >
                              <option value="" disabled>Selecione a moeda de visualização</option>
                              {currencies.map((currency) => (
                                  <option key={currency.id} value={currency.id}>
                                      {currency.name}
                                  </option>
                              ))}
                          </select>
                          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 group-hover:text-[#7F33D9] transition-colors">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                          </div>
                      </div>
                       <p className="text-xs text-gray-400 pl-1">Os valores financeiros serão convertidos para esta moeda.</p>
                  </div>

                  <div className="pt-2 sm:pt-4">
                      <button
                          type="submit"
                          disabled={loading || success}
                          className={`
                              w-full py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-all duration-300 shadow-lg shadow-purple-500/20 active:scale-[0.98]
                              ${success 
                                  ? "bg-green-500 text-white hover:bg-green-600" 
                                  : "bg-[#7F33D9] text-white hover:bg-[#6025A8] disabled:opacity-70 disabled:cursor-not-allowed"
                              }
                          `}
                      >
                          {loading && !success && (
                              <>
                                  <Loader2 className="animate-spin" size={18} />
                                  <span>Salvando...</span>
                              </>
                          )}

                          {!loading && !success && (
                              <>
                                  <span>Continuar para o Dashboard</span>
                                  <ArrowRight size={18} />
                              </>
                          )}

                          {success && (
                              <>
                                  <Check size={18} />
                                  <span>Preferências salvas! Acessando dashboard...</span>
                              </>
                          )}
                      </button>
                  </div>
              </form>
          </div>
        </div>
      </div>
    </div>
  );
}