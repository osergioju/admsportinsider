import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { api } from "../../services/api";

export default function Onboarding() {
  const navigate = useNavigate();
  const { updateUser } = useContext(AuthContext);

  const [regions, setRegions] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  const [regionId, setRegionId] = useState("");
  const [currencyId, setCurrencyId] = useState("");

  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState(false);

  // Buscar regiões e moedas
  useEffect(() => {
    async function loadData() {
        try {
        const [regionsRes, currenciesRes] = await Promise.all([
            api.get("/user/regions"),
            api.get("/user/currencies")
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

        // 🔥 ATUALIZA O USER NO CONTEXT
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

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">
        Para acessar, complete seu cadastro
      </h1>

      <p className="text-gray-500 mb-8">
        Escolha sua região e moeda para personalizar sua experiência.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Região */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Região / Idioma
          </label>

          <select
            value={regionId}
            onChange={(e) => setRegionId(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
            required
          >
            <option value="">Selecione uma região</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        {/* Moeda */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Moeda
          </label>

          <select
            value={currencyId}
            onChange={(e) => setCurrencyId(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
            required
          >
            <option value="">Selecione uma moeda</option>
            {currencies.map((currency) => (
              <option key={currency.id} value={currency.id}>
                {currency.name}
              </option>
            ))}
          </select>
        </div>

        {/* Ação */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 rounded-md flex items-center gap-2
                ${success ? "bg-green-600" : "bg-black"}
                text-white disabled:opacity-70`}
            >
            {loading && !success && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}

                {!loading && !success && "Continuar"}

                {loading && !success && "Salvando..."}

                {success && "Salvo com sucesso! Redirecionando..."}
            </button>

        </div>
      </form>
    </div>
  );
}
