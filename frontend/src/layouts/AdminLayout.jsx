import { Outlet, Link } from "react-router-dom";
import { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import brand from "../assets/svg/brand-full.svg"; 
import MenuItem from "@/Components/uxui/MenuItem"; 
import SubItem from "@/Components/uxui/SubMenu";
import NotificationDropdown from "../components/notifications/NotificationDropdown"; 

import { 
  LayoutDashboard, 
  Upload, 
  Image as ImageIcon, 
  Bell, 
  Settings, 
  BarChart, 
  Package, 
  ChevronDown,
  LogOut,
  User,
  CircleX,
  Cog
} from "lucide-react";

export default function AdminLayout() {
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);

  const [openDados, setOpenDados] = useState(false);
  const [openInsights, setOpenInsights] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);
  const [openPlanos, setOpenPlanos] = useState(false);

  const { logout, user } = useContext(AuthContext);


  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    if (diff < 0) { 
      setTranslateX(diff);
    } 
  };

  const handleTouchEnd = () => {
    if (Math.abs(translateX) > window.innerWidth * 0.25) {
      setOpenMenu(false);
    }
    setTranslateX(0);
  };

  useEffect(() => {
    if (window.innerWidth > 1024) {
      setOpenMenu(true);
    }
  }, []);

  const handleGoPerfil = (id) => {
    console.log("Ir para perfil do admin", id);
  };

  const AdminMenuContent = () => (
    <div className="w-full px-4 text-[#111]">
        {/* Cabeçalho Perfil Admin */}
        <div className="mb-6 flex items-center gap-3 px-2 mt-2">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0">
                {user.name.charAt(0)}
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#0A0A0A]">Administrador</span>
                <span className="text-xs text-gray-500">{user.name.split(' ')[0]}</span>
            </div>
        </div>

        {user.role === "admin_master" && (
            <div className="space-y-6">
                
                {/* SEÇÃO: GERAL */}
                <div>
                    <span className="text-xs lg:text-sm text-[#AFAFB2] mb-2 font-light block px-2">Geral</span>
                    <ul>
                        <MenuItem to="/admin/meu-perfil" onClick={() => handleGoPerfil(user.id)} icon={<User strokeWidth={1} size={20}/>} label="Meu Perfil" />
                        
                        {/* Dropdown Gestão */}
                        <li>
                            <button onClick={() => setOpenDados(!openDados)} className="cursor-pointer w-full flex items-center justify-between px-5 py-3 rounded-full hover:bg-gray-50 transition">
                                <div className="flex items-center gap-3">
                                    <LayoutDashboard strokeWidth={1} className="text-gray-400" size={20} />
                                    <span className="text-sm font-[400] text-[#0A0A0A]">Gestão</span>
                                </div>
                                <ChevronDown strokeWidth={1} size={18} className={`transition-transform ${openDados ? "rotate-180" : ""}`} />
                            </button>
                            {openDados && (
                                <ul className="ml-12 mt-2 space-y-2">
                                    <SubItem to="/admin/gestao-paises" label="Países" />
                                    <SubItem to="/admin/gestao-ligas" label="Ligas" />
                                    <SubItem to="/admin/gestao-clubes" label="Clubes" />
                                </ul>
                            )}
                        </li>
                    </ul>
                </div>

                {/* SEÇÃO: CONTEÚDO & DADOS */}
                <div>
                    <span className="text-xs lg:text-sm text-[#AFAFB2] mb-2 font-light block px-2">Conteúdo & Dados</span>
                    <ul>
                        <MenuItem to="/admin/upload/ligas" icon={<Upload strokeWidth={1} size={20}/>} label="Upload Ligas/Clubes" />
                        <MenuItem to="/admin/banners" icon={<ImageIcon strokeWidth={1} size={20}/>} label="Banners" />
                        <MenuItem to="/admin/notifications" icon={<Bell strokeWidth={1} size={20}/>} label="Notificações" />
                    </ul>
                </div>

                {/* SEÇÃO: ADMINISTRATIVO */}
                <div>
                    <span className="text-xs lg:text-sm text-[#AFAFB2] mb-2 font-light block px-2">Administrativo</span>
                    <ul>
                        {/* Dropdown Configurações */}
                        <li>
                            <button onClick={() => setOpenConfig(!openConfig)} className="cursor-pointer w-full flex items-center justify-between px-5 py-3 rounded-full hover:bg-gray-50 transition">
                                <div className="flex items-center gap-3">
                                    <Settings strokeWidth={1} className="text-gray-400" size={20} />
                                    <span className="text-sm font-[400] text-[#0A0A0A]">Configurações</span>
                                </div>
                                <ChevronDown strokeWidth={1} size={18} className={`transition-transform ${openConfig ? "rotate-180" : ""}`} />
                            </button>
                            {openConfig && (
                                <ul className="ml-12 mt-2 space-y-2">
                                    <SubItem to="/admin/usuarios" label="Listar Usuários" />
                                    <SubItem to="/admin/new-user" label="Adicionar Usuário" />
                                    <SubItem to="/admin/painel" label="Financeiro" />
                                </ul>
                            )}
                        </li>

                        {/* Dropdown Insights */}
                        <li>
                            <button onClick={() => setOpenInsights(!openInsights)} className="cursor-pointer w-full flex items-center justify-between px-5 py-3 rounded-full hover:bg-gray-50 transition">
                                <div className="flex items-center gap-3">
                                    <BarChart strokeWidth={1} className="text-gray-400" size={20} />
                                    <span className="text-sm font-[400] text-[#0A0A0A]">Insights</span>
                                </div>
                                <ChevronDown strokeWidth={1} size={18} className={`transition-transform ${openInsights ? "rotate-180" : ""}`} />
                            </button>
                            {openInsights && (
                                <ul className="ml-12 mt-2 space-y-2">
                                    <SubItem to="/admin/insights/usuarios" label="Usuários" />
                                    <SubItem to="/admin/painel/clubes" label="Clubes" />
                                    <SubItem to="/admin/painel/ligas" label="Ligas" />
                                    <SubItem to="/admin/painel/financeiro" label="Financeiro" />
                                    <SubItem to="/admin/painel/planos" label="Planos" />
                                    <SubItem to="/admin/painel/importacoes" label="Importações" />
                                    <SubItem to="/admin/painel/uso" label="Uso do Sistema" />
                                    <SubItem to="/admin/painel/performance" label="Performance" />
                                </ul>
                            )}
                        </li>

                        {/* Dropdown Planos */}
                        <li>
                            <button onClick={() => setOpenPlanos(!openPlanos)} className="cursor-pointer w-full flex items-center justify-between px-5 py-3 rounded-full hover:bg-gray-50 transition">
                                <div className="flex items-center gap-3">
                                    <Package strokeWidth={1} className="text-gray-400" size={20} />
                                    <span className="text-sm font-[400] text-[#0A0A0A]">Planos</span>
                                </div>
                                <ChevronDown strokeWidth={1} size={18} className={`transition-transform ${openPlanos ? "rotate-180" : ""}`} />
                            </button>
                            {openPlanos && (
                                <ul className="ml-12 mt-2 space-y-2">
                                    <SubItem to="/admin/gestao-planos" label="Listar Planos" />
                                    <SubItem to="/admin/gestao-planos/novo" label="Criar Plano" />
                                </ul>
                            )}
                        </li>
                    </ul>
                </div>
            </div>
        )}

        {/* Footer Sair */}
        <div className="mt-8 pt-4 border-t border-gray-100 pb-20 lg:pb-4">
            <button onClick={logout} className="w-full flex items-center gap-3 px-5 py-3 rounded-full text-red-500 hover:bg-red-50 transition">
                <LogOut strokeWidth={1} size={20} />
                <span className="text-sm font-medium">Sair</span>
            </button>
        </div>
    </div>
  );

  return (
    <div className="lg:flex lg:overflow-y-auto w-full h-screen bg-[#F6F5FA]">

        {/* --- SIDEBAR CONTAINER --- */}
        <div className="lg:border-r lg:relative top-0 lg:w-[300px] w-full pb-4 bg-[#F6F5FA] lg:bg-white">
            
            {/* Header Mobile: Logo + Modo */}
            <div className="lg:hidden flex flex-wrap items-center p-5">
                <div className="w-1/2">
                    <img src={brand} alt="Brand" className="h-10" />
                </div>
                <div className="w-1/2 flex items-center justify-end">
                    <span className="text-[#0A0A0A] font-medium text-sm">Modo Admin</span>
                </div>
                <div className="mt-5 w-full border-b border-[#DADADA]"></div>
            </div>

            {/* Hamburger Mobile + Info */}
            <div className="lg:hidden flex items-center flex-wrap items-center px-5">
                <div className="w-1/4">
                    <button className="flex items-center flex-col gap-[5px]" onClick={() => setOpenMenu(!openMenu)}>
                        <span className="bg-[#BA7FFF] h-[1px] w-[30px] inline-block"></span>
                        <span className="bg-[#BA7FFF] h-[1px] w-[30px] inline-block"></span>
                        <span className="bg-[#BA7FFF] h-[1px] w-[30px] inline-block"></span>
                    </button>
                </div>
                <div className="w-3/4 flex gap-2 items-center justify-end">
                    <h1 className="font-light text-base text-[#AFAFB2]">Bem vindo, <span className="text-[#0A0A0A]">{user.name.split(" ")[0]}</span></h1>
                    <span className="inline-block bg-purple-100 text-purple-700 text-xs font-bold rounded-sm px-2 py-1">ADMIN</span>
                </div>
            </div>

            {/* --- MENU MOBILE EXPANDIDO (Drawer) --- */}
            {openMenu && (
                <>
                    {/* Overlay */}
                    <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setOpenMenu(false)} />

                    {/* Menu Drawer */}
                    <div
                        ref={menuRef}
                        className="lg:w-[300px] lg:border-r fixed top-0 left-0 z-50 bg-[#F6F5FA] lg:bg-white h-screen w-3/4 flex flex-col gap-2 items-center justify-start transition-transform duration-300 overflow-y-scroll"
                        style={{ transform: `translateX(${translateX}px)` }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                         <div className="w-full flex flex-col items-start p-3">
                            <div className="w-full flex justify-between items-center mb-4">
                                <img src={brand} alt="Brand" className="w-full lg:max-w-[100px] lg:max-w-[180px]" />
                                <CircleX className="lg:hidden cursor-pointer" onClick={() => setOpenMenu(false)} strokeWidth={1} size={24} color="#BA7FFF" />
                            </div>
                            <div className="w-full border-b border-[#DADADA] mb-4"></div>
                            
                            {/* Conteúdo do Menu Inserido Aqui */}
                            <AdminMenuContent />
                        </div>
                    </div>
                </>
            )}

            {/* --- MENU DESKTOP (Sidebar Fixa) --- */}
            <div className="hidden lg:block h-screen overflow-y-auto pt-4 bg-white">
                 <div className="px-6 pb-4 mb-4 border-b border-gray-100">
                    <img src={brand} alt="Brand" className="h-8 w-auto object-contain" />
                 </div>
                 {/* Conteúdo do Menu Inserido Aqui */}
                 <AdminMenuContent />
            </div>
        </div>

        {/* --- CONTEÚDO PRINCIPAL --- */}
        <div className="lg:w-[calc(100%_-_300px)] lg:h-screen lg:overflow-y-auto lg:px-10 w-full p-5">
            
            {/* Top Bar Desktop */}
            <div className="hidden lg:block py-1 mb-5">
                <div className="flex items-center flex-wrap justify-end">
                    <div className="w-1/2 flex justify-end gap-3">
                         <div className="gap-2 flex items-center justify-end flex-wrap">
                            <NotificationDropdown />
                            <div className="text-center">
                                <button className="cursor-pointer transition-all group hover:bg-[#7F33D9] hover:border-[#7F33D9] border border-[#AFAFB2] rounded-full lg:w-[36px] lg:h-[36px] w-[50px] h-[50px] flex flex-col items-center justify-center">
                                    <Cog strokeWidth={1} className="text-[#7F33D9] group-hover:text-white transition-all w-[30px] lg:w-[20px]"></Cog>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Outlet />
        </div>
    </div>
  );
}