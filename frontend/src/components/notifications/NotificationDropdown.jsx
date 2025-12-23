import { useState, useContext } from "react";
import { api } from "../../services/api";
import { useNotificationPolling } from "../../hooks/useNotificationPolling"
import NotificationModal from "./NotificationModal";
import { AuthContext } from "../../context/AuthContext"
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selected, setSelected] = useState(null);
  const { user } = useContext(AuthContext);

  async function fetchNotifications() {
    try {
      const { data } = await api.get("/user/notifications?limit=3");
      setNotifications(data.data);
    } catch (error) {
      console.error(error);
    }
  }

  useNotificationPolling({
    fetchFn: fetchNotifications,
    activeInterval: 30000,
    inactiveInterval: 90000,
    enabled: !!user
  });

  const unreadCount = notifications.filter(
    (n) => !n.read_at
  ).length;

  return (
      <div className="text-right lg:relative">
        <button
            onClick={() => setOpen(!open)}
            className="relative cursor-pointer transition-all group hover:bg-[#7F33D9] hover:border-[#7F33D9] border border-[#AFAFB2] rounded-full w-[36px] h-[36px] lg:w-[36px] lg:h-[36px] flex flex-col items-center justify-center"
        >
            <Bell strokeWidth={1} className="text-[#7F33D9] group-hover:text-white transition-all w-[18px] lg:w-[18px]"></Bell>
            {unreadCount > 0 && (
            <span className="absolute -top-1 -right-0 w-4 h-4 bg-[#7F33D9] text-white text-xs rounded-full px-1">
                {unreadCount}
            </span>
            )}
        </button>

        {/* Dropdown */}
      {open && (
        <div className="
          lg:bottom-auto lg:top-full lg:mt-2 lg:w-[300px] lg:bg-white
          text-left mb-2 bottom-full absolute right-0 w-80 bg-white border rounded-lg shadow-lg z-50 w-full">


          <div className="p-3 border-b font-semibold">
            Notificações
          </div>

          {notifications.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">
              Nenhuma notificação
            </div>
          ) : (
            <ul className="max-h-80 overflow-auto">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => {
                    setSelected(n);
                    setOpen(false);
                  }}
                  className={`p-3 text-sm cursor-pointer hover:bg-gray-50 border-b
                    ${!n.read_at ? "bg-gray-100" : ""}`}
                >
                  <div className="font-medium">
                    {n.title}
                    {!n.read_at && <span> 🔴</span>}
                  </div>
                  <div className="text-gray-600 truncate">
                    {n.message}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="p-3 text-center border-t text-sm">
            <Link
              to="/me/notifications"
              className="text-blue-600 hover:underline"
            >
              Ver todas
            </Link>
          </div>
        </div>
      )}

      {/* Modal */}
      {selected && (
        <NotificationModal
          notification={selected}
          onClose={() => setSelected(null)}
          onRead={() => {
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === selected.id
                  ? { ...n, read_at: new Date() }
                  : n
              )
            );
          }}
        />
      )}
      </div>
  );
}
