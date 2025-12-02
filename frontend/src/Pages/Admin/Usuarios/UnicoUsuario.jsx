import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { api } from "../../../services/api";

export default function GestaoUsuarios() {
    const [user, setUser] = useState(null);
    const [plans, setPlans] = useState([]);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const { id } = useParams();
    
    const [form, setForm] = useState({
        name: "",
        email: "",
        role: "",
        plan_id: ""
    });

    // Cata os planos 
    useEffect(() => {
        async function loadPlans() {
            try {
                const { data } = await api.get("/admin/plans");
                setPlans(data.plans);
            } catch (err) {
                console.error("Erro ao carregar planos:", err);
            }
        }

        loadPlans();
    }, []);



    // Carrega o usuário
    useEffect(() => {
        async function loadUser() {
            try {
                const { data } = await api.post("/admin/users/" + id);
                const u = data.user[0];

                setUser(u);

                setForm({
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    plan_id: u.plan_id,
                    active : u.active,
                    plan_name: u.plan_name
                });
            } catch (err) {
                console.error("Erro ao carregar usuário:", err);
            }
        }
        loadUser();
    }, []);

    // Atualiza usuário
    async function handleUpdateUser(e) {
        e.preventDefault();

        try {
            await api.put("/admin/users/" + id + "/update", form);
            alert("Usuário atualizado com sucesso!");
        } catch (error) {
            console.error("Erro ao atualizar usuário:", error);
            alert("Erro ao atualizar usuário");
        }
    }

    // Ações administrativas
    async function resendConfirmation() {
        if (!window.confirm("Deseja reenviar o e-mail de confirmação?")) {
            return;
        }

        try {
            await api.post(`/admin/users/${id}/resend-confirmation`);
            alert("E-mail reenviado com sucesso!");
        } catch (error) {
            console.error("Erro ao reenviar:", error);
            alert("Erro ao reenviar e-mail");
        }
    }

    async function disableUser() {
        if (!window.confirm("Tem certeza que deseja inativar este usuário?")) {
            return; // cancelou, não faz nada
        }

        try {
            await api.post(`/admin/users/${id}/disable`);
            alert("Usuário inativado com sucesso!");
            window.location.reload(); // recarrega a página
        } catch (error) {
            console.error("Erro ao inativar usuário:", error);
            alert("Erro ao inativar usuário. Verifique o console.");
        }
    }

    async function enableUser() {
         if (!window.confirm("Tem certeza que deseja reativar este usuário?")) {
            return; // cancelou, não faz nada
        }

        try {
            await api.post(`/admin/users/${id}/enable`);
            alert("Usuário reativado com sucesso!");
            window.location.reload(); // recarrega a página
        } catch (error) {
            console.error("Erro ao inativar usuário:", error);
            alert("Erro ao reativar o usuário.");
        }
    }

    async function changePlan() {
          if (!window.confirm("Tem certeza que deseja alterar o plano deste usuário?")) {
            return;
        }

        try {
            await api.post(`/admin/users/${id}/change-plan`, {
                plan_id: form.plan_id
            });

            alert("Plano alterado com sucesso!");

            setShowPlanModal(false);
            window.location.reload();

        } catch (error) {
            console.error("Erro ao alterar plano:", error);
            alert("Erro ao alterar plano");
        }
    }

    if (!user) {
        return (
            <div className="p-10 text-center text-gray-500">
                Carregando usuário...
            </div>
        );
    }

    return (
        <div className="space-y-8">

            {/* HEADER */}
            <div className="pb-4 mb-4 border-b border-gray-200">
                <h1 className="font-bold text-2xl">Usuário: {user.name} - { user.active ? "Ativo" : "Inativo"}</h1>
                <p className="text-gray-600">ID: {user.id}</p>
            </div>

            {/* PAINEL DE INFORMAÇÕES */}
            <div className="bg-white shadow p-6 rounded-lg mb-8">
                <h2 className="text-lg font-semibold mb-4">Informações atuais</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p><strong>Nome:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Função:</strong> {user.role}</p>
                    <p><strong>Plano:</strong> {user.plan_name}</p>
                    <p><strong>Criado em:</strong> {user.created_at}</p>
                    <p><strong>Email verificado:</strong> {user.email_verified ? "Sim" : "Não"}</p>
                </div>
            </div>

            {/* FORMULÁRIO DE EDIÇÃO */}
            <div className="bg-white shadow p-6 rounded-lg mb-8">
                <h2 className="text-lg font-semibold mb-4">Editar usuário</h2>

                <form className="space-y-4" onSubmit={handleUpdateUser}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Função</label>
                        <select
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="admin_master">Admin Master</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Salvar alterações
                    </button>
                </form>
            </div>

            {/* AÇÕES ADMIN MASTER */}
            <div className="bg-white shadow p-6 rounded-lg">
                <h2 className="text-lg font-semibold mb-4">Ações administrativas</h2>

                <div className="flex gap-4 flex-wrap">

                    {
                        user.active ? (
                             <div className="flex gap-3">
                                <button
                                    onClick={resendConfirmation}
                                    className="cursor-pointer bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                                >
                                    Reenviar confirmação de email
                                </button>

                                <button
                                    onClick={() => setShowPlanModal(true)}
                                    className="cursor-pointer bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                                >
                                    Trocar plano
                                </button>
                                
                                <button
                                    onClick={disableUser}
                                    className="cursor-pointer bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                                >
                                    Inativar usuário
                                </button>
                             </div>
                        ) : (
                            <button
                                onClick={enableUser}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                            >
                                Reativar usuário
                            </button>
                        )
                    }
                    

                    

                   

                </div>
            </div>

            {showPlanModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
                    <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-xl">
                        <h2 className="text-xl font-semibold mb-4">Trocar Plano</h2>

                        <select
                            value={form.plan_id}
                            onChange={(e) =>
                                setForm({ ...form, plan_id: e.target.value })
                            }
                            className="w-full border px-3 py-2 rounded mb-4"
                        >
                            {plans.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>

                        <div className="flex justify-end gap-4">
                            <button
                                className="px-4 py-2 bg-gray-300 rounded"
                                onClick={() => setShowPlanModal(false)}
                            >
                                Cancelar
                            </button>

                            <button
                                className="px-4 py-2 bg-purple-600 text-white rounded"
                                onClick={changePlan}
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        
    );
}