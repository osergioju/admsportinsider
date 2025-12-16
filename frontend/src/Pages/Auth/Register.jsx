import { useState } from "react";
import Input from "../../components/uxui/Input";
import useTitle from '../../hooks/useTitle'
import { useNavigate, Link } from "react-router-dom";
import LoadingSkeleton from "../../components/uxui/LoadingSkeleton";
import { api } from "../../services/api";

export default function Register() {
    useTitle("Crie sua conta");
    
    const navigate = useNavigate();

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState(""); 
    const [error, setError] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        
        if (senha !== confirmarSenha) {
            setError("As senhas não coincidem. Por favor, verifique.");
            return; 
        }

        setIsRegistering(true);

        try {
            await api.post("/auth/register", { nome, email, senha, regiao });

            setIsRegistering(false);
            alert("Cadastro realizado com sucesso! Faça login para continuar.");

            localStorage.setItem("pending_email_verification", email);
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
        <div className="w-full min-h-screen flex flex-col top-0 left-0 bg-[#0C0718] text-white overflow-x-hidden">
            
            <div className="w-full flex justify-center pt-8 px-4 sm:px-6 lg:px-8 z-20">
                <div className="w-full max-w-[1740px] h-[68px] bg-[#FFFFFF05] border border-white/10 rounded-full flex justify-between items-center px-6 lg:px-16 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#E2D9FF] to-[#8257E5] flex-shrink-0"></div>
                         <span className="font-bold text-2xl text-white tracking-tight">sportinsider</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-300 bg-[#FFFFFF05] px-6 py-3 rounded-full border border-white/5">
                        <span className="mr-1 hidden sm:inline">Já tem uma conta?</span>
                        <Link to="/login" className="text-[#D8B5FF] hover:text-white font-medium transition-colors underline decoration-transparent hover:decoration-white">
                            Login aqui
                        </Link>
                    </div>
                </div>
            </div>

            {/* Conteúdo Principal Centralizado */}
            <div className="flex-grow flex flex-col items-center justify-center w-full py-12 lg:py-24 relative z-10">
                
                <div className="w-full max-w-[500px] px-6 flex flex-col gap-10">
                    
                    <div className="w-full">
                        {/* Título com Gradiente de Texto */}
                        <h1 className="mb-6 bg-linear-to-l from-[#ffffff1f] to-[#ffffff] bg-clip-text text-4xl text-transparent text-center font-semibold">
                            Crie sua conta
                        </h1>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {/* Inputs padronizados com as cores do Login */}
                            <Input
                                label="Nome Completo"
                                labelColor="text-[#FFFFFF99]"
                                type="text"
                                placeholder="Seu nome"
                                value={nome}
                                variant="dark"
                                onChange={(e) => setNome(e.target.value)}
                            />

                            <Input
                                label="E-mail"
                                labelColor="text-[#FFFFFF99]"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                variant="dark"
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <Input
                                label="Senha"
                                labelColor="text-[#FFFFFF99]"
                                type="password"
                                placeholder="********"
                                value={senha}
                                variant="dark"
                                onChange={(e) => setSenha(e.target.value)}
                            />

                            <Input
                                label="Confirme a Senha"
                                labelColor="text-[#FFFFFF99]"
                                type="password"
                                placeholder="********"
                                value={confirmarSenha}
                                variant="dark"
                                onChange={(e) => setConfirmarSenha(e.target.value)}
                            />

                            {/* Botão Submit Gradiente */}
                            <div className="mt-2">
                                <button
                                    type="submit"
                                    className="w-full h-14 rounded-full bg-[linear-gradient(109.09deg,#FFFFFF_3.35%,#E7D3FF_96.65%)] hover:opacity-90 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <span className="text-[#7F33D9] font-semibold text-lg cursor-pointer">Criar conta</span>
                                    <svg 
                                        width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                                        className="text-[#7F33D9] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform stroke-current stroke-2"
                                    >
                                        <path d="M7 17L17 7M17 7H7M17 7V17" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            </div>

                            {error && (
                                <p className="text-[#F44336] text-sm text-center mt-1 bg-[#F44336]/10 py-2 rounded-md border border-[#F44336]/20">
                                    {error}
                                </p>
                            )}
                        </form>

                        <div className="flex items-center gap-4 my-6">
                            <div className="h-px w-full bg-[#FFFFFF33]" />
                            <span className="text-sm text-[#FFFFFF99]">ou</span>
                            <div className="h-px w-full bg-[#FFFFFF33]" />
                        </div>

                        {/* Botão Google */}
                        <button
                            className="w-full h-14 bg-transparent border border-[#FFFFFF33] hover:bg-[#FFFFFF0D] text-white rounded-full flex items-center justify-center gap-3 transition-all group"
                        >
                            <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span className="font-medium text-sm text-[#FFFFFFCC] group-hover:text-white cursor-pointer transition-colors">Entrar com o Google</span>
                        </button>
                    </div>
                </div>
            </div>

            
        </div>
    );
}