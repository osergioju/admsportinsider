import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { api } from "../../../services/api";

export default function ProfileDetails() {
  const { user } = useContext(AuthContext);

  const [form, setForm] = useState({
    name: "",
    email: ""
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isGoogleUser = user?.provider === "google";

  /* =========================
     Hydrate form from user
  ========================= */
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || ""
      });
    }
  }, [user]);

  if (!user) return null;

  /* =========================
     Handle input change
  ========================= */
  function handleChange(e) {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  }

  /* =========================
     Submit handler
  ========================= */
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    // monta payload só com campos alterados
    const payload = {};

    if (form.name !== user.name) {
      payload.name = form.name;
    }

    if (!isGoogleUser && form.email !== user.email) {
      payload.email = form.email;
    }

    // nada mudou
    if (!Object.keys(payload).length) {
      setLoading(false);
      return;
    }

    try {
      // 🔌 depois liga no backend
      await api.put("/user/profile", payload);

      setSuccess(true);
    } catch (err) {
      console.error("Erro ao atualizar perfil", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-medium mb-2">
        Detalhes do perfil  
      </h1>

      <p className="text-sm text-gray-500 mb-6">
        Ajuste suas informações pessoais
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 max-w-lg"
      >

        {/* Name */}
        <div>
          <label className="block text-sm mb-1">
            Nome completo
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm mb-1">
            E-mail
          </label>

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            disabled={isGoogleUser}
            className={`w-full border rounded-md px-3 py-2 ${
              isGoogleUser
                ? "bg-gray-100 cursor-not-allowed"
                : ""
            }`}
          />

          {isGoogleUser && (
            <p className="text-xs text-gray-400 mt-1">
              Sua conta está conectada com o Google e não é possível alterar o e-mail.
            </p>
          )}
        </div>

        {/* Provider */}
        <div>
          <label className="block text-sm mb-1">
            Provedor da conta
          </label>
          <input
            type="text"
            value={user.provider}
            disabled
            className="w-full border rounded-md px-3 py-2 bg-gray-100"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-black text-white rounded-md disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar alterações"}
          </button>

          {success && (
            <span className="text-sm text-green-600">
              Alterações salvas
            </span>
          )}
        </div>

      </form>
    </div>
  );
}
