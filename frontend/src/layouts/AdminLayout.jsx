import { Outlet, Link, useNavigate } from "react-router-dom";
import { useContext, useState} from "react";
import { AuthContext } from "../context/AuthContext";
import { ChevronDown, ChevronRight } from "lucide-react";
import HomeBanners from "../components/uxui/banner";

export default function AdminLayout() {
  // Pega as infos do user
  const { logout, user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleGoPerfil = (idPerfil) => {
      navigate("/admin/usuarios/" + idPerfil);
      window.location.reload();
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-5">
        <nav className="flex flex-col space-y-3">
            {(user.role === "admin_master") && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col">
                  <span className="text-xl font-bold mb-1">Admin - {user.name.split(' ')[0]}</span>
                  <button
                    onClick={()=> handleGoPerfil(user.id)}
                    className="text-sm mb-2 font-light hover:underline hover:text-gray-300 text-left"
                  >Meu Perfil</button>
                </div>

                <div className="flex flex-col">
                  <span className="text-xl font-bold mb-1">Dashboard</span>
                  <Link to="/admin/gestao-paises" className="text-sm mb-2 font-light hover:underline hover:text-gray-300">Países</Link>
                  <Link to="/admin/gestao-ligas" className="text-sm mb-2 font-light hover:underline hover:text-gray-300">Ligas</Link>
                  <Link to="/admin/gestao-clubes" className="text-sm mb-2 font-light hover:underline hover:text-gray-300">Clubes</Link>
                </div>

                <div className="flex flex-col">
                  <span className="text-xl font-bold mb-1">Dados</span>
                  <Link to="/admin/upload/ligas" className="text-sm mb-2 font-light hover:underline hover:text-gray-300">Ligas</Link>
                  <Link to="/admin/upload/ligas" className="text-sm mb-2 font-light hover:underline hover:text-gray-300">Clubes</Link>
                </div>

                <div className="flex flex-col">
                  <span className="text-xl font-bold mb-1">Conteúdo</span>
                  <Link to="/admin/banners" className="text-sm mb-2 font-light hover:underline hover:text-gray-300">Banners</Link>
                </div>

                <div className="flex flex-col">
                  <span className="text-xl font-bold mb-1">Notificações</span>
                  <Link to="/admin/new-notification" className="text-sm mb-2 font-light hover:underline hover:text-gray-300">Nova notificação</Link>
                  <Link to="/admin/notifications" className="text-sm mb-2 font-light hover:underline hover:text-gray-300">Lista de notificações</Link>
                </div>

                <div className="flex flex-col">
                  <span className="text-xl font-bold mb-1">Configurações</span>
                  <Link to="/admin/usuarios" className="text-sm mb-2 font-light hover:underline hover:text-gray-300">Usuários</Link>
                  <Link to="/admin/new-user" className="text-sm mb-2 font-light hover:underline hover:text-gray-300">Adicionar usuário</Link>
                  <Link to="/admin/painel" className="text-sm mb-2 font-light hover:underline hover:text-gray-300">Financeiro</Link>
                  
                  {/* Insights */}
                  {/* ITEM PAI */}
                  <button
                    onClick={() => setOpen(!open)}
                    className="flex items-center justify-between w-full text-sm font-light text-left hover:text-gray-300"
                  >
                    <span>Insights</span>
                    {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {/* SUBITENS */}
                  {open && (
                    <ul className="mt-2 ml-3 border-l border-gray-700 pl-3 space-y-1">
                      <li>
                        <Link to="/admin/insights/usuarios" className="text-xs hover:underline hover:text-gray-300">
                          Usuários
                        </Link>
                      </li>
                      <li>
                        <Link to="/admin/painel/clubes" className="text-xs hover:underline hover:text-gray-300">
                          Clubes
                        </Link>
                      </li>
                      <li>
                        <Link to="/admin/painel/ligas" className="text-xs hover:underline hover:text-gray-300">
                          Ligas
                        </Link>
                      </li>
                      <li>
                        <Link to="/admin/painel/financeiro" className="text-xs hover:underline hover:text-gray-300">
                          Financeiro Consolidado
                        </Link>
                      </li>
                      <li>
                        <Link to="/admin/painel/planos" className="text-xs hover:underline hover:text-gray-300">
                          Planos / Assinaturas
                        </Link>
                      </li>
                      <li>
                        <Link to="/admin/painel/importacoes" className="text-xs hover:underline hover:text-gray-300">
                          Importações
                        </Link>
                      </li>
                      <li>
                        <Link to="/admin/painel/uso" className="text-xs hover:underline hover:text-gray-300">
                          Uso do Sistema
                        </Link>
                      </li>
                      <li>
                        <Link to="/admin/painel/performance" className="text-xs hover:underline hover:text-gray-300">
                          Performance
                        </Link>
                      </li>
                    </ul>
                  )}
                  <Link to="/admin/painel" className="text-sm mt-2 mb-2 font-light hover:underline hover:text-gray-300">Central de ajuda</Link>
                </div>

                <div className="flex flex-col">
                  <span className="text-xl font-bold mb-1">Planos</span>
                  <Link to="/admin/gestao-planos" className="text-sm font-light hover:underline hover:text-gray-300">Listar planos</Link>
                  <Link to="/admin/gestao-planos/novo" className="text-sm font-light hover:underline hover:text-gray-300">Criar plano</Link>
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
