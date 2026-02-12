import { Outlet, useNavigate } from "react-router-dom";
import { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import brand from "../assets/svg/brand-full.svg"; 
import MenuItem from "../components/uxui/MenuItem"; 
import SubItem from "../components/uxui/SubMenu";
import SearchBar from "../components/uxui/SearchBar";
import FixedMenu from "../components/uxui/FixedMenu"; 
import LinkButton from "../components/uxui/LinkButton";
import NotificationDropdown from "../components/notifications/NotificationDropdown";
// Ícones do Usuário
import { Home, Search, Sun, Moon, Settings, Trophy, Shield, BarChart2, Heart, FileText, User, Wallet, BadgeQuestionMark, MessagesSquare, ChevronDown, LogOut, CircleX } from "lucide-react";

export default function DashboardLayout() {
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [openLigas, setOpenLigas] = useState(false);
  const [openClubes, setOpenClubes] = useState(false);
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  console.log();
  useEffect(() => {
    if (!user) { navigate("/login"); return; } 
    if (!user.preferences || !user.preferences.first_login_completed) {
        navigate("/onboarding/preferences");
    }
  }, [user, navigate]);
  
  const handleTouchStart = (e) => { setStartX(e.touches[0].clientX); };
  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    if (diff < 0) { setTranslateX(diff); } 
  };
  const handleTouchEnd = () => {
    if (Math.abs(translateX) > window.innerWidth * 0.25) { setOpenMenu(false); }
    setTranslateX(0);
  };


  const menuItemStyle = "group w-full flex items-center justify-between px-5 py-3 rounded-full transition-all duration-300 ease-out border border-transparent hover:bg-white hover:border-purple-100 hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5 active:scale-95 cursor-pointer mb-1";
  const iconStyle = "text-gray-400 transition-all duration-300 ease-out group-hover:scale-110 group-hover:!text-[#7F33D9]";
  const textStyle = "text-sm font-medium text-[#4E4E4F] group-hover:text-[#0A0A0A] transition-colors";


  // --- CONTEÚDO DO MENU ---
  const UserMenuContent = () => (
    <div className="w-full px-4 text-[#111] pb-20 lg:pb-0">
        
        {/* Cabeçalho Perfil (Estilo Card) */}
        <div className="mb-8 flex items-center gap-3 px-3 py-2 mt-4 bg-white/60 rounded-2xl border border-transparent hover:border-purple-100 hover:bg-white hover:shadow-sm transition-all duration-300 cursor-default group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-white border border-purple-200 flex items-center justify-center text-purple-600 font-bold shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                {user?.name ? user.name.charAt(0) : "C"}
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-bold text-[#0A0A0A]">
                    {user?.name ? user.name.split(" ")[0] : "Convidado"}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                    {user?.plan_name ?? "Plano Gratuito"}
                </span>
            </div>
        </div>

        <div className="space-y-6">
            
            {/* SEÇÃO: MENU */}
            <div>
                <span className="text-[11px] text-[#AFAFB2] mb-2 font-bold tracking-widest uppercase block px-4">Menu Principal</span>
                <ul className="space-y-1">
                    
                    {/* Página Inicial */}
                    <div className="group">
                        <MenuItem 
                            onClick={() => setOpenMenu(false)} 
                            to="/dashboard" 
                            className={menuItemStyle} // Aplica o estilo no container do MenuItem
                            icon={<Home strokeWidth={1.5} size={20} className={iconStyle} />} 
                            label={<span className={textStyle}>Página inicial</span>} 
                        />
                    </div>

                    {/* Dropdown Ligas */}
                    <li>
                        <button onClick={() => setOpenLigas(!openLigas)} className={menuItemStyle}>
                            <div className="flex items-center gap-3">
                                <Trophy strokeWidth={1.5} className={iconStyle} size={20} />
                                <span className={textStyle}>Ligas</span>
                            </div>
                            <ChevronDown strokeWidth={1.5} size={18} className={`text-gray-400 transition-transform duration-300 ${openLigas ? "rotate-180 text-purple-500" : ""}`} />
                        </button>
                        {openLigas && (
                            <ul className="ml-5 pl-4 border-l-2 border-purple-50 space-y-1 my-1 animate-fadeIn">
                                <SubItem onClick={() => setOpenMenu(false)}  to="/dashboard/leagues" label="Todas as ligas" />
                                <SubItem onClick={() => setOpenMenu(false)}  to="/dashboard/leagues" label="Favoritas" />
                            </ul>
                        )}
                    </li>

                    {/* Dropdown Clubes */}
                    <li>
                        <button onClick={() => setOpenClubes(!openClubes)} className={menuItemStyle}>
                            <div className="flex items-center gap-3">
                                <Shield strokeWidth={1.5} className={iconStyle} size={20} />
                                <span className={textStyle}>Clubes</span>
                            </div>
                            <ChevronDown strokeWidth={1.5} size={18} className={`text-gray-400 transition-transform duration-300 ${openClubes ? "rotate-180 text-purple-500" : ""}`} />
                        </button>
                        {openClubes && (
                            <ul className="groupml-5 pl-4 border-l-2 border-purple-50 space-y-1 my-1 animate-fadeIn">
                                <SubItem onClick={() => setOpenMenu(false)}  to="/dashboard/clubs" label="Todos os clubes" />
                                <SubItem onClick={() => setOpenMenu(false)}  to="/clubes/favoritos" label="Favoritos" />
                            </ul>
                        )}
                    </li>

                    {/* Outros itens */}
                    { user ? ( <div className="group"><MenuItem to="/dashboard/meu-dashboard" icon={<Heart strokeWidth={1} size={20} className={iconStyle} />} label={<span className={textStyle}>Meu Dashboard</span>} className={textStyle}/></div> ) : ( null ) }
                    <div className="group">
                        <MenuItem onClick={() => setOpenMenu(false)} to="/relatorios" icon={<FileText strokeWidth={1} size={20} className={iconStyle}/>} label={<span className={textStyle}>Relatórios</span>} /></div>
                </ul>
            </div>

            {/* SEÇÃO: MINHA CONTA */}
            {
                user ? (
                    <div>
                        <span className="text-[11px] text-[#AFAFB2] mb-2 font-bold tracking-widest uppercase block px-4">Minha conta</span>
                        <ul className="space-y-1">
                            <div className="group">
                                <MenuItem
                                    to="/me/profile"
                                    onClick={() => setOpenMenu(false)}
                                    className={menuItemStyle}
                                    icon={<User strokeWidth={1.5} size={20} className={iconStyle} />}
                                    label={<span className={textStyle}>Perfil</span>}
                                />
                            </div>
                            <div className="group">
                                <MenuItem
                                    to="/me/financial"
                                    onClick={() => setOpenMenu(false)}
                                    className={menuItemStyle}
                                    icon={<Wallet strokeWidth={1.5} size={20} className={iconStyle} />}
                                    label={<span className={textStyle}>Financeiro</span>}
                                />
                            </div>
                        </ul>
                    </div>
                ) : (
                    <div className="mt-4 pt-4 border-t px-4">
                        <LinkButton to="/register" text="Crie sua conta"></LinkButton>
                    </div>
                )
            }

            {/* SEÇÃO: SUPORTE */}
            { user ? (
            <div>
                <span className="text-[11px] text-[#AFAFB2] mb-2 font-bold tracking-widest uppercase block px-4">Suporte</span>
                <ul className="space-y-1">
                    <div className="group">
                        <MenuItem
                        to="/faq" 
                        onClick={() => setOpenMenu(false)}
                        className={menuItemStyle}
                        icon={<BadgeQuestionMark strokeWidth={1.5} size={20} className={iconStyle}/>} 
                        label={<span className={textStyle}>Perguntas frequentes</span>} 
                        />
                    </div>
                    <div className="group">
                        <MenuItem 
                        to="/fale-conosco" 
                        onClick={() => setOpenMenu(false)}
                        className={menuItemStyle}
                        icon={<MessagesSquare strokeWidth={1.5} size={20} className={iconStyle}/>} 
                        label={<span className={textStyle}>Fale conosco</span>} 
                        />
                    </div>
                </ul>
            </div>
            ) : null }

        </div>

        {/* Footer Sair */}
        { user ? (
        <div className="mt-8 pt-4 border-t border-gray-100">
            <button onClick={logout} className={`${menuItemStyle} hover:!bg-red-50 hover:!border-red-100 hover:!shadow-red-500/5`}>
                <div className="flex items-center gap-3">
                    <LogOut strokeWidth={1.5} size={20} className="text-gray-400 group-hover:text-red-500 transition-all duration-300 group-hover:scale-110" />
                    <span className="text-sm font-medium text-[#4E4E4F] group-hover:text-red-600 transition-colors">Sair</span>
                </div>
            </button>
        </div>
        ) : null }
    </div>
  );

  return (
    <div className="lg:flex overflow-y-scroll w-full h-screen bg-[#F6F5FA]">

        {/* --- SIDEBAR CONTAINER --- */}
        <div className="lg:border-r lg:relative top-0 lg:w-[300px] w-full pb-4 bg-[#F6F5FA] lg:bg-white">
            
            {/* Header Mobile */}
            <div className="lg:hidden flex flex-wrap items-center p-5">
                <div className="w-1/2">
                    <img src={brand} alt="Brand" className="h-10" />
                </div>
                <div className="w-1/2 flex items-center justify-end">
                    <span className="text-[#0A0A0A] font-medium text-sm"></span>
                </div>
                <div className="mt-5 w-full border-b border-[#DADADA]"></div>
            </div>

            {/* Hamburger Mobile */}
            <div className="lg:hidden flex items-center flex-wrap px-5">
                <div className="w-1/4">
                    <button className="flex items-center flex-col gap-[5px]" onClick={() => setOpenMenu(!openMenu)}>
                        <span className="bg-[#BA7FFF] h-px w-[30px] inline-block"></span>
                        <span className="bg-[#BA7FFF] h-px w-[30px] inline-block"></span>
                        <span className="bg-[#BA7FFF] h-px w-[30px] inline-block"></span>
                    </button>
                </div>
                <div className="w-3/4 flex gap-2 items-center justify-end">
                    <h1 className="font-light text-base text-[#AFAFB2]">
                        Bem-vindo,{" "}
                        <span className="text-[#0A0A0A]">
                            {user?.name ? user.name.split(" ")[0] : "Convidado"}
                        </span>
                    </h1>
                    <span className="inline-block bg-[#CCF5C9] text-xs rounded-sm px-2 py-1">{user?.plan_name ?? "Gratuito"}</span>
                </div>
            </div>

            {/* --- MENU MOBILE EXPANDIDO --- */}
            {openMenu && (
                <>
                    <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setOpenMenu(false)} />
                    <div
                        ref={menuRef}
                        className="lg:w-[300px] lg:border-r fixed top-0 left-0 z-50 bg-[#F6F5FA] lg:bg-white h-screen w-3/4 flex flex-col gap-2 items-center justify-start transition-transform duration-300 overflow-y-scroll"
                        style={{ transform: `translateX(${translateX}px)` }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="w-full flex flex-col items-start p-3">
                            <div className="hidden lg:flex w-full flex justify-between items-center mb-4">
                                <img src={brand} alt="Brand" className="w-full lg:max-w-[180px]" />
                                <CircleX className="lg:hidden cursor-pointer" onClick={() => setOpenMenu(false)} strokeWidth={1} size={24} color="#BA7FFF" />
                            </div>
                            <div className="hidden lg:block w-full border-b border-[#DADADA] mb-4"></div>
                            
                            <UserMenuContent />
                        </div>
                    </div>
                </>
            )}

            {/* --- MENU DESKTOP --- */}
            <div className="hidden lg:block h-screen overflow-y-auto pt-4 bg-white scrollbar-hide">
                 <div className="px-6 pb-4 mb-4 border-b border-gray-100">
                    <img src={brand} alt="Brand" className="h-8 w-auto object-contain" />
                 </div>
                 <UserMenuContent />
            </div>
        </div>

        {/* --- CONTEÚDO PRINCIPAL (HEADER ORIGINAL) --- */}
        <div className="lg:w-[calc(100%-300px)] bg-[#F6F5FA] pb-30 lg:pb-0 lg:h-screen lg:overflow-y-auto lg:px-10 w-full">

            <header className="hidden lg:flex items-center justify-between mb-10 sticky top-0 bg-[#F6F5FA] z-30 py-4">
                
                {/* Busca */}
                <div className="flex-1 max-w-xl">
                    <SearchBar></SearchBar>
                </div>

                <div className="flex items-center gap-6 ml-4">
                    
                    {/* Toggle Modo */}
                    <div className="flex items-center gap-3">
                        <div className="border border-gray-300 rounded-full p-1 flex items-center bg-white cursor-pointer h-9 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-7 h-7 bg-[#F3E8FF] rounded-full flex items-center justify-center text-[#7F33D9]">
                                <Sun size={16} strokeWidth={2.5} />
                            </div>
                            <div className="w-7 h-7 flex items-center justify-center text-gray-400">
                                <Moon size={16} strokeWidth={2} />
                            </div>
                        </div>
                        <span className="text-sm font-medium text-[#111]">Modo</span>
                    </div>

                    <div className="w-px h-6 bg-gray-200 mx-1"></div>

                    {/* Avatar */}
                    <div className="relative group cursor-pointer">
                        <div className="w-11 h-11 rounded-full p-0.5 border border-[#7F33D9] flex items-center justify-center shadow-sm hover:shadow-purple-500/20 transition-all">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                     <User size={20} className="text-gray-500" />
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <NotificationDropdown />

                    {/* Botão Config */}
                    <button className="w-11 h-11 bg-white border border-gray-300 rounded-full flex items-center justify-center text-[#7F33D9] hover:bg-gray-50 transition shadow-sm hover:rotate-45 active:scale-95 duration-300">
                        <Settings size={22} strokeWidth={1.5} />
                    </button>

                </div>
            </header>
 
            <Outlet />

            {/* Menu Fixo Mobile */}
            <FixedMenu mode="user" />
        </div>
    </div>
  );
}