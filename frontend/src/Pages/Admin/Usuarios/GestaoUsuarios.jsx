import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from "react";
import { api } from "../../../services/api";

export default function GestaoUsuarios() {
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();

    // Use effect 
    useEffect(() => {
        async function loadUsers() {
          try {
            const { data } = await api.get("/admin/users");
            setUsers(data.users);
          } catch (err) {
            console.error("Erro ao carregar países:", err);
          }
        }
        loadUsers();
    }, []);

    function gotoUser (id) {
        // Redireciona para a página de edição do usuário
        navigate("/admin/usuarios/" + id);
    }

    return (
        <div>
            <div className="pb-2 mb-2 border-b border-[#e5e7eb] flex flex-wrap justify-between items-center w-full mb-4">
                <h1 className='font-bold text-2xl'>Usuários</h1>
            </div>
            <div className="flex flex-wrap justify-between items-center w-full mb-4">
                <div className="overflow-x-auto w-full">
                    <table className="min-w-full divide-y divide-gray-200 bg-white shadow rounded-lg">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nome
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Função
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Criado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Plano
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200">
                            {users.map(user => (
                                <tr 
                                    onClick={() => gotoUser(user.id)}
                                    className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        { user.name }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        { user.email }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {
                                            user.role === "user" ? ( <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">Usuário</span> ) : 
                                            user.role === "admin" ? ( <span className="px-2 py-1 text-xs rounded-full bg-blue-200 text-blue-700">Administrador</span> ) : 
                                            user.role === "admin_master" ? ( <span className="px-2 py-1 text-xs rounded-full bg-purple-200 text-purple-700">Administrador master</span> ) : 
                                            ( <span className="px-2 py-1 text-xs rounded-full bg-red-200 text-red-700">Desconhecido</span> )
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        { user.created_at.split("T")[0] }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        { user.plan_name }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
  )
}

