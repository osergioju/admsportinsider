import { useState, useContext } from "react";
import {
  Home,
  Trophy,
  Shield,
  BarChart2,
  Heart,
  FileText,
  User,
  CreditCard,
  DollarSign,
  ChevronDown,
  Settings,
  Lock
} from "lucide-react";
import MenuItem from "./MenuItem";
import SubItem from "./SubMenu";
import { AuthContext } from "../../context/AuthContext"


export default function SideMenu() {
  const [openLigas, setOpenLigas] = useState(false);
  const [openClubes, setOpenClubes] = useState(false);
  const [openPerfil, setOpenPerfil] = useState(false);
  const [openSeguranca, setOpenSeguranca] = useState(false);
  const [openPlano, setOpenPlano] = useState(false);
  const [openPrivacidade, setOpenPrivacidade] = useState(false);

  const { logout, user } = useContext(AuthContext);

  return (
    <aside className="w-full h-full px-4 py-6 text-[#111]">
      
      {/* ================= MENU ================= */}
      <div className="mb-10">
        <span className="text-xs lg:text-sm text-[#AFAFB2] mb-1 font-light block">Menu</span>

        <ul className="space-y-2">

          {/* Página inicial */}
          <MenuItem to="/dashboard" icon={<Home strokeWidth={1} size={20}/>} label="Página inicial" />

          {/* Ligas */}
          <li>
            <button
              onClick={() => setOpenLigas(!openLigas)}
              className="cursor-pointer w-full flex items-center justify-between px-5 py-3 rounded-full hover:bg-white/60 transition"
            >
              <div className="flex items-center gap-3">
                <Trophy strokeWidth={1} className="text-gray-400" size={20} />
                <span className="text-sm font-[300] text-[#0A0A0A]">Ligas</span>
              </div>

              <ChevronDown
                strokeWidth={1}
                size={18}
                className={`transition-transform ${
                  openLigas ? "rotate-180" : ""
                }`}
              />
            </button>

            {openLigas && (
              <ul className="ml-12 mt-2 space-y-2">
                <SubItem label="Brasileirão" />
                <SubItem label="Premier League" />
                <SubItem label="La Liga" />
              </ul>
            )}
          </li>

          {/* Clubes */}
          <li>
            <button
              onClick={() => setOpenClubes(!openClubes)}
              className="cursor-pointer w-full flex items-center justify-between px-5 py-3 rounded-full hover:bg-white/60 transition"
            >
              <div className="flex items-center gap-3">
                <Shield strokeWidth={1} className="text-gray-400" size={20} />
                <span className="text-sm font-[300] text-[#0A0A0A]">Clubes</span>
              </div>

              <ChevronDown
                strokeWidth={1}
                size={18}
                className={`transition-transform ${
                  openClubes ? "rotate-180" : ""
                }`}
              />
            </button>

            {openClubes && (
              <ul className="ml-12 mt-2 space-y-2">
                <SubItem label="Favoritos" />
                <SubItem label="Todos os clubes" />
              </ul>
            )}
          </li>

          {/* Itens simples */}
          <MenuItem icon={<BarChart2 strokeWidth={1} size={20} />} label="Comparativo" />
          <MenuItem icon={<Heart strokeWidth={1} size={20} />} label="Meu Dashboard" />
          <MenuItem icon={<FileText strokeWidth={1} size={20} />} label="Relatórios" />
        </ul>
      </div>

      {/* ================= MEU PERFIL ================= */}
      <div>
        <span className="text-xs lg:text-sm text-[#AFAFB2] mb-2 font-light block">
          Minha conta
        </span>

        <ul className="space-y-2">

          {/* PERFIL */}
          <li>
            <button
              onClick={() => setOpenPerfil(!openPerfil)}
              className="cursor-pointer w-full flex items-center justify-between px-5 py-3 rounded-full hover:bg-white/60 transition"
            >
              <div className="flex items-center gap-3">
                <User strokeWidth={1} className="text-gray-400" size={20} />
                <span className="text-sm font-light text-[#0A0A0A]">
                  Perfil
                </span>
              </div>

              <ChevronDown
                strokeWidth={1}
                size={18}
                className={`transition-transform ${
                  openPerfil ? "rotate-180" : ""
                }`}
              />
            </button>

            {openPerfil && (
              <ul className="ml-12 mt-2 space-y-2">
                <SubItem label="Dados do perfil" to="/me/profile" />
                <SubItem label="Preferências" to="me/profile/preferences" />
              </ul>
            )}
          </li>

          {/* SEGURANÇA */}
          <li>
            <button
              onClick={() => setOpenSeguranca(!openSeguranca)}
              className="cursor-pointer w-full flex items-center justify-between px-5 py-3 rounded-full hover:bg-white/60 transition"
            >
              <div className="flex items-center gap-3">
                <Shield strokeWidth={1} className="text-gray-400" size={20} />
                <span className="text-sm font-light text-[#0A0A0A]">
                  Segurança
                </span>
              </div>

              <ChevronDown
                strokeWidth={1}
                size={18}
                className={`transition-transform ${
                  openSeguranca ? "rotate-180" : ""
                }`}
              />
            </button>

            {openSeguranca && (
              <ul className="ml-12 mt-2 space-y-2">
                <SubItem label="Alterar senha" to="me/security/password" />
                <SubItem label="Sessões ativas - Breve" />
              </ul>
            )}
          </li>

          {/* ASSINATURA */}
          <li>
            <button
              onClick={() => setOpenPlano(!openPlano)}
              className="cursor-pointer w-full flex items-center justify-between px-5 py-3 rounded-full hover:bg-white/60 transition"
            >
              <div className="flex items-center gap-3">
                <CreditCard strokeWidth={1} className="text-gray-400" size={20} />
                <span className="text-sm font-light text-[#0A0A0A]">
                  Assinatura
                </span>
              </div>

              <ChevronDown
                strokeWidth={1}
                size={18}
                className={`transition-transform ${
                  openPlano ? "rotate-180" : ""
                }`}
              />
            </button>

            {openPlano && (
              <ul className="ml-12 mt-2 space-y-2">
                <SubItem label="Meu plano" to="me/subscription" />
                <SubItem label="Faturas" to="me/subscription/invoices" />
              </ul>
            )}
          </li>

          {/* PRIVACIDADE */}
          <li>
            <button
              onClick={() => setOpenPrivacidade(!openPrivacidade)}
              className="cursor-pointer w-full flex items-center justify-between px-5 py-3 rounded-full hover:bg-white/60 transition"
            >
              <div className="flex items-center gap-3">
                <Lock strokeWidth={1} className="text-gray-400" size={20} />
                <span className="text-sm font-light text-[#0A0A0A]">
                  Privacidade
                </span>
              </div>

              <ChevronDown
                strokeWidth={1}
                size={18}
                className={`transition-transform ${
                  openPrivacidade ? "rotate-180" : ""
                }`}
              />
            </button>

            {openPrivacidade && (
              <ul className="ml-12 mt-2 space-y-2">
                <SubItem label="Meus dados" to="me/privacy/data" />
                <SubItem label="Excluir conta" to="me/privacy/delete" />
              </ul>
            )}
          </li>

        </ul>
      </div>

      <div>
        <ul className="space-y-2 mt-10">
            <button className="hover:text-gray-400 transition-all cursor-pointer text-sm font-[300] text-[#7F33D9] underline" onClick={logout}>Sair</button>
        </ul>
      </div>



    </aside>
  );
}

