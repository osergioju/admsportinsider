import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { 
    Search, 
    ChevronLeft, 
    ChevronRight, 
    Users, 
    Shield, 
    Calendar, 
    CreditCard, 
    Loader2,
    X,
    User
} from "lucide-react";

export default function GestaoUsuarios() {
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const navigate = useNavigate();
    
    async function loadUsers() {
        try {
            const { data } = await api.get(`/admin/users?limit=1000`);
            setAllUsers(data.users);
        } catch (err) {
            console.error("Erro ao carregar usuários:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const filteredUsers = allUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    function gotoUser (id) {
        navigate("/admin/usuarios/" + id);
    }

    const getRoleBadge = (role) => {
        switch(role) {
            case 'admin_master': 
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200"><Shield size={10} fill="currentColor"/> Master</span>;
            case 'admin': 
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200"><Shield size={10}/> Admin</span>;
            default: 
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-50 text-gray-600 border border-gray-200"><User size={10}/> Usuário</span>;
        }
    };

    const getProviderBadge = (provider) => {
        if (provider === 'google') {
            return <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">Google</span>;
        }
        return <span className="text-xs font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">E-mail</span>;
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-2 sm:p-6 animate-in fade-in duration-500">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#111] tracking-tight">Usuários</h1>
                    <p className="text-gray-500 text-sm mt-1">Gerencie os usuários cadastrados na plataforma.</p>
                </div>
                
                <div className="relative group w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#7F33D9] transition-colors">
                        <Search size={18} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Buscar por nome ou email..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <Loader2 size={32} className="animate-spin mb-2 text-[#7F33D9]" />
                        <p className="text-sm">Carregando usuários...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                            <Users size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Nenhum usuário encontrado</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {searchTerm ? `Sem resultados para "${searchTerm}"` : "A base de usuários está vazia."}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                                        <th className="px-6 py-4">Nome / Email</th>
                                        <th className="px-6 py-4">Função</th>
                                        <th className="px-6 py-4">Plano</th>
                                        <th className="px-6 py-4">Cadastro</th>
                                        <th className="px-6 py-4 text-center">Via</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {currentUsers.map(user => (
                                        <tr 
                                            key={user.id} 
                                            onClick={() => gotoUser(user.id)}
                                            className="hover:bg-purple-50/50 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs border border-gray-200">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getRoleBadge(user.role)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {user.plan_name ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                                                        <CreditCard size={10}/> {user.plan_name}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400 font-medium">Free</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Calendar size={12} className="text-gray-400"/>
                                                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                {getProviderBadge(user.provider)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#7F33D9] group-hover:translate-x-1 transition-all duration-300" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between mt-auto">
                                <span className="text-xs font-medium text-gray-500">
                                    Página <span className="text-gray-900">{currentPage}</span> de {totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <button 
                                        disabled={currentPage === 1} 
                                        onClick={() => setCurrentPage(p => p - 1)} 
                                        className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-[#7F33D9] hover:border-[#7F33D9] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button 
                                        disabled={currentPage === totalPages} 
                                        onClick={() => setCurrentPage(p => p + 1)} 
                                        className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-[#7F33D9] hover:border-[#7F33D9] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}