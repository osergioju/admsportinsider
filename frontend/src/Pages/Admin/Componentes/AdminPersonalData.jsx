import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../../src/context/AuthContext";
import { api } from "../../../../src/services/api";
import { 
  Loader2, 
  Check, 
  AlertCircle, 
  Camera, 
  Lock, 
  User as UserIcon, 
  Mail,
  ShieldAlert 
} from "lucide-react";

export default function AdminProfile() {
  const { user, updateUser } = useContext(AuthContext);

  
  // Check if the user is logged in via Google
  const isGoogleUser = user?.provider === "google"; 
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  const [successProfile, setSuccessProfile] = useState(false);
  const [successPass, setSuccessPass] = useState(false);

  // --- SEPARAÇÃO DOS ERROS ---
  const [errorProfile, setErrorProfile] = useState(""); 
  const [errorPass, setErrorPass] = useState("");       


  /*LÓGICA SENHA */
  const [form_pass, setFormPass] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "" 
  });

  function handleChange_pass(e) {
    const { name, value } = e.target;
    setFormPass((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errorPass) setErrorPass("");
    setSuccessPass(false);
  }

  async function handleSubmit_pass(e) {
    e.preventDefault();
    if (isGoogleUser) return;

    setLoadingPass(true);
    setErrorPass(""); 
    setSuccessPass(false);

    if (!form_pass.current_password || !form_pass.new_password) {
      setErrorPass("Por favor, preencha a senha atual e a nova senha.");
      setLoadingPass(false);
      return;
    }

    if (form_pass.new_password.length < 8) {
      setErrorPass("A nova senha deve ter pelo menos 8 caracteres.");
      setLoadingPass(false);
      return;
    }

    if (form_pass.new_password !== form_pass.confirm_password) {
        setErrorPass("A nova senha e a confirmação não coincidem.");
        setLoadingPass(false);
        return;
    }

    try {
      await api.put("/user/security/password", {
          current_password: form_pass.current_password,
          new_password: form_pass.new_password
      });
      setSuccessPass(true);
      setFormPass({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.response?.data?.error;
      
      if (err.response?.status === 401) {
        setErrorPass("A senha atual está incorreta.");
      } else if (serverMessage) {
        setErrorPass(serverMessage);
      } else {
        setErrorPass("Erro ao atualizar a senha. Tente novamente.");
      }
    } finally {
      setLoadingPass(false);
    }
  }

  /*  LÓGICA PERFIL */
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        role: user.role === 'admin_master' ? 'Super Admin' : 'Administrador', // Format role for display
      });
    }
  }, [user]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errorProfile) setErrorProfile("");
    setSuccessProfile(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoadingProfile(true);
    setSuccessProfile(false);
    setErrorProfile(""); 

    const isNameEmpty = !form.name.trim();
    const isNameShort = form.name.trim().length < 3;
    const isEmailEmpty = !isGoogleUser && !form.email.trim();

    if (isNameEmpty && isEmailEmpty) {
        setErrorProfile("Por favor, preencha o nome e o e-mail.");
        setLoadingProfile(false);
        return;
    }

    if (isNameEmpty) {
      setErrorProfile("O nome é obrigatório.");
      setLoadingProfile(false);
      return;
    }

    if (isNameShort) {
        setErrorProfile("O nome deve ter pelo menos 3 caracteres.");
        setLoadingProfile(false);
        return;
    }

    if (isEmailEmpty) {
        setErrorProfile("O e-mail é obrigatório.");
        setLoadingProfile(false);
        return;
    }

    const payload = {};
    if (form.name !== user.name) payload.name = form.name;
    if (!isGoogleUser && form.email !== user.email) payload.email = form.email;

    if (!Object.keys(payload).length) {
      setLoadingProfile(false);
      return;
    }

    try {
      await api.put("/user/profile", payload);
      updateUser(payload);
      setSuccessProfile(true);
      setTimeout(() => setSuccessProfile(false), 3000);
    } catch (err) {
      console.error("Erro ao atualizar perfil", err);
      
      if (err.response?.status === 401) {
         alert("Sua sessão expirou. Faça login novamente.");
         return;
      }
      
      const serverMessage = err.response?.data?.message || err.response?.data?.error;
      if (serverMessage) {
        setErrorProfile(serverMessage);
      } else {
        setErrorProfile("Não foi possível salvar as alterações.");
      }
    } finally {
      setLoadingProfile(false);
    }
  }

  const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all disabled:bg-gray-50 disabled:text-gray-500 pl-10";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const btnClass = "flex items-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-medium hover:bg-[#6025A8] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20";

  // Só depois de TODOS os hooks (return antecipado antes deles quebra a ordem dos hooks)
  if (!user) return null;

  return (
    <div className="w-full">
      
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111]">Perfil Administrativo</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie suas informações de acesso.</p>
      </div>

      {/*  FORMULÁRIO DE PERFIL*/}
      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className={labelClass}>Nome completo</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <UserIcon size={18} />
                        </div>
                        <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Seu nome"
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Cargo / Função</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <ShieldAlert size={18} />
                        </div>
                        <input
                        type="text"
                        name="role"
                        value={form.role}
                        disabled 
                        className={`${inputClass} font-semibold`}
                        />
                    </div>
                </div>
            </div>

            <div>
              <label className={labelClass}>E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={isGoogleUser}
                  className={inputClass}
                  placeholder="seu@email.com"
                />
              </div>
              
              {isGoogleUser && (
                <div className="mt-3 flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>Sua conta está conectada com o Google. O e-mail não pode ser alterado por aqui.</p>
                </div>
              )}
            </div>
        </div>

        {/* --- ÁREA DE FEEDBACK EXCLUSIVA DO PERFIL --- */}
        {errorProfile && (
           <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm animate-fade-in">
             <AlertCircle size={18} className="shrink-0" />
             <span>{errorProfile}</span>
           </div>
        )}

        {successProfile && (
           <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3 text-green-700 text-sm animate-fade-in">
             <Check size={18} className="shrink-0" />
             <span>Perfil atualizado com sucesso!</span>
           </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loadingProfile}
            className={btnClass}
          >
            {loadingProfile ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Salvando...
              </>
            ) : "Salvar alterações"}
          </button>
        </div>
      </form>

      {/* --- SEÇÃO DE SENHA --- */}
      <div className="mt-10 pt-8 border-t border-gray-100">
        <h2 className="text-lg font-bold text-[#111] mb-1">Segurança</h2>
        <p className="text-sm text-gray-500 mb-6">Atualize sua senha de acesso.</p>

        {isGoogleUser ? (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-gray-200 rounded-xl text-center">
             <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-3 text-gray-400 shadow-sm">
                <Lock size={20} />
             </div>
             <h3 className="text-sm font-semibold text-gray-900">Gerenciado pelo Google</h3>
             <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
               Como você fez login via Google, a alteração de senha deve ser feita diretamente na sua conta Google.
             </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit_pass} className="space-y-5">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className={labelClass}>Senha atual</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Lock size={18} />
                    </div>
                    <input
                        type="password"
                        name="current_password"
                        placeholder="••••••••"
                        value={form_pass.current_password}
                        onChange={handleChange_pass}
                        className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Nova senha</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Lock size={18} />
                    </div>
                    <input
                        type="password"
                        name="new_password"
                        placeholder="••••••••"
                        value={form_pass.new_password}
                        onChange={handleChange_pass}
                        className={inputClass}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 ml-1">Mínimo de 8 caracteres.</p>
                </div>

                <div>
                  <label className={labelClass}>Confirmar nova senha</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Lock size={18} />
                    </div>
                    <input
                        type="password"
                        name="confirm_password"
                        placeholder="••••••••"
                        value={form_pass.confirm_password}
                        onChange={handleChange_pass}
                        className={inputClass}
                    />
                  </div>
                </div>
            </div>

            {/* --- ÁREA DE FEEDBACK EXCLUSIVA DA SENHA --- */}
            {errorPass && (
                 <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm animate-fade-in">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{errorPass}</span>
                 </div>
            )}

            {successPass && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3 text-green-700 text-sm animate-fade-in">
                <Check size={18} className="shrink-0" />
                <span>Senha atualizada com sucesso!</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loadingPass}
                className={btnClass}
              >
                {loadingPass ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Atualizando...
                  </>
                ) : "Alterar senha"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}