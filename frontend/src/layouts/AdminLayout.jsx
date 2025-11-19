import { Outlet, Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function AdminLayout() {
    // Pega as infos do user
    const { logout, user } = useContext(AuthContext);

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-5">
        <h2 className="text-xl font-bold mb-6">Admin</h2>

        <nav className="flex flex-col space-y-3">
            {(user.role === "admin_master") && (
                <Link to="/admin/painel" className="hover:text-gray-300">Painel do Admin</Link>
            )}
            <button onClick={logout}>Sair</button>
        </nav>
      </aside>

      {/* Conteudo */}
      <div className="flex-1 p-10">
        <Outlet />
      </div>
    </div>
  );
}
