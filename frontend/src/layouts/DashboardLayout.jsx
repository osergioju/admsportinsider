import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useTranslation } from "../context/TranslationContext";
import { useFeatureFlags } from "../context/FeatureFlagsContext";
import brand from "../assets/svg/brand-full.svg";
import MenuItem from "../components/uxui/MenuItem";
import SubItem from "../components/uxui/SubMenu";
import SearchBar from "../components/uxui/SearchBar";
import FixedMenu from "../components/uxui/FixedMenu";
import LinkButton from "../components/uxui/LinkButton";
import NotificationDropdown from "../components/notifications/NotificationDropdown";
// Ícones do Usuário
import { Home, PersonStanding, Trophy, Shield, Globe, ShieldUser, FileText, User, Wallet, BadgeQuestionMark, MessagesSquare, ChevronDown, LogOut, CircleX } from "lucide-react";

export default function DashboardLayout() {
    const [openMenu, setOpenMenu] = useState(false);
    const menuRef = useRef(null);
    const [startX, setStartX] = useState(0);
    const [translateX, setTranslateX] = useState(0);
    const [openLigas, setOpenLigas] = useState(false);
    const [openClubes, setOpenClubes] = useState(false);
    const [openFeds, setOpenFeds] = useState(false);
    const navigate = useNavigate();

    const { logout, user, loading } = useContext(AuthContext);
    const { t, publicLocale, setPublicLocale, LOCALES } = useTranslation();
    const { isEnabled } = useFeatureFlags();
    const location = useLocation();
    const isPublic =
        location.pathname === "/dashboard-public" ||
        location.pathname.startsWith("/dashboard/clubs") ||
        location.pathname.startsWith("/dashboard/leagues") ||
        location.pathname.startsWith("/dashboard/competitions/") ||
        location.pathname.startsWith("/dashboard/players") ||
        location.pathname.startsWith("/dashboard/players/") ||
        location.pathname.startsWith("/dashboard/relatorios") ||
        location.pathname.startsWith("/dashboard/relatorios/") ||
        location.pathname.startsWith("/dashboard/countries");

    useEffect(() => {
        if (loading) return;
        if (isPublic) return; // rota pública — não redireciona

        if (!user) {
            navigate("/login");
            return;
        }

        if (!user.preferences || !user.preferences.first_login_completed) {
            navigate("/onboarding/preferences");
        }

    }, [user, loading, navigate, isPublic]);

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


    const menuItemStyle = "group w-full flex items-center justify-between px-3 py-3 rounded-full transition-all duration-300 ease-out border border-transparent hover:bg-white hover:border-purple-100 hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5 active:scale-95 cursor-pointer mb-1";
    const iconStyle = "text-gray-400 transition-all duration-300 ease-out group-hover:scale-110 group-hover:!text-[#7F33D9]";
    const textStyle = "text-sm font-medium text-[#4E4E4F] group-hover:text-[#0A0A0A] transition-colors";


    // --- CONTEÚDO DO MENU ---
    const UserMenuContent = () => (
        <div className="w-full px-2 text-[#111] pb-20 lg:pb-0">

            {/* Cabeçalho Perfil (Estilo Card) */}
            <div className="mb-5 flex items-center gap-3 px-3 py-2 mt-2 bg-white/60 rounded-2xl border border-transparent hover:border-purple-100 hover:bg-white hover:shadow-sm transition-all duration-300 cursor-default group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-white border border-purple-200 flex items-center justify-center text-purple-600 font-bold shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    {user?.name ? user.name.charAt(0) : "C"}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#0A0A0A]">
                        {user?.name ? user.name.split(" ")[0] : t("ui.guest", "Convidado")}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                        {user?.plan_name ?? t("financial.free_plan", "Plano Gratuito")}
                    </span>
                </div>
            </div>

            <div className="space-y-6">

                {/* SEÇÃO: MENU */}
                <div>
                    <span className="text-[11px] text-[#AFAFB2] mb-2 font-bold tracking-widest uppercase block px-4">{t("menu.main_menu", "Menu Principal")}</span>
                    <ul className="space-y-1">

                        {/* Página Inicial */}
                        {
                            user?.role == 'admin_master' && (
                                <div className="group">
                                    <MenuItem
                                        onClick={() => setOpenMenu(false)}
                                        to={user ? "/admin" : "/admin"}
                                        className={menuItemStyle}
                                        icon={<ShieldUser strokeWidth={1.5} size={18} className={iconStyle} />}
                                        label={<span className={textStyle}>Admin</span>}
                                    />
                                </div>
                            )
                        }


                        <div className="group">
                            <MenuItem
                                onClick={() => setOpenMenu(false)}
                                to={user ? "/dashboard" : "/dashboard-public"}
                                className={menuItemStyle}
                                icon={<Home strokeWidth={1.5} size={18} className={iconStyle} />}
                                label={<span className={textStyle}>{t("menu.home", "Página inicial")}</span>}
                            />
                        </div>

                        {/* Dropdown Ligas */}
                        {isEnabled("competitions") && (
                        <li>
                            <button onClick={() => setOpenLigas(!openLigas)} className={menuItemStyle}>
                                <div className="flex items-center gap-3">
                                    <Trophy strokeWidth={1.5} className={iconStyle} size={18} />
                                    <span className={textStyle}>{t("menu.leagues", "Competições")}</span>
                                </div>
                                <ChevronDown strokeWidth={1.5} size={18} className={`text-gray-400 transition-transform duration-300 ${openLigas ? "rotate-180 text-purple-500" : ""}`} />
                            </button>
                            {openLigas && (
                                <ul className="ml-5 pl-4 border-l-2 border-purple-50 space-y-1 my-1 animate-fadeIn">
                                    <SubItem onClick={() => setOpenMenu(false)} to="/dashboard/competitions" label={t("menu.leagues_all", "Todas as competições")} />
                                    {user && isEnabled("competitions.favorites") && (
                                        <SubItem
                                            onClick={() => setOpenMenu(false)}
                                            to="/dashboard/competitions/favorites"
                                            label={t("menu.favorites", "Favoritos")}
                                        />
                                    )}
                                </ul>
                            )}
                        </li>
                        )}

                        {/* Dropdown Clubes */}
                        {isEnabled("clubs") && (
                        <li>
                            <button onClick={() => setOpenClubes(!openClubes)} className={menuItemStyle}>
                                <div className="flex items-center gap-3">
                                    <Shield strokeWidth={1.5} className={iconStyle} size={18} />
                                    <span className={textStyle}>{t("menu.clubs", "Clubes")}</span>
                                </div>
                                <ChevronDown strokeWidth={1.5} size={18} className={`text-gray-400 transition-transform duration-300 ${openClubes ? "rotate-180 text-purple-500" : ""}`} />
                            </button>
                            {openClubes && (
                                <ul className="ml-5 pl-4 border-l-2 border-purple-50 space-y-1 my-1 animate-fadeIn">
                                    <SubItem
                                        onClick={() => setOpenMenu(false)}
                                        to="/dashboard/clubs"
                                        label={t("menu.clubs_all", "Todos os clubes")}
                                    />

                                    {user && isEnabled("clubs.favorites") && (
                                        <SubItem
                                            onClick={() => setOpenMenu(false)}
                                            to="/dashboard/clubs/favorites"
                                            label={t("menu.favorites", "Favoritos")}
                                        />
                                    )}
                                </ul>
                            )}
                        </li>
                        )}

                        {/* Dropdown Federações */}
                        {isEnabled("federations") && (
                        <li>
                            <button onClick={() => setOpenFeds(!openFeds)} className={menuItemStyle}>
                                <div className="flex items-center gap-3">
                                    <ShieldUser strokeWidth={1.5} className={iconStyle} size={18} />
                                    <span className={textStyle}>{t("menu.federations", "Federações")}</span>
                                </div>
                                <ChevronDown strokeWidth={1.5} size={18} className={`text-gray-400 transition-transform duration-300 ${openFeds ? "rotate-180 text-purple-500" : ""}`} />
                            </button>
                            {openFeds && (
                                <ul className="ml-5 pl-4 border-l-2 border-purple-50 space-y-1 my-1 animate-fadeIn">
                                    <SubItem onClick={() => setOpenMenu(false)} to="/dashboard/federations" label={t("menu.federations_all", "Todas as federações")} />
                                    {user && isEnabled("federations.favorites") && (
                                        <SubItem onClick={() => setOpenMenu(false)} to="/dashboard/federations?tab=favs" label={t("menu.favorites", "Favoritas")} />
                                    )}
                                </ul>
                            )}
                        </li>
                        )}

                        {/* Países */}
                        {isEnabled("countries") && (
                        <div className="group">
                            <MenuItem onClick={() => setOpenMenu(false)} to="/dashboard/countries" icon={<Globe strokeWidth={1.5} size={18} className={iconStyle} />} label={<span className={textStyle}>{t("menu.countries", "Países")}</span>} className={menuItemStyle} />
                        </div>
                        )}

                        {/* Outros itens 
                        <div className="group">
                            <MenuItem onClick={() => setOpenMenu(false)} to="/dashboard/players" icon={<PersonStanding strokeWidth={1} size={18} className={iconStyle} />} label={<span className={textStyle}>{t("menu.players", "Jogadores")}</span>} className={menuItemStyle} />
                        </div>
                        */}
                        {isEnabled("reports") && (
                        <div className="group">
                            <MenuItem onClick={() => setOpenMenu(false)} to="/dashboard/relatorios" icon={<FileText strokeWidth={1} size={18} className={iconStyle} />} label={<span className={textStyle}>{t("menu.reports", "Relatórios")}</span>} />
                        </div>
                        )}
                    </ul>
                </div>

                {/* SEÇÃO: MINHA CONTA */}
                {
                    user ? (
                        (isEnabled("profile") || isEnabled("financial")) && (
                        <div>
                            <span className="text-[11px] text-[#AFAFB2] mb-2 font-bold tracking-widest uppercase block px-4">{t("menu.my_account", "Minha conta")}</span>
                            <ul className="space-y-1">
                                {isEnabled("profile") && (
                                <div className="group">
                                    <MenuItem
                                        to="/me/profile"
                                        onClick={() => setOpenMenu(false)}
                                        className={menuItemStyle}
                                        icon={<User strokeWidth={1.5} size={18} className={iconStyle} />}
                                        label={<span className={textStyle}>{t("menu.profile", "Perfil")}</span>}
                                    />
                                </div>
                                )}
                                {isEnabled("financial") && (
                                <div className="group">
                                    <MenuItem
                                        to="/me/financial"
                                        onClick={() => setOpenMenu(false)}
                                        className={menuItemStyle}
                                        icon={<Wallet strokeWidth={1.5} size={18} className={iconStyle} />}
                                        label={<span className={textStyle}>{t("menu.financial", "Financeiro")}</span>}
                                    />
                                </div>
                                )}
                            </ul>
                        </div>
                        )
                    ) : (
                        <div className="mt-4 pt-4 border-t px-4">
                            <LinkButton to="/register" text={t("ui.create_account", "Crie sua conta")}></LinkButton>
                        </div>
                    )
                }

                {/* SEÇÃO: SUPORTE */}
                {user && (isEnabled("faq") || isEnabled("contact")) ? (
                    <div>
                        <span className="text-[11px] text-[#AFAFB2] mb-2 font-bold tracking-widest uppercase block px-4">{t("menu.support", "Suporte")}</span>
                        <ul className="space-y-1">
                            {isEnabled("faq") && (
                            <div className="group">
                                <MenuItem
                                    to="/faq"
                                    onClick={() => setOpenMenu(false)}
                                    className={menuItemStyle}
                                    icon={<BadgeQuestionMark strokeWidth={1.5} size={18} className={iconStyle} />}
                                    label={<span className={textStyle}>{t("menu.faq", "Perguntas frequentes")}</span>}
                                />
                            </div>
                            )}
                            {isEnabled("contact") && (
                            <div className="group">
                                <MenuItem
                                    to="/fale-conosco"
                                    onClick={() => setOpenMenu(false)}
                                    className={menuItemStyle}
                                    icon={<MessagesSquare strokeWidth={1.5} size={18} className={iconStyle} />}
                                    label={<span className={textStyle}>{t("menu.contact", "Fale conosco")}</span>}
                                />
                            </div>
                            )}
                        </ul>
                    </div>
                ) : null}

            </div>

            {/* Footer Sair */}
            {user ? (
                <div className="mt-8 pt-4 border-t border-gray-100">
                    <button onClick={logout} className={`${menuItemStyle} hover:!bg-red-50 hover:!border-red-100 hover:!shadow-red-500/5`}>
                        <div className="flex items-center gap-3">
                            <LogOut strokeWidth={1.5} size={18} className="text-gray-400 group-hover:text-red-500 transition-all duration-300 group-hover:scale-110" />
                            <span className="text-sm font-medium text-[#4E4E4F] group-hover:text-red-600 transition-colors">{t("menu.logout", "Sair")}</span>
                        </div>
                    </button>
                </div>
            ) : null}
        </div>
    );

    return (
        <div className="lg:flex w-full h-screen bg-[#F6F5FA]">

            {/* --- SIDEBAR CONTAINER --- */}
            <div className="z-50 sticky top-0 lg:border-r lg:relative top-0 lg:w-[260px] w-full pb-4 bg-[#F6F5FA] lg:bg-white">

                {/* ── HEADER MOBILE ── */}
                <div className="lg:hidden z-30 bg-white border-b border-gray-100 shadow-sm pt-[env(safe-area-inset-top)]">

                    {/* Linha 1: brand + auth/avatar */}
                    <div className="flex items-center justify-between px-4 pt-3 pb-2">
                        <img src={brand} alt="Brand" className="h-6" />

                        <div className="flex items-center gap-2">
                            {user ? (
                                <div className="">
                                    <span className="hidden lg:block hidden lg:blocktext-xs font-semibold text-gray-600">
                                        {user.name?.split(" ")[0]}
                                    </span>
                                    <span className="hidden lg:inline-block bg-[#CCF5C9] text-[10px] font-bold rounded px-2 py-0.5">
                                        {user.plan_name ?? "Gratuito"}
                                    </span>
                                    <NotificationDropdown />
                                </div>
                            ) : (
                                <>
                                    {/* Seletor de idioma mobile */}
                                    <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-full px-1 py-0.5">
                                        {LOCALES.map(loc => (
                                            <button
                                                key={loc.code}
                                                onClick={() => setPublicLocale(loc.code)}
                                                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                                                    publicLocale === loc.code
                                                        ? "bg-[#7F33D9] text-white"
                                                        : "text-gray-500"
                                                }`}
                                            >
                                                {loc.label}
                                            </button>
                                        ))}
                                    </div>
                                    <Link to="/login" className="text-xs font-semibold text-[#7F33D9] border border-[#7F33D9]/30 rounded-full px-3 py-1.5 hover:bg-purple-50 transition-colors">
                                        {t("ui.login", "Entrar")}
                                    </Link>
                                    <Link to="/register" className="text-xs font-semibold text-white bg-[#7F33D9] rounded-full px-3 py-1.5 shadow-sm shadow-purple-400/30 hover:bg-[#6a28b8] transition-colors">
                                        {t("ui.create_account", "Criar conta")}
                                    </Link>
                                </>
                            )}

                            {/* Hamburger */}
                            <button
                                className="flex flex-col gap-[5px] ml-1 p-1"
                                onClick={() => setOpenMenu(!openMenu)}
                            >
                                <span className="bg-[#BA7FFF] h-px w-[22px] inline-block rounded-full"></span>
                                <span className="bg-[#BA7FFF] h-px w-[22px] inline-block rounded-full"></span>
                                <span className="bg-[#BA7FFF] h-px w-[22px] inline-block rounded-full"></span>
                            </button>
                        </div>
                    </div>

                    {/* Linha 2: SearchBar */}
                    <div className="px-4 pb-3">
                        <SearchBar />
                    </div>
                </div>

                {/* --- MENU MOBILE EXPANDIDO --- */}
                {openMenu && (
                    <>
                        <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setOpenMenu(false)} />
                        <div
                            ref={menuRef}
                            className="lg:w-[260px] lg:border-r fixed top-0 left-0 z-50 bg-[#F6F5FA] lg:bg-white h-screen w-3/4 flex flex-col gap-2 items-center justify-start transition-transform duration-300 overflow-y-scroll"
                            style={{ transform: `translateX(${translateX}px)` }}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            <div className="w-full flex flex-col items-start">
                                <div className="hidden lg:flex lg:px-6 lg:pt-4 lg:pb-0 w-full flex justify-between items-center mb-4">
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
                        <img src={brand} alt="Brand" className="h-6 w-auto object-contain" />
                    </div>
                    <UserMenuContent />
                </div>
            </div>

            {/* --- CONTEÚDO PRINCIPAL (HEADER ORIGINAL) --- */}
            <div className="overflow-y-auto lg:w-[calc(100%-260px)] bg-[#F6F5FA] pb-24 lg:pb-0 lg:h-screen lg:px-10 w-full px-4">

                <header className="hidden lg:flex items-center justify-between mb-10 sticky top-0 bg-[#F6F5FA] z-30 py-4">

                    {/* Busca */}
                    <div className="flex-1 max-w-xl">
                        <SearchBar></SearchBar>
                    </div>

                    <div className="flex items-center gap-4 ml-4">

                        {user ? (
                            <>
                                <div className="w-px h-6 bg-gray-200"></div>

                                {/* Avatar */}
                                <div
                                    onClick={() => navigate("/me/profile")}
                                    className="relative group cursor-pointer">
                                    <div className="w-11 h-11 rounded-full p-0.5 border border-[#7F33D9] flex items-center justify-center shadow-sm hover:shadow-purple-500/20 transition-all">
                                        {user?.avatar_url ? (
                                            <img src={user.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                <User size={18} className="text-gray-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <NotificationDropdown />
                            </>
                        ) : (
                            <>
                                {/* Seletor de idioma público */}
                                <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-full px-1 py-1 shadow-sm">
                                    {LOCALES.map(loc => (
                                        <button
                                            key={loc.code}
                                            onClick={() => setPublicLocale(loc.code)}
                                            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                                                publicLocale === loc.code
                                                    ? "bg-[#7F33D9] text-white shadow-sm"
                                                    : "text-gray-500 hover:text-[#7F33D9]"
                                            }`}
                                            title={loc.flag}
                                        >
                                            {loc.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="w-px h-5 bg-gray-200" />
                                <Link
                                    to="/login"
                                    className="px-5 py-2 text-sm font-semibold text-[#7F33D9] border border-[#7F33D9]/30 rounded-full hover:bg-purple-50 transition-colors"
                                >
                                    {t("ui.login", "Entrar")}
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-5 py-2 text-sm font-semibold text-white bg-[#7F33D9] rounded-full hover:bg-[#6025A8] transition-colors shadow-md shadow-purple-500/20"
                                >
                                    {t("ui.create_account_free", "Criar conta grátis")}
                                </Link>
                            </>
                        )}
                    </div>
                </header>

                {/* Banner de gatilho para convidados */}
                {isPublic && !user && (
                    <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-[#7F33D9] to-[#5A1FA8] rounded-2xl shadow-lg shadow-purple-500/20">
                        <div>
                            <p className="text-white font-bold text-sm">{t("ui.exploring_free", "Você está explorando o Sport Insider gratuitamente")}</p>
                            <p className="text-purple-200 text-xs mt-0.5">{t("ui.exploring_cta", "Crie sua conta para salvar favoritos, acessar relatórios e muito mais.")}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <Link
                                to="/login"
                                className="px-4 py-2 text-xs font-bold text-white border border-white/30 rounded-full hover:bg-white/10 transition-colors"
                            >
                                {t("ui.already_have_account", "Já tenho conta")}
                            </Link>
                            <Link
                                to="/register"
                                className="px-4 py-2 text-xs font-bold text-[#7F33D9] bg-white rounded-full hover:bg-purple-50 transition-colors shadow-sm"
                            >
                                {t("ui.create_account_free", "Criar conta grátis")} →
                            </Link>
                        </div>
                    </div>
                )}

                <Outlet />

                {/* Menu Fixo Mobile */}
                <FixedMenu />
            </div>
        </div >
    );
}