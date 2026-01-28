import { useState, useContext, useRef, useEffect, useCallback } from "react";
import { api } from "../../services/api";
import { useNotificationPolling } from "../../hooks/useNotificationPolling";
import NotificationModal from "./NotificationModal";
import { AuthContext } from "../../context/AuthContext";
import { Bell, ChevronRight, Clock } from "lucide-react"; 
import { Link } from "react-router-dom";

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selected, setSelected] = useState(null);
  const { user } = useContext(AuthContext);
  
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get("/user/notifications?limit=3");
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

  return (
      <div className="relative" ref={dropdownRef}>
        
        {/* --- BOTÃO SUAVIZADO --- */}
        <button
            onClick={() => setOpen(!open)}
            className={`
                w-11 h-11 rounded-full flex items-center justify-center shadow-sm border
                transition-all duration-300 ease-in-out hover:bg-gray-50 hover:scale-105
                
                ${open 
                    ? "bg-[#7F33D9] border-[#7F33D9] text-white transform scale-105" 
                    
                    : "bg-white border-gray-300 text-[#7F33D9] hover:bg-gray-50 hover:border-[#7F33D9]/50"
                }
            `}
        >
            <Bell size={22} strokeWidth={1.5} />
            
            {/* Badge (Sem interferir na animação do botão) */}
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

        {/* --- Dropdown Container --- */}
        {open && (
            <div className={`
                absolute right-0 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden 
                /* Animação de Entrada do Menu */
                transform transition-all duration-300 ease-out origin-top-right mt-3
                animate-in fade-in zoom-in-95 slide-in-from-top-2
            `}>
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-[#111] text-sm">Notificações</h3>
                    {unreadCount > 0 && (
                        <span className="text-[10px] font-bold text-[#7F33D9] bg-purple-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                            {unreadCount} Novas
                        </span>
                    )}
                </div>

                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-300">
                                <Bell size={20} />
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
                                        className={`group px-5 py-4 cursor-pointer transition-colors duration-200 flex gap-3 text-left ${isUnread ? "bg-purple-50/30 hover:bg-purple-50/60" : "bg-white hover:bg-gray-50"}`}
                                    >
                                        <div className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${isUnread ? "bg-[#7F33D9] ring-2 ring-purple-100" : "bg-gray-200"}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className={`text-sm truncate pr-2 ${isUnread ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>{n.title}</p>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap flex items-center gap-1"><Clock size={10} /> Recente</span>
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{n.message ? n.message.replace(/<[^>]*>?/gm, '') : ""}</p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className="p-3 bg-gray-50 border-t border-gray-100">
                    <Link
                        to="/me/notifications"
                        onClick={() => setOpen(false)}
                        className="group flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide bg-white border border-gray-200 text-gray-500 shadow-sm transition-all duration-300 hover:border-[#7F33D9] hover:text-[#7F33D9] hover:bg-purple-50/50 hover:shadow-md"
                    >
                        Ver todas as notificações
                        <ChevronRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>
        )}

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