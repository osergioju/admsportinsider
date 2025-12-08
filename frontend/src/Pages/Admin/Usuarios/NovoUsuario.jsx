import { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Loader, Check } from "lucide-react";

export default function NovoUsuario() {

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "user",
        plan_id: ""
    });

    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    // Buscar planos
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { data } = await api.post("/admin/create-user", form);

            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);

            // reset
            setForm({
                name: "",
                email: "",
                password: "",
                role: "user",
                plan_id: ""
            });

        } catch (err) {
            setError(err.response?.data?.message || "Erro ao criar usuário.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">

            <div className="pb-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold">Criar Novo Usuário</h1>
            </div>

            <div className="bg-white p-6 rounded-xl shadow">

                <form className="space-y-4" onSubmit={handleSubmit}>

                    {error && (
                        <div className="bg-red-100 text-red-600 p-2 rounded">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-100 text-green-700 p-2 rounded flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            Usuário criado com sucesso!
                        </div>
                    )}

                    {/* Nome */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                    </div>

                    {/* Senha */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Senha</label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                    </div>

                    {/* Função */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Função</label>
                        <select
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="user">Usuário</option>
                            <option value="admin">Admin</option>
                            <option value="admin_master">Admin Master</option>
                        </select>
                    </div>

                    {/* Plano */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Plano</label>
                        <select
                            value={form.plan_id}
                            onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="">Selecione um plano</option>
                            {plans.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Botão */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex gap-2 items-center"
                    >
                        {loading && <Loader className="animate-spin w-4 h-4" />}
                        Criar Usuário
                    </button>
                </form>
            </div>

        </div>
    );
}
