import { useState, useContext, useEffect } from "react";
import Input from "../../components/uxui/Input";
import useTitle from '../../hooks/useTitle'
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import LoadingSkeleton from "../../components/uxui/LoadingSkeleton";
import { api } from "../../services/api";
import ContainerLogo from "../../assets/img/container-logo.png";
import ContainerBallLogo from "../../assets/img/container-ball-logo.png";
import LogoHome from "../../assets/img/sportinsider-logo.png"

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
            login(data.token, data.user);
            setIsLoggingIn(false);

            if (data.user.role === "user") navigate("/dashboard");
            if (data.user.role === "admin") navigate("/admin");
            if (data.user.role === "admin_master") navigate("/admin");

        } catch (error) {
            setIsLoggingIn(false);
            const msg = error.response?.data?.error || "Erro ao fazer login.";
            setError(msg);
        }
    };

    if (isLoggingIn) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="relative z-40 w-full h-screen text-white bg-[#0C0718]">
            <div className="w-80 h-80 absolute top-0 left-0  bg-[radial-gradient(50%_50%_at_50%_50%,_#7E34D9_0%,_rgba(126,52,217,0)_89%)] blur-[137px] rounded-full hidden lg:block -translate-x-1/2 -translate-y-1/2"></div>
            <div className="flex flex-col min-h-screen">
                <div className="flex-grow flex items-center justify-center py-10 lg:py-20">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-wrap items-center justify-center space-y-8 lg:space-y-0">
                        
                            <div className="w-full lg:w-1/2 h-[400px] lg:h-[80svh] relative flex items-center justify-center">
                                {/* ANimação das bolinhasss */}
                                <div className="absolute top-0 translate-x-10 lg:translate-x-20 right-0 bottom-0 flex items-center justify-center opacity-30">

                                    {/* do meio paradinho */}
                                    <div className="z-50 lg:w-[480px] lg:h-[480px] w-[260px] h-[260px] rounded-full bg-linear-to-l from-[#7E34D9] to-[#ffffff00] rotate-90"/>

                                    {/* sobe */}
                                    <div style={{ "--recoil-distance": "50px" }}  className="absolute lg:w-[480px] lg:h-[480px] w-[260px] h-[260px] rounded-full bg-linear-to-l from-[#7e34d98a] to-[#7E34D9] animate-recoil-left-1"/>
                                    <div style={{ "--recoil-distance": "150px" }}  className="absolute lg:w-[480px] lg:h-[480px] w-[260px] h-[260px] rounded-full bg-linear-to-l from-[#7e34d98a] to-[#ffffff00] animate-recoil-left-2"/>
                                    <div style={{ "--recoil-distance": "300px" }}  className="absolute lg:w-[480px] lg:h-[480px] w-[260px] h-[260px] rounded-full bg-linear-to-l from-[#7E34D9] to-[#ffffff00] animate-recoil-left-3"/>

                                    {/* desce */}
                                    <div style={{ "--recoil-distance": "-50px" }} className="absolute lg:w-[480px] lg:h-[480px] w-[260px] h-[260px] rounded-full bg-linear-to-l from-[#7e34d98a] to-[#ffffff00] animate-recoil-right-1"/>
                                    <div style={{ "--recoil-distance": "-150px" }} className="absolute lg:w-[480px] lg:h-[480px] w-[260px] h-[260px] rounded-full bg-linear-to-l from-[#7e34d98a] to-[#ffffff00] animate-recoil-right-2"/>
                                    <div style={{ "--recoil-distance": "-300px" }} className="absolute lg:w-[480px] lg:h-[480px] w-[260px] h-[260px] rounded-full bg-linear-to-l from-[#7e34d98a] to-[#ffffff00] animate-recoil-right-3"/>

                                </div>
                                
                                <div className="z-10 relative w-full h-full lg:max-w-[500px] lg:mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                                    <img 
                                        src={ContainerLogo} 
                                        alt="Sportinsider Hero" 
                                        className="w-full h-full object-cover" 
                                    />
                                    <div className="absolute top-8 left-8">
                                        <img src={LogoHome} alt="Sportinsider Logo" className="w-36 h-auto" />
                                    </div>
                                </div>
                                
                                <div className="bg-[radial-gradient(50%_50%_at_50%_50%,_#7E34D9_0%,_rgba(126,52,217,0)_89%)] blur-[100px] hidden lg:block absolute w-[200px] bg-black h-full right-0 top-0 top-0 rounded-tr-full rounded-br-full"></div>
                            </div>

                            <div className="relative z-30 w-full lg:w-1/2 px-4 lg:px-8">
                                <div className="w-full lg:max-w-[500px] lg:mx-auto">
                                    
                                    <h1 className="mb-6 bg-linear-to-l from-[#ffffff1f] to-[#ffffff] bg-clip-text text-4xl text-transparent text-left font-semibold">Acesse sua conta</h1>

                                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                        
                                        <Input
                                            label="E-mail"
                                            labelColor="text-[#FFFFFF99]"
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={email}
                                            variant="dark"
                                            onChange={(e) => setEmail(e.target.value)}
                                        />

                                        <div className="flex flex-col gap-2">
                                            <Input
                                                label="Senha"
                                                labelColor="text-[#FFFFFF99]"
                                                type="password"
                                                placeholder="********"
                                                value={senha}
                                                variant="dark"
                                                onChange={(e) => setSenha(e.target.value)}
                                            />

                                            <div className="text-right">
                                                <Link
                                                    to="/reset-password"
                                                    className="text-sm lg:text-base text-[#9F50FF] xl:text-xl underline hover:text-white transition-colors"
                                                >
                                                    Esqueceu sua senha?
                                                </Link>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1 text-[#FFFFFF99]">
                                            <input
                                                type="checkbox"
                                                id="lembrar"
                                                checked={lembrar}
                                                className="accent-[#7F33D9] w-4 h-4 rounded border-[#FFFFFF33] bg-transparent"
                                                onChange={(e) => setLembrar(e.target.checked)}
                                            />
                                            <label htmlFor="lembrar" className="text-sm lg:text-base xl:text-xl text-[#E2D6FF] cursor-pointer select-none">
                                                Lembrar meu acesso
                                            </label>
                                        </div>

                                        <div className="mt-2">
                                            <button
                                                type="submit"
                                                className="cursor-pointer w-full py-4 lg:py-6 rounded-full bg-[linear-gradient(109.09deg,#FFFFFF_3.35%,#E7D3FF_96.65%)] hover:opacity-90 transition-all flex items-center justify-center gap-2 group"
                                            >
                                                <span className="text-[#7F33D9] cursor-pointer font-light text-base lg:text-xl">Entrar</span>
                                                <svg 
                                                    width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                                                    className="text-[#7F33D9] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                                                >
                                                    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

                                    <button
                                        onClick={() => (window.location.href = "http://localhost:3000/auth/google")}
                                        className="cursor-pointer w-full py-4 lg:py-5 bg-transparent border border-[#665494] hover:bg-[#FFFFFF0D] text-white rounded-full flex items-center justify-center gap-3 transition-all"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        <span className="cursor-pointer text-sm lg:text-base xl:text-xl font-light text-[#FFFFFF]">Entrar com o Google</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}