import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { api } from "../../../services/api";

export default function ProfilePreferences() {
  const { user, setUser } = useContext(AuthContext);

  const [form, setForm] = useState({
    email_notifications: false,
    product_updates: false,
    language: "en"
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fetching, setFetching] = useState(true);

  if (!user) return null;

  /* =========================
     Hydrate / Fetch preferences
  ========================= */
  useEffect(() => {
    async function loadPreferences() {
      try {
        // 1️⃣ Se já tem no contexto, usa
        if (user.preferences) {
          setForm({
            email_notifications: !!user.preferences.email_notifications,
            product_updates: !!user.preferences.product_updates,
            language: user.preferences.language || "en"
          });
          setFetching(false);
          return;
        }

        // 2️⃣ Senão, busca no backend
        const response = await api.get("/user/preferences");

        setForm({
          email_notifications: !!response.data.email_notifications,
          product_updates: !!response.data.product_updates,
          language: response.data.language || "en"
        });

        // 🔥 sincroniza contexto
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

    setForm(prev => ({
      ...prev,
      [name]: checked
    }));
    setSuccess(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    setSuccess(false);
  }

  /* =========================
     Submit
  ========================= */
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

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

    if (!Object.keys(payload).length) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.put("/user/preferences", payload);

      setUser(prev => ({
        ...prev,
        preferences: response.data.preferences
      }));

      setSuccess(true);
    } catch (err) {
      console.error("Error updating preferences", err);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     Loading state
  ========================= */
  if (fetching) {
    return (
      <p className="text-sm text-gray-500">
        Carregando...
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-medium mb-2">
        Preferências
      </h1>

      <p className="text-sm text-gray-500 mb-6">
        Customize sua experiência em como você recebe e-mails e notificações
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-w-lg"
      >

        {/* Email notifications */}
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm">
            Notificações por e-mail
          </span>

          <input
            type="checkbox"
            name="email_notifications"
            checked={form.email_notifications}
            onChange={handleToggle}
          />
        </label>

        {/* Product updates */}
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm">
            Atualizações do Sport Insider
          </span>

          <input
            type="checkbox"
            name="product_updates"
            checked={form.product_updates}
            onChange={handleToggle}
          />
        </label>

        {/* Language */}
        <div>
          <label className="block text-sm mb-1">
            Idioma
          </label>

          <select
            name="language"
            value={form.language}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2"
          >
            <option value="en">English</option>
            <option value="es">Espanhol</option>
            <option value="pt-BR">Português (Brasil)</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-black text-white rounded-md disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar preferências"}
          </button>

          {success && (
            <span className="text-sm text-green-600">
              Preferências atualizadas
            </span>
          )}
        </div>

      </form>
    </div>
  );
}
