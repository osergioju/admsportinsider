import { useContext, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { api } from "../../../services/api";

export default function SecurityPassword() {
  const { user } = useContext(AuthContext);

  const [form, setForm] = useState({
    current_password: "",
    new_password: ""
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const isGoogleUser = user.provider === "google";

  function handleChange(e) {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value
    }));

    setError("");
    setSuccess(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (isGoogleUser) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    if (form.new_password.length < 8) {
      setError("New password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    try {
      await api.put("/user/security/password", form);
      setSuccess(true);
      setForm({
        current_password: "",
        new_password: ""
      });
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Current password is incorrect.");
      } else {
        setError("Error updating password.");
      }
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     Google user notice
  ========================= */
  if (isGoogleUser) {
    return (
      <div>
        <h1 className="text-xl font-medium mb-4">
          Alterar senha
        </h1>

        <p className="text-sm text-gray-500">
          Sua conta é gerida pelo Google. Atualizações de senhas não estão disponíveis.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-medium mb-4">
        Alterar sua senha
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-md"
      >

        <input
          type="password"
          name="current_password"
          placeholder="Senha atual"
          value={form.current_password}
          onChange={handleChange}
          className="w-full border rounded-md px-3 py-2"
          required
        />

        <input
          type="password"
          name="new_password"
          placeholder="Nova senha"
          value={form.new_password}
          onChange={handleChange}
          className="w-full border rounded-md px-3 py-2"
          required
        />

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        {success && (
          <p className="text-sm text-green-600">
            Password updated successfully.
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-black text-white rounded-md disabled:opacity-50"
        >
          {loading ? "Atualizando..." : "Alterar senha"}
        </button>

      </form>
    </div>
  );
}
