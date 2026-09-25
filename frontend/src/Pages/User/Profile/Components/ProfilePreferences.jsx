import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../../context/AuthContext";
import { useTranslation } from "../../../../context/TranslationContext";
import { api } from "../../../../services/api";
import { Check, AlertCircle, Loader2 } from "lucide-react";

export default function ProfilePreferences() {
  const { user, updateUser } = useContext(AuthContext);
  const { t } = useTranslation();

  const [regions, setRegions] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  const [form, setForm] = useState({
    email_notifications: false,
    product_updates: false,
    region_id: "",
    currency_id: ""
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");


  /* =========================
     Hydrate (somente do contexto)
  ========================= */
  useEffect(() => {
    if (!user) return; // sem usuário ainda: nada a hidratar (o return antecipado do componente vem depois dos hooks)
    let isMounted = true;

    async function loadData() {
      try {
        // Busca listas auxiliares
        const [regionsRes, currenciesRes] = await Promise.all([
          api.get("/user/regions"),
          api.get("/user/currencies")
        ]);

        if (!isMounted) return;

        setRegions(regionsRes.data);
        setCurrencies(currenciesRes.data);

        // Preferências DEVEM vir do AuthContext
        if (!user.preferences) {
          setError(t("preferences.not_found", "Preferências não encontradas."));
          return;
        }

        setForm({
          email_notifications: !!user.email_notifications,
          product_updates: !!user.product_updates,
          region_id: user.preferences.region_id || "",
          currency_id: user.preferences.currency_id || ""
        });

      } catch (err) {
        console.error("Erro ao carregar preferências", err);
        if (isMounted) {
          setError("Não foi possível carregar suas preferências.");
        }
      } finally {
        if (isMounted) {
          setFetching(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user?.preferences]);

  /* =========================
     Handlers
  ========================= */
  function handleToggle(e) {
    const { name, checked } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: checked
    }));

    setSuccess(false);
    setError("");
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value
    }));

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

    if (form.email_notifications !== user.email_notifications) {
      payload.email_notifications = form.email_notifications;
    }

    if (form.product_updates !== user.product_updates) {
      payload.product_updates = form.product_updates;
    }

    if (form.region_id !== user.preferences.region_id) {
      payload.region_id = form.region_id;
    }

    if (form.currency_id !== user.preferences.currency_id) {
      payload.currency_id = form.currency_id;
    }

    if (!Object.keys(payload).length) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.put("/user/preferences", payload);
      const updatedPreferences = response.data.preferences || response.data;

      const region = regions.find(r => r.id == updatedPreferences.region_id);
      const currency = currencies.find(c => c.id == updatedPreferences.currency_id);

      updateUser({
        email_notifications: updatedPreferences.email_notifications,
        product_updates: updatedPreferences.product_updates,
        region_name: region?.name,
        currency_name: currency?.name,
        preferences: {
          region_id: updatedPreferences.region_id,
          currency_id: updatedPreferences.currency_id
        }
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error("Erro ao atualizar preferências", err);
      setError("Ocorreu um erro ao salvar as suas preferências.");
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

  // Só depois de TODOS os hooks (return antecipado antes deles quebra a ordem dos hooks)
  if (!user) return null;

  return (
    <div className="w-full">
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-xl font-bold text-[#111]">{t("preferences.title", "Preferências")}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("preferences.subtitle", "Personalize notificações, região e moeda.")}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3 text-green-700 text-sm">
          <Check size={18} />
          {t("preferences.success", "Preferências atualizadas com sucesso!")}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 w-full">

        {/* Notificações */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            {t("preferences.notifications", "Notificações")}
          </h3>

          {[
            { key: "email_notifications", label: t("preferences.email_notifications", "Notificações por e-mail") },
            { key: "product_updates", label: t("preferences.product_updates", "Atualizações de Produto") }
          ].map(({ key, label }) => {
            const checked = !!form[key];

            return (
              <label
                key={key}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-colors bg-gray-50/50"
              >
                <span className="text-sm font-medium text-gray-900">
                  {label}
                </span>

                <input
                  type="checkbox"
                  name={key}
                  checked={checked}
                  onChange={handleToggle}
                  className="sr-only"
                />

                <div
                  className={`w-11 h-6 rounded-full relative transition-colors
                    ${checked ? "bg-[#7F33D9]" : "bg-gray-200"}
                  `}
                >
                  <div
                    className={`absolute top-[2px] left-[2px] h-5 w-5 bg-white rounded-full transition-transform
                      ${checked ? "translate-x-full" : ""}
                    `}
                  />
                </div>
              </label>
            );
          })}
        </div>

        <hr className="border-gray-100" />

        {/* Região e moeda */}
        <div className="space-y-5">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            {t("preferences.region_currency", "Região e moeda")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1">{t("preferences.region", "Região")}</label>
              <select
                name="region_id"
                value={form.region_id}
                onChange={handleChange}
                className="w-full border rounded-lg p-2.5"
              >
                <option value="">{t("ui.select", "Selecione")}</option>
                {regions.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("preferences.currency", "Moeda")}</label>
              <select
                name="currency_id"
                value={form.currency_id}
                onChange={handleChange}
                className="w-full border rounded-lg p-2.5"
              >
                <option value="">{t("ui.select", "Selecione")}</option>
                {currencies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-medium disabled:opacity-70"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Salvando..." : t("preferences.save", "Salvar preferências")}
          </button>
        </div>

      </form>
    </div>
  );
}
