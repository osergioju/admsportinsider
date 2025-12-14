import { useState } from "react";
import Input from "../../components/uxui/Input";
import useTitle from '../../hooks/useTitle'
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import LoadingSkeleton from "../../components/uxui/LoadingSkeleton";
import { api } from "../../services/api"; 


export default function Login() {
    useTitle("Entre na sua conta");
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [error, setError] = useState("");
    const [lembrar, setLembrar] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

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
        <div className="w-full h-screen overflow-y-auto overflow-x-hidden">
            <div className="flex flex-col min-h-screen">
                <div className="flex-grow flex items-center justify-center py-10 lg:py-20">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-wrap items-center space-y-8">
                            <div className="w-full lg:w-1/2 h-[160px] lg:h-[80svh] relative">
                                <div className="z-30 relative w-full h-full lg:max-w-[500px] lg:mx-auto bg-white rounded-3xl"></div>
                                <div className="absolute left-0 top-0 bg-black h-full w-full flex items-end flex-col justify-center">
                                    <div className="w-100 h-100 bg-linear-to-l from-[#ffffff1f] to-[#ffffff] rounded-full"></div>
                                    <div className="w-100 h-100 bg-linear-to-l from-[#ffffff1f] to-[#ffffff] rounded-full"></div>
                                    <div className="w-100 h-100 bg-linear-to-l from-[#ffffff1f] to-[#ffffff] rounded-full"></div>
                                    <div className="w-100 h-100 bg-linear-to-l from-[#ffffff1f] to-[#ffffff] rounded-full"></div>                            
                                </div>
                            </div>

                            <div className="w-full lg:w-1/2 px-4 lg:px-8">
                                <div className="w-full lg:max-w-[500px] lg:mx-auto">
                                    <h1 className="mb-6 bg-linear-to-l from-[#ffffff1f] to-[#ffffff] bg-clip-text text-4xl text-transparent text-left font-semibold">Acesse sua conta</h1>

                                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                        <Input
                                            label="E-mail"
                                            labelColor="text-gray-300"
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={email}
                                            variant="dark"
                                            onChange={(e) => setEmail(e.target.value)}
                                        />

                                        <div className="flex flex-col gap-2">
                                            <Input
                                                label="Senha"
                                                labelColor="text-gray-300"
                                                type="password"
                                                placeholder="********"
                                                value={senha}
                                                variant="dark"
                                                onChange={(e) => setSenha(e.target.value)}
                                            />

                                            <div className="text-right">
                                                <Link
                                                to="/reset-password"
                                                className="text-sm text-[#8257E5] hover:text-[#996DFF] transition-colors"
                                                >
                                                Esqueceu sua senha?
                                                </Link>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1 text-gray-400">
                                            <input
                                                type="checkbox"
                                                id="lembrar"
                                                checked={lembrar}
                                                className="accent-[#8257E5] w-4 h-4 rounded border-gray-600 bg-transparent"
                                                onChange={(e) => setLembrar(e.target.checked)}
                                            />
                                            <label htmlFor="lembrar" className="text-sm cursor-pointer select-none">
                                                Lembrar meu acesso
                                            </label>
                                        </div>

                                        <div className="mt-2">
                                            <button
                                                type="submit"
                                                className="w-full h-12 rounded-full bg-gradient-to-r from-[#E2D9FF] to-[#F2EFFF] hover:opacity-90 transition-all flex items-center justify-center gap-2 group"
                                            >
                                                <span className="text-[#8257E5] cursor-pointer font-medium text-base">Entrar</span>
                                                <svg 
                                                width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                                                className="text-[#8257E5] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                                                >
                                                <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </button>
                                        </div>

                                        {error && (
                                            <p className="text-red-400 text-sm text-center mt-1 bg-red-500/10 py-2 rounded-md border border-red-500/20">
                                                {error}
                                            </p>
                                        )}
                                    </form>

                                    <div className="flex items-center gap-4 my-6">
                                        <div className="h-px w-full bg-white/10" />
                                        <span className="text-sm text-gray-500">ou</span>
                                        <div className="h-px w-full bg-white/10" />
                                    </div>

                                    <button
                                        onClick={() => (window.location.href = "http://localhost:3000/auth/google")}
                                        className="w-full h-12 bg-transparent border border-white/20 hover:bg-white/5 text-white rounded-full flex items-center justify-center gap-3 transition-all"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        <span className="font-medium cursor-pointer text-sm text-gray-300">Entrar com o Google</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="w-full bg-[#1A103C] text-white relative overflow-hidden pt-20 pb-8 mt-auto z-10">
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/40 rounded-full blur-[100px]"></div>
                        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-900/30 rounded-full blur-[120px]"></div>
                    </div>

                    <div className="container mx-auto px-6 relative z-10">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center opacity-[0.03] pointer-events-none select-none">
                            <h1 className="text-[10rem] md:text-[16rem] font-bold leading-none tracking-tighter whitespace-nowrap">
                                sportinsider
                            </h1>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20 mt-10">
                            <div className="flex flex-col gap-4 text-xs tracking-wider font-light text-gray-300 uppercase">
                                <a href="#" className="hover:text-white transition-colors">Home</a>
                                <a href="#" className="hover:text-white transition-colors">Newsletter</a>
                                <a href="#" className="hover:text-white transition-colors">Vídeocast</a>
                                <a href="#" className="hover:text-white transition-colors">Relatórios</a>
                                <a href="#" className="hover:text-white transition-colors">Eventos</a>
                                <a href="#" className="hover:text-white transition-colors">Banco de Vagas</a>
                            </div>

                            <div className="flex flex-col gap-4 text-xs tracking-wider font-light text-gray-300 uppercase">
                                <a href="#" className="hover:text-white transition-colors">O que é a Sportinsider</a>
                                <a href="#" className="hover:text-white transition-colors">Nossa Equipe</a>
                                <a href="#" className="hover:text-white transition-colors">Nossos Parceiros</a>
                                <a href="#" className="hover:text-white transition-colors">Anuncie</a>
                                <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
                                <a href="#" className="hover:text-white transition-colors">Preços</a>
                            </div>

                            <div className="flex flex-col gap-4">
                                <span className="text-xs tracking-wider font-light text-gray-300 uppercase">Siga</span>
                                <div className="flex items-center gap-4">
                                    <a href="#" className="bg-white text-[#1A103C] w-6 h-6 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.299z"/></svg>
                                    </a>
                                    <a href="#" className="bg-white text-[#1A103C] p-1 rounded hover:opacity-80 transition-opacity">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5S0 4.881 0 3.5C0 2.119 1.12 1 2.5 1s2.48 1.119 2.48 2.5zM5 8H0v16h5V8zm7.98 0H8v16h5v-8.381C13 7.26 16.98 7 16.98 12.5V24H22V11.5c0-6.5-4.5-7.5-9.02-5.5V8z"/></svg>
                                    </a>
                                    <a href="#" className="text-white hover:opacity-80 transition-opacity">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                                    </a>
                                    <a href="#" className="text-white hover:opacity-80 transition-opacity">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                    </a>
                                    <a href="#" className="text-white hover:opacity-80 transition-opacity">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="w-full bg-[#FFFFFF10] border border-[#FFFFFF15] rounded-full px-8 py-3 flex items-center justify-between text-xs text-gray-400 backdrop-blur-md">
                            <span>Sportinsider todos os direitos reservados</span>
                            <span>2025</span>
                        </div>
                    </div>
                </footer>

            </div>
        </div>
    );
}