import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { api } from "../../../services/api";
import { User, ArrowUpRight, Cog, CircleDollarSign,ArrowDown,Trash } from "lucide-react";

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
      {/* Informações pessoais */}
      <div className="w-full p-4 lg:px-8 rounded-xl bg-white mb-6 lg:mb-8">
        <div className="pb-4 w-full flex items-center justify-between border-b border-[#00000033]">
          <h2 className="lg:text-xl text-[#0A0A0A] flex items-center gap-2 ">
            <User className="text-[#7F33D9]"></User>
            Informações pessoais
          </h2>
          <button className="bg-[#111111] flex items-center rounded-full text-white text-sm lg:text-lg lg:px-6 xl:px-8 px-4 py-3 gap-2 font-light hover:bg-[#F6F5FA] hover:text-[#111111] transition-all group cursor-pointer">
            Editar 
            <ArrowUpRight strokeWidth={1} size={18} className="text-white group-hover:text-[#111111]" />
          </button>
        </div>
        <div className="w-full py-4 xl:pt-6">
          <ul class="text-sm space-y-2 lg:space-y-4 max-w-[600px]">
            <li className="flex justify-between">
              <span className="font-semibold inline-block w-1/2">Nome completo:</span> 
              <span className="inline-block w-1/2">{user.name}</span>
            </li>
            <li className="flex justify-between">
              <span className="font-semibold inline-block w-1/2">E-mail:</span> 
              <span className="inline-block w-1/2">{user.email}</span>
            </li>
            <li className="flex justify-between">
              <span className="font-semibold inline-block w-1/2">Senha:</span> 
              <span className="inline-block w-1/2">&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="w-full p-4 lg:px-8 rounded-xl bg-white mb-6 lg:mb-8">
        <div className="pb-4 w-full flex items-center justify-between border-b border-[#00000033]">
          <h2 className="lg:text-xl text-[#0A0A0A] flex items-center gap-2 ">
            <Cog className="text-[#7F33D9]"></Cog>
            Configurações
          </h2>
          <button className="bg-[#111111] flex items-center rounded-full text-white text-sm lg:text-lg lg:px-6 xl:px-8 px-4 py-3 gap-2 font-light hover:bg-[#F6F5FA] hover:text-[#111111] transition-all group cursor-pointer">
            Editar 
            <ArrowUpRight strokeWidth={1} size={18} className="text-white group-hover:text-[#111111]" />
          </button>
        </div>
        <div className="w-full py-4 xl:pt-6">
          <ul class="text-sm space-y-2 lg:space-y-4 max-w-[600px]">
            <li className="flex justify-between">
              <span className="font-semibold inline-block w-1/2">Região:</span> 
              <span className="inline-block w-1/2">{user.name}</span>
            </li>
            <li className="flex justify-between">
              <span className="font-semibold inline-block w-1/2">Idioma:</span> 
              <span className="inline-block w-1/2">{user.email}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="w-full p-4 lg:px-8 rounded-xl bg-white mb-6 lg:mb-8">
        <div className="pb-4 w-full flex items-center justify-between border-b border-[#00000033]">
          <h2 className="lg:text-xl text-[#0A0A0A] flex items-center gap-2 ">
            <CircleDollarSign className="text-[#7F33D9]"></CircleDollarSign>
            Plano
          </h2>
          <button className="bg-[#111111] flex items-center rounded-full text-white text-sm lg:text-lg lg:px-6 xl:px-8 px-4 py-3 gap-2 font-light hover:bg-[#F6F5FA] hover:text-[#111111] transition-all group cursor-pointer">
            Editar 
            <ArrowUpRight strokeWidth={1} size={18} className="text-white group-hover:text-[#111111]" />
          </button>
        </div>
        <div className="w-full py-4 xl:pt-6">
          <ul class="text-sm space-y-2 lg:space-y-4 max-w-[600px]">
            <li className="flex justify-between">
              <span className="font-semibold inline-block w-1/2">Plano atual:</span> 
              <span className="inline-block w-1/2">{user.name}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex gap-4 mb-5">
        <button className="border border-[#111111] bg-[#111111] flex items-center rounded-full text-white text-sm lg:text-lg lg:px-6 xl:px-8 px-4 py-3 gap-2 font-light hover:bg-[#F6F5FA] hover:text-[#111111] transition-all group cursor-pointer">
          Sair da conta 
          <ArrowDown strokeWidth={1} size={18} className="text-white group-hover:text-[#111111]" />
        </button>
        
        <button className="border hover:border-[#ffffff] border-[#111111] flex items-center rounded-full text-[#111111] text-sm lg:text-lg lg:px-6 xl:px-8 px-4 py-3 gap-2 font-light hover:bg-[#f65555] hover:text-white transition-all group cursor-pointer">
          Apagar conta 
          <Trash strokeWidth={1} size={18} className="text-[#111111] group-hover:text-[#ffffff]" />
        </button>
      </div>

      
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
            Nome completox
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
