import { Outlet, Link } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-5">
        <h2 className="text-xl font-bold mb-6">Sport Insider</h2>

        <nav className="flex flex-col space-y-3">
          <Link to="/dashboard" className="hover:text-gray-300">Dashboard</Link>
          <Link to="/user" className="hover:text-gray-300">Usuário</Link>
          <Link to="/user/perfil" className="hover:text-gray-300">Perfil</Link>
          <Link to="/user/configuracoes" className="hover:text-gray-300">Configurações</Link>
          <Link to="/admin" className="hover:text-gray-300">Admin</Link>
        </nav>
      </aside>

      {/* Conteudo */}
      <div className="flex-1 p-10">
        <Outlet />
      </div>
    </div>
  );
}
