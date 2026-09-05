import { Outlet, Link, useNavigate } from "react-router-dom";
import { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import brand from "../assets/svg/brand-full.svg";
import MenuItem from "../components/uxui/MenuItem";
import SubItem from "../components/uxui/SubMenu";
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
    Languages,
    MessageCircleQuestionMark,
    FileText,
    CircleDollarSign,
    ChartArea, Zap,
    Trophy,
    PlugZap,
    Building2
} from "lucide-react";

export default function AdminLayout() {
    const [openMenu, setOpenMenu] = useState(false);
    const menuRef = useRef(null);
    const [startX, setStartX] = useState(0);
    const [translateX, setTranslateX] = useState(0);

    const [openDados, setOpenDados] = useState(false); // Cadastros
    const [openInsights, setOpenInsights] = useState(false);
    const [openConfig, setOpenConfig] = useState(false);
    const [openFinanceiro, setOpenFinanceiro] = useState(false);
    const [openEsportivo, setOpenEsportivo] = useState(false);
    const [openPlanos, setOpenPlanos] = useState(false);

    const { logout, user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Retorna true se o admin tem a permissão (admin_master sempre tem)
    const canAccess = (key) => {
        if (user?.role === "admin_master") return true;
        return (user?.admin_permissions ?? []).includes(key);
    };

    // --- LÓGICA DE TOUCH (MANTIDA) ---
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
        // Lógica original de responsividade
        if (window.innerWidth > 1024) {
            // setOpenMenu(true); // Comentado pois no layout novo o desktop é fixo e não usa esse state para visibilidade
        }
    }, []);

    const handleGoPerfil = (id) => {
        navigate("/admin/profile");
    };

    // --- ESTILOS REUTILIZADOS DO USER LAYOUT ---
    const menuItemStyle = "group w-full flex items-center justify-between px-3 py-3 rounded-full transition-all duration-300 ease-out border border-transparent hover:bg-white hover:border-purple-100 hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5 active:scale-95 cursor-pointer mb-1";
    const iconStyle = "text-gray-400 transition-all duration-300 ease-out group-hover:scale-110 group-hover:!text-[#7F33D9]";
    const textStyle = "text-sm font-medium text-[#4E4E4F] group-hover:text-[#0A0A0A] transition-colors";

    // --- CONTEÚDO DO MENU ---
    const AdminMenuContent = () => (
        <div className="w-full px-4 text-[#111] pb-20 lg:pb-0">

            {/* Cabeçalho Perfil (Estilo Card igual ao User) */}
            <div className="mb-8 flex items-center gap-3 px-3 py-2 mt-4 bg-white/60 rounded-2xl border border-transparent hover:border-purple-100 hover:bg-white hover:shadow-sm transition-all duration-300 cursor-default group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-white border border-purple-200 flex items-center justify-center text-purple-600 font-bold shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    {user?.name ? user.name.charAt(0) : "A"}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#0A0A0A]">
                        {user?.name ? user.name.split(" ")[0] : "Admin"}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-purple-600 font-semibold">
                        Administrador
                    </span>
                </div>
            </div>

            {(user.role === "admin_master" || user.role === "admin") && (
                <div className="space-y-6">

                    {/* MODO MANUTENÇÃO — super destaque */}
                    <div>
                        <Link
                            to="/admin/manutencao"
                            onClick={() => setOpenMenu(false)}
                            className="text-center justify-center mx-2 flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-700 hover:to-orange-600 transition-all shadow-lg shadow-red-500/30"
                        >
                            <span className="text-sm font-bold tracking-tight">Modo Manutenção</span>
                        </Link>
                    </div>

                    {/* SEÇÃO: GERAL — sempre visível */}
                    <div>
                        <span className="text-[11px] text-[#AFAFB2] mb-2 font-bold tracking-widest uppercase block px-4">Geral</span>
                        <ul className="space-y-1">
                            <div className="group">
                                <MenuItem
                                    to="/dashboard"
                                    onClick={() => setOpenMenu(false)}
                                    className={menuItemStyle}
                                    icon={<Trophy strokeWidth={1.5} size={20} className={iconStyle} />}
                                    label={<span className={textStyle}>Dashboard público</span>}
                                />
                            </div>

                            <div className="group">
                                <MenuItem
                                    to="/admin"
                                    onClick={() => setOpenMenu(false)}
                                    className={menuItemStyle}
                                    icon={<ChartArea strokeWidth={1.5} size={20} className={iconStyle} />}
                                    label={<span className={textStyle}>Painel</span>}
                                />
                            </div>

                            <div className="group">
                                <MenuItem
                                    to="/admin/profile"
                                    onClick={() => { handleGoPerfil(user.id); setOpenMenu(false); }}
                                    className={menuItemStyle}
                                    icon={<User strokeWidth={1.5} size={20} className={iconStyle} />}
                                    label={<span className={textStyle}>Meu Perfil</span>}
                                />
                            </div>

                            <div className="group">
                                <MenuItem
                                    to="/admin/api"
                                    onClick={() => setOpenMenu(false)}
                                    className={menuItemStyle}
                                    icon={<PlugZap strokeWidth={1.5} size={20} className={iconStyle} />}
                                    label={<span className={textStyle}>API</span>}
                                />
                            </div>

                            {/* Dropdown Cadastros — só o CRUD/catálogo das entidades */}
                            {canAccess("gestao-dados") && (
                                <li>
                                    <button onClick={() => setOpenDados(!openDados)} className={menuItemStyle}>
                                        <div className="flex items-center gap-3">
                                            <LayoutDashboard strokeWidth={1.5} className={iconStyle} size={20} />
                                            <span className={textStyle}>Cadastros</span>
                                        </div>
                                        <ChevronDown strokeWidth={1.5} size={18} className={`text-gray-400 transition-transform duration-300 ${openDados ? "rotate-180 text-purple-500" : ""}`} />
                                    </button>
                                    {openDados && (
                                        <ul className="ml-5 pl-4 border-l-2 border-purple-50 space-y-1 my-1 animate-fadeIn">
                                            <SubItem onClick={() => setOpenMenu(false)} to="/admin/gestao-paises" label="Países" />
                                            <SubItem onClick={() => setOpenMenu(false)} to="/admin/gestao-continentes" label="Continentes" />
                                            <SubItem onClick={() => setOpenMenu(false)} to="/admin/gestao-federacoes" label="Federações" />
                                            <SubItem onClick={() => setOpenMenu(false)} to="/admin/gestao-ligas" label="Competições" />
                                            <SubItem onClick={() => setOpenMenu(false)} to="/admin/gestao-clubes" label="Clubes" />
                                            <SubItem onClick={() => setOpenMenu(false)} to="/admin/gestao-jogadores" label="Jogadores" />
                                        </ul>
                                    )}
                                </li>
                            )}

                            {/* Hospitalidade — fora dos cadastros centrais, é conteúdo de estádio/hotelaria */}
                            {canAccess("gestao-dados") && (
                                <div className="group">
                                    <MenuItem
                                        to="/admin/hospitalidade"
                                        onClick={() => setOpenMenu(false)}
                                        className={menuItemStyle}
                                        icon={<Building2 strokeWidth={1.5} size={20} className={iconStyle} />}
                                        label={<span className={textStyle}>Hospitalidade</span>}
                                    />
                                </div>
                            )}
                        </ul>
                    </div>

                    {/* SEÇÃO: DADOS FINANCEIROS */}
                    {canAccess("upload-financeiro") && (
                        <div>
                            <span className="text-[11px] text-[#AFAFB2] mb-2 font-bold tracking-widest uppercase block px-4">Dados financeiros</span>
                            <ul className="space-y-1">
                                <li>
                                    <button onClick={() => setOpenFinanceiro(!openFinanceiro)} className={menuItemStyle}>
                                        <div className="flex items-center gap-3">
                                            <Upload strokeWidth={1.5} className={iconStyle} size={20} />
                                            <span className={textStyle}>Importar financeiro</span>
                                        </div>
                                        <ChevronDown strokeWidth={1.5} size={18} className={`text-gray-400 transition-transform duration-300 ${openFinanceiro ? "rotate-180 text-purple-500" : ""}`} />
                                    </button>
                                    {openFinanceiro && (
                                        <ul className="ml-5 pl-4 border-l-2 border-purple-50 space-y-1 my-1 animate-fadeIn">
                                            <SubItem onClick={() => setOpenMenu(false)} to="/admin/upload/ligas" label="Clubes e Ligas" />
                                            <SubItem onClick={() => setOpenMenu(false)} to="/admin/upload/federation-financial" label="Copa do Mundo / Federações" />
                                            <SubItem onClick={() => setOpenMenu(false)} to="/admin/upload/prizes" label="Prêmios" />
                                        </ul>
                                    )}
                                </li>
                            </ul>
                        </div>
                    )}

                    {/* SEÇÃO: DADOS ESPORTIVOS — 4 formas de subir times/jogadores/partidas
                        (3 individuais + 1 combinado) mais a importação via API (FootyStats) */}
                    <div>
                        <span className="text-[11px] text-[#AFAFB2] mb-2 font-bold tracking-widest uppercase block px-4">Dados esportivos</span>
                        <ul className="space-y-1">
                            {(canAccess("upload-times") || canAccess("upload-jogadores") || canAccess("upload-partidas")) && (
                                <li>
                                    <button onClick={() => setOpenEsportivo(!openEsportivo)} className={menuItemStyle}>
                                        <div className="flex items-center gap-3">
                                            <Upload strokeWidth={1.5} className={iconStyle} size={20} />
                                            <span className={textStyle}>Importar esportivo</span>
                                        </div>
                                        <ChevronDown strokeWidth={1.5} size={18} className={`text-gray-400 transition-transform duration-300 ${openEsportivo ? "rotate-180 text-purple-500" : ""}`} />
                                    </button>
                                    {openEsportivo && (
                                        <ul className="ml-5 pl-4 border-l-2 border-purple-50 space-y-1 my-1 animate-fadeIn">
                                            {canAccess("upload-times") && <SubItem onClick={() => setOpenMenu(false)} to="/admin/upload/super" label="Completo (times + jogadores + partidas)" />}
                                            {canAccess("upload-times") && <SubItem onClick={() => setOpenMenu(false)} to="/admin/upload/teams" label="Só times" />}
                                            {canAccess("upload-jogadores") && <SubItem onClick={() => setOpenMenu(false)} to="/admin/upload/players" label="Só jogadores" />}
                                            {canAccess("upload-partidas") && <SubItem onClick={() => setOpenMenu(false)} to="/admin/upload/matches" label="Só partidas" />}
                                        </ul>
                                    )}
                                </li>
                            )}
                            <div className="group">
                                <MenuItem
                                    to="/admin/api/importar"
                                    onClick={() => setOpenMenu(false)}
                                    className={menuItemStyle}
                                    icon={<PlugZap strokeWidth={1.5} size={20} className={iconStyle} />}
                                    label={<span className={textStyle}>Importar via API (FootyStats)</span>}
                                />
                            </div>
                        </ul>
                    </div>

                    {/* SEÇÃO: CONTEÚDO DO SITE */}
                    {(canAccess("banners") || canAccess("notifications") || canAccess("regions") || canAccess("currencies") || canAccess("faq") || canAccess("legal") || canAccess("update-notes") || canAccess("charts")) && (
                        <div>
                            <span className="text-[11px] text-[#AFAFB2] mb-2 font-bold tracking-widest uppercase block px-4">Conteúdo do site</span>
                            <ul className="space-y-1">
                                {canAccess("banners") && <div className="group"><MenuItem onClick={() => setOpenMenu(false)} className={menuItemStyle} to="/admin/banners" icon={<ImageIcon strokeWidth={1.5} size={20} className={iconStyle} />} label={<span className={textStyle}>Banners</span>} /></div>}
                                {canAccess("notifications") && <div className="group"><MenuItem onClick={() => setOpenMenu(false)} className={menuItemStyle} to="/admin/notifications" icon={<Bell strokeWidth={1.5} size={20} className={iconStyle} />} label={<span className={textStyle}>Notificações</span>} /></div>}
                                {canAccess("regions") && <div className="group"><MenuItem onClick={() => setOpenMenu(false)} className={menuItemStyle} to="/admin/regions" icon={<Languages strokeWidth={1.5} size={20} className={iconStyle} />} label={<span className={textStyle}>Idioma e regiões</span>} /></div>}
                                {canAccess("currencies") && <div className="group"><MenuItem onClick={() => setOpenMenu(false)} className={menuItemStyle} to="/admin/currencies" icon={<CircleDollarSign strokeWidth={1.5} size={20} className={iconStyle} />} label={<span className={textStyle}>Moeda</span>} /></div>}
                                {canAccess("faq") && <div className="group"><MenuItem onClick={() => setOpenMenu(false)} className={menuItemStyle} to="/admin/faq" icon={<MessageCircleQuestionMark strokeWidth={1.5} size={20} className={iconStyle} />} label={<span className={textStyle}>Faqs</span>} /></div>}
                                {canAccess("legal") && <div className="group"><MenuItem onClick={() => setOpenMenu(false)} className={menuItemStyle} to="/admin/legal" icon={<FileText strokeWidth={1.5} size={20} className={iconStyle} />} label={<span className={textStyle}>Páginas Legais</span>} /></div>}
                                {canAccess("update-notes") && <div className="group"><MenuItem onClick={() => setOpenMenu(false)} className={menuItemStyle} to="/admin/update-notes" icon={<FileText strokeWidth={1.5} size={20} className={iconStyle} />} label={<span className={textStyle}>Notas de Atualização</span>} /></div>}
                                {canAccess("charts") && <div className="group"><MenuItem onClick={() => setOpenMenu(false)} className={menuItemStyle} to="/admin/charts" icon={<ChartArea strokeWidth={1.5} size={20} className={iconStyle} />} label={<span className={textStyle}>Gerador de Gráficos</span>} /></div>}
                            </ul>
                        </div>
                    )}

                    {/* SEÇÃO: ADMINISTRATIVO */}
                    {(canAccess("usuarios") || canAccess("planos") || Object.keys(
                        Object.fromEntries(
                            ["insights-usuarios", "insights-clubes", "insights-ligas", "insights-financeiro",
                                "insights-planos", "insights-importacoes", "insights-uso", "insights-performance"]
                                .filter(k => canAccess(k)).map(k => [k, true])
                        )
                    ).length > 0) && (
                            <div>
                                <span className="text-[11px] text-[#AFAFB2] mb-2 font-bold tracking-widest uppercase block px-4">Administrativo</span>
                                <ul className="space-y-1">

                                    {/* Dropdown Configurações */}
                                    {canAccess("usuarios") && (
                                        <li>
                                            <button onClick={() => setOpenConfig(!openConfig)} className={menuItemStyle}>
                                                <div className="flex items-center gap-3">
                                                    <Settings strokeWidth={1.5} className={iconStyle} size={20} />
                                                    <span className={textStyle}>Configurações</span>
                                                </div>
                                                <ChevronDown strokeWidth={1.5} size={18} className={`text-gray-400 transition-transform duration-300 ${openConfig ? "rotate-180 text-purple-500" : ""}`} />
                                            </button>
                                            {openConfig && (
                                                <ul className="ml-5 pl-4 border-l-2 border-purple-50 space-y-1 my-1 animate-fadeIn">
                                                    <SubItem onClick={() => setOpenMenu(false)} to="/admin/usuarios" label="Listar Usuários" />
                                                    <SubItem onClick={() => setOpenMenu(false)} to="/admin/new-user" label="Adicionar Usuário" />
                                                </ul>
                                            )}
                                        </li>
                                    )}

                                    {/* Dropdown Insights */}
                                    {["insights-usuarios", "insights-clubes", "insights-ligas", "insights-financeiro",
                                        "insights-planos", "insights-importacoes", "insights-uso", "insights-performance"]
                                        .some(k => canAccess(k)) && (
                                            <li>
                                                <button onClick={() => setOpenInsights(!openInsights)} className={menuItemStyle}>
                                                    <div className="flex items-center gap-3">
                                                        <BarChart strokeWidth={1.5} className={iconStyle} size={20} />
                                                        <span className={textStyle}>Insights</span>
                                                    </div>
                                                    <ChevronDown strokeWidth={1.5} size={18} className={`text-gray-400 transition-transform duration-300 ${openInsights ? "rotate-180 text-purple-500" : ""}`} />
                                                </button>
                                                {openInsights && (
                                                    <ul className="ml-5 pl-4 border-l-2 border-purple-50 space-y-1 my-1 animate-fadeIn">
                                                        {canAccess("insights-usuarios") && <SubItem onClick={() => setOpenMenu(false)} to="/admin/insights/usuarios" label="Usuários" />}
                                                        {canAccess("insights-clubes") && <SubItem onClick={() => setOpenMenu(false)} to="/admin/insights/clubes" label="Clubes" />}
                                                        {canAccess("insights-ligas") && <SubItem onClick={() => setOpenMenu(false)} to="/admin/insights/ligas" label="Ligas" />}
                                                        {canAccess("insights-financeiro") && <SubItem onClick={() => setOpenMenu(false)} to="/admin/insights/financeiro" label="Financeiro" />}
                                                        {canAccess("insights-planos") && <SubItem onClick={() => setOpenMenu(false)} to="/admin/insights/planos" label="Planos" />}
                                                        {canAccess("insights-importacoes") && <SubItem onClick={() => setOpenMenu(false)} to="/admin/insights/importacoes" label="Importações" />}
                                                        {canAccess("insights-uso") && <SubItem onClick={() => setOpenMenu(false)} to="/admin/insights/uso" label="Uso do Sistema" />}
                                                        {canAccess("insights-performance") && <SubItem onClick={() => setOpenMenu(false)} to="/admin/insights/performance" label="Performance" />}
                                                    </ul>
                                                )}
                                            </li>
                                        )}

                                    {/* Dropdown Planos */}
                                    {canAccess("planos") && (
                                        <li>
                                            <button onClick={() => setOpenPlanos(!openPlanos)} className={menuItemStyle}>
                                                <div className="flex items-center gap-3">
                                                    <Package strokeWidth={1.5} className={iconStyle} size={20} />
                                                    <span className={textStyle}>Planos</span>
                                                </div>
                                                <ChevronDown strokeWidth={1.5} size={18} className={`text-gray-400 transition-transform duration-300 ${openPlanos ? "rotate-180 text-purple-500" : ""}`} />
                                            </button>
                                            {openPlanos && (
                                                <ul className="ml-5 pl-4 border-l-2 border-purple-50 space-y-1 my-1 animate-fadeIn">
                                                    <SubItem onClick={() => setOpenMenu(false)} to="/admin/gestao-planos" label="Listar Planos" />
                                                    <SubItem onClick={() => setOpenMenu(false)} to="/admin/gestao-planos/novo" label="Criar Plano" />
                                                </ul>
                                            )}
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                </div>
            )}

            {/* Footer Sair */}
            <div className="mt-8 pt-4 border-t border-gray-100 pb-20 lg:pb-4">
                <button onClick={logout} className={`${menuItemStyle} hover:!bg-red-50 hover:!border-red-100 hover:!shadow-red-500/5`}>
                    <div className="flex items-center gap-3">
                        <LogOut strokeWidth={1.5} size={20} className="text-gray-400 group-hover:text-red-500 transition-all duration-300 group-hover:scale-110" />
                        <span className="text-sm font-medium text-[#4E4E4F] group-hover:text-red-600 transition-colors">Sair</span>
                    </div>
                </button>
            </div>
        </div>
    );

    return (
        <div className="lg:flex w-full h-screen bg-[#F6F5FA]">

            {/* --- SIDEBAR CONTAINER --- */}
            <div className="lg:border-r lg:relative top-0 lg:w-[300px] w-full pb-4 bg-[#F6F5FA] lg:bg-white">

                {/* Header Mobile */}
                <div className="lg:hidden flex flex-wrap items-center p-5">
                    <div className="w-1/2">
                        <img src={brand} alt="Brand" className="h-6" />
                    </div>
                    <div className="w-1/2 flex items-center justify-end">
                        <span className="text-[#0A0A0A] font-medium text-sm">Modo Admin</span>
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
                            Olá, <span className="text-[#0A0A0A]">{user?.name ? user.name.split(" ")[0] : "Admin"}</span>
                        </h1>
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
                                <div className="flex w-full flex justify-between items-center mb-4">
                                    <img src={brand} alt="Brand" className="w-full max-w-[120px]" />
                                    <CircleX className="lg:hidden cursor-pointer" onClick={() => setOpenMenu(false)} strokeWidth={1} size={24} color="#BA7FFF" />
                                </div>
                                <div className="block w-full border-b border-[#DADADA] mb-4"></div>

                                <AdminMenuContent />
                            </div>
                        </div>
                    </>
                )}

                {/* --- MENU DESKTOP --- */}
                <div className="hidden lg:block h-screen overflow-y-auto pt-4 bg-white scrollbar-hide">
                    <div className="px-6 pb-4 mb-4 border-b border-gray-100">
                        <img src={brand} alt="Brand" className="h-8 w-auto object-contain" />
                    </div>
                    <AdminMenuContent />
                </div>
            </div>

            {/* --- CONTEÚDO PRINCIPAL (HEADER ORIGINAL) --- */}
            <div className="lg:w-[calc(100%-300px)] bg-[#F6F5FA] pb-30 lg:pb-0 lg:h-screen lg:overflow-y-auto lg:px-10 w-full">

                {/* Header Desktop - Adaptado do User Layout */}
                <header className="hidden lg:flex items-center justify-end mb-10 sticky top-0 bg-[#F6F5FA] z-30 py-4">
                    <div className="flex items-center gap-6 ml-4">
                        <div className="w-px h-6 bg-gray-200 mx-1"></div>

                        {/* Avatar Header */}
                        <div className="relative group cursor-pointer">
                            <div className="w-11 h-11 rounded-full p-0.5 border border-[#7F33D9] flex items-center justify-center shadow-sm hover:shadow-purple-500/20 transition-all">
                                <div className="w-full h-full rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                    {user?.name ? user.name.charAt(0) : "A"}
                                </div>
                            </div>
                        </div>

                        <NotificationDropdown />

                    </div>
                </header>

                {/* Renderização das Páginas Filhas */}
                <div className="p-5 lg:p-0">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}