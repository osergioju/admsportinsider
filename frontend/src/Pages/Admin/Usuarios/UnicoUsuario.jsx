import { Link, useParams } from 'react-router-dom'
import { useState, useEffect } from "react";
import { api } from "../../../services/api";

export default function GestaoUsuarios() {
    const [user, setUser] = useState([]);
    const { id } = useParams();


    // Use effect 
    useEffect(() => {
        async function loadUser() {
          try {
            const { data } = await api.post("/admin/users/" + id);
            setUser(data.user[0]);
          } catch (err) {
            console.error("Erro ao carregar países:", err);
          }
        }
        loadUser();
    }, []);


    return (
        <div>
            { user && (
                <div>
                    <div className="pb-2 mb-2 border-b border-[#e5e7eb] flex flex-wrap justify-between items-center w-full mb-4">
                        <h1 className='font-bold text-2xl'>Usuário {user.name}</h1>
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
                            </table>
                        </div>
                    </div>
                </div>

            )}
        </div>
  )
}

