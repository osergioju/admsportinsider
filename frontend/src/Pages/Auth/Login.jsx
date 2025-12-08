import { useState } from "react";
import Input from "../../components/uxui/Input";
import Submit from "../../components/uxui/Submit";
import useTitle from '../../hooks/useTitle'
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import LoadingSkeleton from "../../components/uxui/LoadingSkeleton";
import { api } from "../../services/api"; 

// iconezuxo 
import { Panda } from "lucide-react";

export default function Login() {
    useTitle("Entre na sua conta");
    
    // Consts do ambiente
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [error, setError] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Enviar o formulário para a API do logim
    const handleSubmit = async (event) => {
        event.preventDefault();

        // Remove o erro 
        setError("");

        try {
            const { data } = await api.post("/auth/login", { email, senha });

            // Se chegou aqui, login deu certo
            login(data.token, data.user);
            setIsLoggingIn(false);

            // Redireciona
            if (data.user.role === "user") navigate("/dashboard");
            if (data.user.role === "admin") navigate("/admin");
            if (data.user.role === "admin_master") navigate("/admin");

        } catch (error) {
            setIsLoggingIn(false);

            // erro retornado pelo backend
            const msg = error.response?.data?.error || "Erro ao fazer login.";
            setError(msg);
        }
    };

    if (isLoggingIn) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="mx-2">
            <Panda className="w-10 h-10 text-white"></Panda>
            <h1 className="font-bold mb-6 text-white font-light text-5xl">Entrar</h1>

            <form onSubmit={handleSubmit}>
                <Input
                    label="E-mail"
                    labelColor="text-white"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    variant="dark"
                    onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                    label="Senha"
                    labelColor="text-white"
                    type="password"
                    placeholder="********"
                    value={senha}
                    variant="dark"
                    onChange={(e) => setSenha(e.target.value)}
                />

                <Submit value="Entrar" />
                <Link className="text-white mt-2 inline-block underline" to="/reset-password">esqueci minha senha</Link>
                {error && <p className="text-red-500">{error}</p>}
            </form>
            <button 
                onClick={() => window.location.href = "http://localhost:3000/auth/google"}
                className="mt-4 w-full bg-white text-black py-2 rounded-md flex items-center justify-center gap-2"
                >
                <img src="/google-logo.svg" alt="Google" className="w-5 h-5" />
                Entrar com Google
            </button>
        </div>
    );
}
