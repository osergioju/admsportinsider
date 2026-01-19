import { useContext, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { User, ArrowUpRight, Cog, CircleDollarSign, ArrowDown, Trash } from "lucide-react";
import PersonalData from "./Components/PersonalData";
import Subscriptions from "./Components/Subscriptions";
import ProfilePreferences from "./Components/ProfilePreferences";
import PrivacyDelete from "./Components/PrivacyDelete";

export default function ProfileDetails() {
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
    personal: <PersonalData user={user} onClose={close} />,
    settings: <PersonalData user={user} onClose={close} />,
    subscriptions: <Subscriptions user={user} onClose={close} />,
    preferences: <ProfilePreferences user={user} onClose={close} />,
    delete: <PrivacyDelete user={user} onClose={close} />,
  };

console.log(user);
  const btnPurpleClass = "group flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium text-white bg-[#7F33D9] hover:bg-[#6025A8] shadow-md shadow-purple-500/20 transition-all duration-300";

  return (
    <div className="max-w-4xl mx-auto">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111]">Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie suas informações pessoais e assinatura.</p>
      </div>

      {/* --- CARD 1: Informações pessoais --- */}
      <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#7F33D9]/10 flex items-center justify-center">
                <User size={20} className="text-[#7F33D9]" />
            </div>
            <div>
                <h2 className="text-lg font-semibold text-[#111]">Informações pessoais</h2>
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
            
            {/* Linha */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
              <span className="text-sm text-gray-500 font-medium">Nome completo</span> 
              <span className="text-sm text-[#111] font-semibold sm:col-span-2">{user.name}</span>
            </div>

            {/* Linha */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
              <span className="text-sm text-gray-500 font-medium">E-mail</span> 
              <span className="text-sm text-[#111] font-semibold sm:col-span-2">{user.email}</span>
            </div>

            {/* Linha */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
              <span className="text-sm text-gray-500 font-medium">Senha</span> 
              <span className="text-sm text-[#111] font-bold tracking-widest text-xs mt-1 sm:mt-0 sm:col-span-2">●●●●●●●●●●●●</span>
            </div>

          </div>
        </div>
      </div>

      {/* --- CARD 2: Configurações --- */}
      <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#7F33D9]/10 flex items-center justify-center">
                <Cog size={20} className="text-[#7F33D9]" />
            </div>
            <div>
                <h2 className="text-lg font-semibold text-[#111]">Preferências</h2>
            </div>
          </div>
          <button onClick={() => open("preferences")} className={btnPurpleClass}>
            Editar 
            <ArrowUpRight size={16} className="text-white/70 group-hover:text-white transition-colors" />
          </button>
        </div>
        
        <div className="px-6 py-2">
          <div className="divide-y divide-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
              <span className="text-sm text-gray-500 font-medium">Região padrão</span> 
              <span className="text-sm text-[#111] font-semibold sm:col-span-2">{user.currency_name || "--"}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
              <span className="text-sm text-gray-500 font-medium">Idioma</span> 
              <span className="text-sm text-[#111] font-semibold sm:col-span-2">{user.region_name || "--"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- CARD 3: Plano --- */}
      <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#7F33D9]/10 flex items-center justify-center">
                <CircleDollarSign size={20} className="text-[#7F33D9]" />
            </div>
            <div>
                <h2 className="text-lg font-semibold text-[#111]">Plano & Assinatura</h2>
            </div>
          </div>
          <button onClick={() => open("subscriptions")} className={btnPurpleClass}>
            Gerenciar 
            <ArrowUpRight size={16} className="text-white/70 group-hover:text-white transition-colors" />
          </button>
        </div>
        
        <div className="px-6 py-2">
          <div className="divide-y divide-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 items-center">
              <span className="text-sm text-gray-500 font-medium">Plano atual</span> 
              <div className="sm:col-span-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-green-50 text-green-700 border border-green-200">
                      {user.plan_name}
                  </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- AÇÕES --- */}
      <div className="flex flex-col sm:flex-row justify-end gap-4 mb-10 pt-4 border-t border-gray-200">
        <button
         onClick={() => open("delete")}
         className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-all hover:border-red-300 w-full sm:w-auto"
        >
          <Trash size={16} />
          Apagar conta 
        </button>
      </div>

      {/* ===== MODAL ===== */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 relative shadow-2xl animate-scale-in">
            <button
              onClick={close}
              className="absolute right-5 top-5 text-gray-400 hover:text-[#111] transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-1"
            >
              ✕
            </button>
            {modalComponents[modalType]}
          </div>
        </div>
      )}
    </div>
  );
}