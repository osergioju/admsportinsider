import { useContext, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { User, ArrowUpRight, Cog, CircleDollarSign,ArrowDown,Trash } from "lucide-react";
import PersonalData from "./Components/PersonalData";
import Subscriptions from "./Components/Subscriptions";

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
    david: <Subscriptions user={user} onClose={close} />,
  };


  return (
    <div>
      {/* Informações pessoais */}
      <div className="w-full p-4 lg:px-8 rounded-xl bg-white mb-6 lg:mb-8">
        <div className="pb-4 w-full flex items-center justify-between border-b border-[#00000033]">
          <h2 className="lg:text-xl text-[#0A0A0A] flex items-center gap-2 ">
            <User className="text-[#7F33D9]"></User>
            Informações pessoais
          </h2>
          <button 
            onClick={() => open("personal")}
            className="bg-[#111111] flex items-center rounded-full text-white text-sm lg:text-lg lg:px-6 xl:px-8 px-4 py-3 gap-2 font-light hover:bg-[#F6F5FA] hover:text-[#111111] transition-all group cursor-pointer">
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


       <div className="w-full p-4 lg:px-8 rounded-xl bg-white mb-6 lg:mb-8">
        <div className="pb-4 w-full flex items-center justify-between border-b border-[#00000033]">
          <h2 className="lg:text-xl text-[#0A0A0A] flex items-center gap-2 ">
            <CircleDollarSign className="text-[#7F33D9]"></CircleDollarSign>
            DAVID
          </h2>
          <button 
          onClick={() => open("david")}
          className="bg-[#111111] flex items-center rounded-full text-white text-sm lg:text-lg lg:px-6 xl:px-8 px-4 py-3 gap-2 font-light hover:bg-[#F6F5FA] hover:text-[#111111] transition-all group cursor-pointer">
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

      {/* ===== MODAL ===== */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 relative">

            <button
              onClick={close}
              className="absolute right-4 top-4 text-gray-600"
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

