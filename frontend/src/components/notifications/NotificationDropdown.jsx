import { useState, useContext, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom"; // Importante!
import { api } from "../../services/api";
import { useTranslation } from "../../context/TranslationContext";
import { useNotificationPolling } from "../../hooks/useNotificationPolling";
import NotificationModal from "./NotificationModal";
import { AuthContext } from "../../context/AuthContext";
import { Bell, ChevronRight, Clock, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotificationDropdown() {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [selected, setSelected] = useState(null);
    const { user } = useContext(AuthContext);

    const dropdownRef = useRef(null);

    // Fecha ao clicar fora (Apenas Desktop)
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                if (window.innerWidth >= 1024) setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const fetchNotifications = useCallback(async () => {
        try {
            const { data } = await api.get("/user/notifications?limit=5");
            setNotifications(data.data);
        } catch (error) {
            console.error(error);
        }
    }, []);

    useEffect(() => {
        if (user) fetchNotifications();
    }, [user, fetchNotifications]);

    useNotificationPolling({
        fetchFn: fetchNotifications,
        activeInterval: 30000,
        inactiveInterval: 90000,
        enabled: !!user
    });

    const unreadCount = notifications.filter(n => !n.read_at).length;

    // --- CONTEÚDO DA LISTA (Reutilizável para Mobile e Desktop) ---
    const NotificationListContent = () => (
        <>
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/80  flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#111] text-base">{t("notifications.title", "Notificações")}</h3>
                    {unreadCount > 0 && (
                        <span className="text-[10px] font-bold text-[#7F33D9] bg-purple-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                            {unreadCount} Novas
                        </span>
                    )}
                </div>
                {/* X apenas no mobile */}
                <button onClick={() => setOpen(false)} className="lg:hidden p-2 bg-gray-100 rounded-full text-gray-500 hover:text-red-500 transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white max-h-[60vh] lg:max-h-[400px]">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center h-full">
                        <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-300">
                            <Bell size={24} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Nenhuma notificação por enquanto.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {notifications.map((n) => {
                            const isUnread = !n.read_at;
                            return (
                                <li
                                    key={n.id}
                                    onClick={() => {
                                        setSelected(n);
                                        setOpen(false);
                                    }}
                                    className={`group px-5 py-4 cursor-pointer transition-colors duration-200 flex gap-4 text-left ${isUnread ? "bg-purple-50/40 hover:bg-purple-50/60" : "bg-white hover:bg-gray-50"}`}
                                >
                                    <div className={`mt-1.5 shrink-0 w-2.5 h-2.5 rounded-full ${isUnread ? "bg-[#7F33D9] ring-4 ring-purple-50" : "bg-gray-200"}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className={`text-sm truncate pr-2 ${isUnread ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>{n.title}</p>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded"><Clock size={10} /> Agora</span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{n.message ? n.message.replace(/<[^>]*>?/gm, '') : ""}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <div className="p-4 bg-white border-t border-gray-100 mt-auto">
                <Link
                    to="/me/notifications"
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wide bg-gray-50 border border-gray-200 text-gray-600 shadow-sm transition-all duration-300 hover:border-[#7F33D9] hover:text-[#7F33D9] hover:bg-purple-50/50 hover:shadow-md"
                >
                    {t("notifications.see_all", "Ver todas")}
                    <ChevronRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
            </div>
        </>
    );

    return (
        <div className="relative" ref={dropdownRef}>

            {/* BOTÃO DO SINO */}
            <button
                onClick={() => setOpen(!open)}
                className={`
                relative z-20 w-8 h-8 lg:w-11 lg:h-11 rounded-full flex items-center justify-center shadow-sm border
                transition-all duration-300 ease-in-out hover:bg-gray-50 hover:scale-105
                ${open
                        ? "bg-[#7F33D9] border-[#7F33D9] text-white transform scale-105"
                        : "bg-white border-gray-300 text-[#7F33D9] hover:bg-gray-50 hover:border-[#7F33D9]/50"
                    }
            `}
            >
                <Bell size={18} strokeWidth={1.5} />
                {unreadCount > 0 && (
                    <span className={`
                    absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 
                    w-5 h-5 border-2 text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm pointer-events-none
                    transition-colors duration-300
                    ${open ? "bg-white text-[#7F33D9] border-[#7F33D9]" : "bg-red-500 border-white text-white"}
                `}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* --- 1. VERSÃO MOBILE (PORTAL) --- 
            Isso joga o menu para fora do header/sidebar, permitindo que ocupe a tela toda e centralize corretamente.
        */}
            {open && createPortal(
                <div className="fixed inset-0 z-[9990] lg:hidden flex items-center justify-center p-4 bg-black/60  animate-in fade-in duration-200">
                    <div
                        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                        onClick={(e) => e.stopPropagation()} // Impede fechar ao clicar dentro
                    >
                        <NotificationListContent />
                    </div>
                    {/* Clique fora para fechar */}
                    <div className="absolute inset-0 -z-10" onClick={() => setOpen(false)} />
                </div>,
                document.body
            )}

            {/* --- 2. VERSÃO DESKTOP (ABSOLUTE) --- 
            Mantém o comportamento padrão de dropdown ancorado ao botão.
        */}
            {open && (
                <div className="hidden lg:flex absolute right-0 z-50 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex-col mt-3 animate-in fade-in zoom-in-95 slide-in-from-top-2 origin-top-right">
                    <NotificationListContent />
                </div>
            )}

            {/* --- MODAL DE DETALHES --- */}
            {selected && (
                <NotificationModal
                    notification={selected}
                    onClose={() => setSelected(null)}
                    onRead={() => {
                        setNotifications((prev) => prev.map((n) => n.id === selected.id ? { ...n, read_at: new Date() } : n));
                    }}
                />
            )}
        </div>
    );
}