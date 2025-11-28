import { useState } from "react";
import Input from "../../components/ui/Input";
import Submit from "../../components/ui/Submit";
import useTitle from '../../hooks/useTitle'
import { useNavigate } from "react-router-dom";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import { api } from "../../services/api"; 
import { Panda } from "lucide-react";

export default function Register() {
    useTitle("Crie sua conta");
    
    const navigate = useNavigate();

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState(""); 
    const [error, setError] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);

    // Envio API
    const handleSubmit = async (event) => {
        event.preventDefault();

        // Remove o erro 
        setError("");
        
        if (senha !== confirmarSenha) {
            setError("As senhas não coincidem. Por favor, verifique.");

            return; 
        }

        setIsRegistering(true); //loading

        try {
            await api.post("/auth/register", { nome, email, senha });

            setIsRegistering(false);

            alert("Cadastro realizado com sucesso! Faça login para continuar.");
            navigate("/login"); 

        } catch (error) {
            setIsRegistering(false);

            const msg = error.response?.data?.error || "Erro ao fazer cadastro.";
            setError(msg);
        }
    };

    if (isRegistering) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="mx-2">
            <Panda className="w-10 h-10 text-white"></Panda>
            <h1 className="font-bold mb-6 text-white font-light text-5xl">Cadastre-se</h1>

            <form onSubmit={handleSubmit}>
                <Input
                    label="Nome Completo"
                    labelColor="text-white"
                    type="text"
                    placeholder="Seu nome"
                    value={nome}
                    variant="dark"
                    onChange={(e) => setNome(e.target.value)}
                />

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

                <Input
                    label="Confirme a Senha"
                    labelColor="text-white"
                    type="password"
                    placeholder="********"
                    value={confirmarSenha}
                    variant="dark"
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                />

                <Submit value="Criar Conta" />

                {error && <p className="text-red-500">{error}</p>}
                
                
                <p className="mt-4 text-center text-white">
                    Já tem uma conta? 
                    <button 
                        type="button" 
                        onClick={() => navigate("/login")} 
                        className="text-white font-bold ml-1 hover:text-gray-300 transition-colors"
                    >
                        Entrar
                    </button>
                </p>

            </form>
        </div>
    );
}