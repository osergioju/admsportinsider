import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../../context/AuthContext";
import { api } from "../../../../services/api";

export default function PersonalData() {
  const { user } = useContext(AuthContext);
  const isGoogleUser = user?.provider === "google";
  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  const [successProfile, setSuccessProfile] = useState(false);
  const [successPass, setSuccessPass] = useState(false);

  const [error, setError] = useState("");
  if (!user) return null;

  /** PASS */
  const [form_pass, setFormPass] = useState({
    current_password: "",
    new_password: "",
  });

  function handleChange_pass(e) {
    const { name, value } = e.target;

    setFormPass((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccessPass(false);
  }

  async function handleSubmit_pass(e) {
    e.preventDefault();

    if (isGoogleUser) return;

    setLoadingPass(true);
    setError("");
    setSuccessPass(false);

    if (form_pass.new_password.length < 8) {
      setError("New password must be at least 8 characters.");
      setLoadingPass(false);
      return;
    }

    try {
      await api.put("/user/security/password", form_pass);
      setSuccessPass(true);
      setFormPass({
        current_password: "",
        new_password: "",
      });
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Current password is incorrect.");
      } else {
        setError("Error updating password.");
      }
    } finally {
      setLoadingPass(false);
    }
  }

  /** PERTIFL  */
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoadingProfile(true);
    setSuccessProfile(false);

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
      setLoadingProfile(false);
      return;
    }

    try {
      // 🔌 depois liga no backend
      await api.put("/user/profile", payload);

      setSuccessProfile(true);
    } catch (err) {
      console.error("Erro ao atualizar perfil", err);
    } finally {
      setLoadingProfile(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
        {/* Name */}
        <div>
          <label className="block text-sm mb-1">Nome completox</label>
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
          <label className="block text-sm mb-1">E-mail</label>

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            disabled={isGoogleUser}
            className={`w-full border rounded-md px-3 py-2 ${
              isGoogleUser ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          />

          {isGoogleUser && (
            <p className="text-xs text-gray-400 mt-1">
              Sua conta está conectada com o Google e não é possível alterar o
              e-mail.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={loadingProfile}
            className="px-5 py-2 bg-black text-white rounded-md disabled:opacity-50"
          >
            {loadingProfile ? "Salvando..." : "Salvar alterações"}
          </button>

          {successProfile && (
            <span className="text-sm text-green-600">Alterações salvas</span>
          )}
        </div>
      </form>

      {isGoogleUser ? (
        <div className="mt-8 pt-8 border-t">
          <h1 className="text-xl font-medium mb-4">Alterar senha</h1>

          <p className="text-sm text-gray-500">
            Sua conta é gerida pelo Google. Atualizações de senhas não estão
            disponíveis.
          </p>
        </div>
      ) : (
        <div className="mt-8 pt-8 border-t">
          <h1 className="text-xl font-medium mb-4">Alterar sua senha</h1>

          <form onSubmit={handleSubmit_pass} className="space-y-4 max-w-md">
            <input
              type="password"
              name="current_password"
              placeholder="Senha atual"
              value={form_pass.current_password}
              onChange={handleChange_pass}
              className="w-full border rounded-md px-3 py-2"
              required
            />

            <input
              type="password"
              name="new_password"
              placeholder="Nova senha"
              value={form_pass.new_password}
              onChange={handleChange_pass}
              className="w-full border rounded-md px-3 py-2"
              required
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            {successPass && (
              <p className="text-sm text-green-600">
                Password updated successfully.
              </p>
            )}

            <button
              type="submit"
              disabled={loadingPass}
              className="px-5 py-2 bg-black text-white rounded-md disabled:opacity-50"
            >
              {loadingPass ? "Atualizando..." : "Alterar senha"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
