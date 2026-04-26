import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import { Home, Shield, Trophy, PersonStanding, Globe } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";

export default function FixedMenu() {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const isActive = (path) => location.pathname.startsWith(path);

  const items = [
    {
      to: user ? "/dashboard" : "/dashboard-public",
      icon: Home,
      label: "Início",
      active: location.pathname === "/dashboard" || location.pathname === "/dashboard-public",
    },
    {
      to: "/dashboard/clubs",
      icon: Shield,
      label: "Clubes",
      active: isActive("/dashboard/clubs"),
    },
    {
      to: "/dashboard/leagues",
      icon: Trophy,
      label: "Ligas",
      active: isActive("/dashboard/leagues") || isActive("/dashboard/league/"),
    },
    {
      to: "/dashboard/players",
      icon: PersonStanding,
      label: "Jogadores",
      active: isActive("/dashboard/players") || isActive("/dashboard/players/"),
    },
    {
      to: "/dashboard/countries",
      icon: Globe,
      label: "Países",
      active: isActive("/dashboard/countries") || isActive("/dashboard/countries/"),
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {items.map(({ to, icon: Icon, label, active }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all"
          >
            <Icon
              size={22}
              strokeWidth={active ? 2.2 : 1.5}
              className={active ? "text-[#7F33D9]" : "text-gray-400"}
            />
            <span
              className={`text-[10px] font-semibold tracking-wide ${active ? "text-[#7F33D9]" : "text-gray-400"
                }`}
            >
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
