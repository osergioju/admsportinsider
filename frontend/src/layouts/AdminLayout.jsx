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
              <div className="flex flex-col gap-3">
                <div className="flex flex-col">
                  <span className="text-xl font-bold mb-1">Dashboard</span>
                  <Link to="/admin/gestao-paises" className="text-sm mb-2 font-light hover:underline hover:text-gray-300">Países</Link>
                  <Link to="/admin/gestao-ligas" className="text-sm mb-2 font-light hover:underline hover:text-gray-300">Ligas</Link>
                  <Link to="/admin/gestao-clubes" className="text-sm mb-2 font-light hover:underline hover:text-gray-300">Clubes</Link>
                </div>

                <div className="flex flex-col">
                  <span className="text-xl font-bold mb-1">Configurações</span>
                  <Link to="/admin/painel" className="text-sm mb-2 font-light hover:underline hover:text-gray-300">Gestão de usuários</Link>
                  <Link to="/admin/painel" className="text-sm mb-2 font-light hover:underline hover:text-gray-300">Financeiro</Link>
                  <Link to="/admin/painel" className="text-sm mb-2 font-light hover:underline hover:text-gray-300">Insights</Link>
                  <Link to="/admin/painel" className="text-sm mb-2 font-light hover:underline hover:text-gray-300">Central de ajuda</Link>
                </div>
              </div>
            )}
            <button className="text-sm opacity-70 text-left underline font-light" onClick={logout}>Sair</button>
        </nav>
      </aside>

      {/* Conteudo */}
      <div className="flex-1 p-10">
        <Outlet />
      </div>
    </div>
  );
}
