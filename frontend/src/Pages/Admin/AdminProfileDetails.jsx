import { useContext, useState } from "react";
import { AuthContext } from "../../../src/context/AuthContext";
import { 
  User, 
  ArrowUpRight, 
  Cog, 
  ShieldCheck, 
  Lock, 
  Shield 
} from "lucide-react";
import AdminPersonalData from "./Componentes/AdminPersonalData"; 

export default function AdminProfileDetails() {
  const { user } = useContext(AuthContext);
  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  
  function open(type) {
    setModalType(type);
    setOpenModal(true);
  }

  function close() {
    setModalType(null);
    setOpenModal(false);
  }
  
  
  const modalComponents = {
    personal: <AdminPersonalData onClose={close} />,
    settings: <AdminPersonalData onClose={close} />, 
  };

  const btnPurpleClass = "group flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium text-white bg-[#7F33D9] hover:bg-[#6025A8] shadow-md shadow-purple-500/20 transition-all duration-300";
  const roleLabel = user?.role === 'admin_master' ? 'Super Administrador' : 'Administrador';

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111]">Perfil Administrativo</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie suas credenciais e visualize suas permissões.</p>
      </div>

      {/* --- CARD 1: Dados do Administrador --- */}
      <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#7F33D9]/10 flex items-center justify-center">
                <User size={20} className="text-[#7F33D9]" />
            </div>
            <div>
                <h2 className="text-lg font-semibold text-[#111]">Dados de Acesso</h2>
            </div>
          </div>
          
          <button onClick={() => open("personal")} className={btnPurpleClass}>
            Editar 
            <ArrowUpRight size={16} className="text-white/70 group-hover:text-white transition-colors" />
          </button>
        </div>
        
        {/* BODY */}
        <div className="px-6 py-2">
          <div className="divide-y divide-gray-100">
            
            {/* Linha Nome */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
              <span className="text-sm text-gray-500 font-medium">Nome de exibição</span> 
              <span className="text-sm text-[#111] font-semibold sm:col-span-2">{user?.name}</span>
            </div>

            {/* Linha Email */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
              <span className="text-sm text-gray-500 font-medium">E-mail corporativo</span> 
              <div className="sm:col-span-2 flex items-center gap-2">
                  <span className="text-sm text-[#111] font-semibold">{user?.email}</span>
                  {user?.provider === 'google' && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">Google Workspace</span>
                  )}
              </div>
            </div>

            {/* Linha Senha */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
              <span className="text-sm text-gray-500 font-medium">Credenciais</span> 
              <div className="sm:col-span-2 flex items-center gap-2">
                  <Lock size={14} className="text-gray-400" />
                  <span className="text-sm text-[#111] font-bold tracking-widest text-xs mt-1 sm:mt-0">●●●●●●●●●●●●</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* --- CARD 2: Permissões e Segurança --- */}
      <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#7F33D9]/10 flex items-center justify-center">
                <ShieldCheck size={20} className="text-[#7F33D9]" />
            </div>
            <div>
                <h2 className="text-lg font-semibold text-[#111]">Nível de Acesso</h2>
            </div>
          </div>
          {/* Botão opcional ou indicativo visual */}
          <div className="hidden sm:block text-xs font-medium text-gray-400 uppercase tracking-wide">
             Ambiente Seguro
          </div>
        </div>
        
        <div className="px-6 py-2">
          <div className="divide-y divide-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 items-center">
              <span className="text-sm text-gray-500 font-medium">Função (Role)</span> 
              <div className="sm:col-span-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-purple-50 text-purple-700 border border-purple-200">
                      <Shield size={12} />
                      {roleLabel}
                  </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 items-center">
              <span className="text-sm text-gray-500 font-medium">Status da Conta</span> 
              <div className="sm:col-span-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                      Ativo
                  </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CARD 3: Configurações --- */}
      <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#7F33D9]/10 flex items-center justify-center">
                <Cog size={20} className="text-[#7F33D9]" />
            </div>
            <div>
                <h2 className="text-lg font-semibold text-[#111]">Configurações do Sistema</h2>
            </div>
          </div>
          {/* Pode abrir o mesmo modal se for editar preferências pessoais */}
          {/* <button onClick={() => open("preferences")} className={btnPurpleClass}>
            Editar 
            <ArrowUpRight size={16} className="text-white/70 group-hover:text-white transition-colors" />
          </button> */}
        </div>
        
        <div className="px-6 py-2">
          <div className="divide-y divide-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
              <span className="text-sm text-gray-500 font-medium">ID do Usuário</span> 
              <span className="text-sm text-gray-400 font-mono sm:col-span-2">{user?.id}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
              <span className="text-sm text-gray-500 font-medium">Último Login</span> 
              <span className="text-sm text-[#111] font-semibold sm:col-span-2">
                  {/* Exemplo de data, pode vir do backend */}
                  {new Date().toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/*  MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-6 relative shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={close}
              className="absolute right-5 top-5 text-gray-400 hover:text-[#111] transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-2"
            >
              ✕
            </button>
            {/* Renderiza o formulário AdminProfile dentro do modal */}
            {modalComponents[modalType]}
          </div>
        </div>
      )}
    </div>
  );
}