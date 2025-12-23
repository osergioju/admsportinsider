import { useState, useContext } from "react";
import { Home, Trophy, Shield, BarChart2, Heart, MessagesSquare, BadgeQuestionMark, FileText, Wallet, User, ChevronDown } from "lucide-react";
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
      
      <div className="mb-4">
        <span className="text-xs lg:text-sm text-[#AFAFB2] mb-1 font-light block">Menu</span>

        <ul>

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
                <span className="text-sm font-[400] text-[#0A0A0A]">Ligas</span>
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
                <span className="text-sm font-[400] text-[#0A0A0A]">Clubes</span>
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

      <div className="mb-4">
        <span className="text-xs lg:text-sm text-[#AFAFB2] mb-2 font-light block">
          Minha conta
        </span>

        <ul>

          {/* PERFIL */}
          <MenuItem to="/me/profile" icon={<User strokeWidth={1} size={20}/>} label="Perfil" />
          <MenuItem to="/dashboard" icon={<Wallet strokeWidth={1} size={20}/>} label="Financeiro" />

        </ul>
      </div>

      <div>
        <span className="text-xs lg:text-sm text-[#AFAFB2] mb-2 font-light block">
          Suporte
        </span>

        <ul>

          {/* PERFIL */}
          <MenuItem to="/dashboard" icon={<BadgeQuestionMark strokeWidth={1} size={20}/>} label="Perguntas frequentes" />
          <MenuItem to="/dashboard" icon={<MessagesSquare strokeWidth={1} size={20}/>} label="Fale conosco" />

        </ul>
      </div>
    </aside>
  );
}

