import { useState, useContext, useEffect } from "react";
import Input from "../../components/uxui/Input";
import useTitle from '../../hooks/useTitle'
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import LoadingSkeleton from "../../components/uxui/LoadingSkeleton";
import { api } from "../../services/api";
import ContainerLogo from "../../assets/img/container-logo.png";
import LogoHome from "../../assets/img/sportinsider-logo.png"
import GoogleButton from "../../components/uxui/googleButton";
import SubmitButton from "../../components/uxui/SubmitButton";

export default function Login() {
    useTitle("Entre na sua conta");
    

    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [error, setError] = useState("");
    //const [lembrar, setLembrar] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const errorParam = searchParams.get("error");

        if (!errorParam) return;

        const messages = {
        google_cancelled: "Login com Google cancelado.",
        google_failed: "Erro ao autenticar com o Google. Tente novamente.",
        };

        setError(messages[errorParam] || "Erro inesperado.");
    }, [searchParams]);




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

    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:3000/auth/google";
    };

    return (
        <div className="relative z-40 w-full h-screen text-white bg-[#0C0718]">
            <div className="w-80 h-80 lg:w-120 lg:h-120 absolute top-0 left-0  bg-[radial-gradient(50%_50%_at_50%_50%,_#7E34D9_0%,_rgba(126,52,217,0)_89%)] blur-[137px] rounded-full hidden lg:block -translate-x-1/2 -translate-y-1/2"></div>
            <div className="flex flex-col min-h-screen">
                <div className="flex-grow flex items-center justify-center py-10 lg:py-20">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-wrap items-center justify-center space-y-8 lg:space-y-0">
                        
                            <div className="w-full lg:w-1/2 h-[400px] lg:h-[80svh] relative flex items-center justify-center">
                                {/* ANimação das bolinhasss */}
                                <div className="absolute top-0 right-0 bottom-0 flex items-center justify-center opacity-30">

                                    {/* do meio paradinho */}

                                    {/* sobe */}
                                    <div style={{ "--recoil-distance": "50px" }}  className="absolute lg:w-[480px] lg:h-[480px] w-[260px] h-[260px] rounded-full bg-linear-to-t from-[#7e34d98a] to-[#7E34D9] animate-recoil-left-1"/>
                                    <div style={{ "--recoil-distance": "150px" }}  className="absolute lg:w-[480px] lg:h-[480px] w-[260px] h-[260px] rounded-full bg-linear-to-t from-[#7e34d98a] to-[#ffffff00] animate-recoil-left-2"/>
                                    <div style={{ "--recoil-distance": "300px" }}  className="absolute lg:w-[480px] lg:h-[480px] w-[260px] h-[260px] rounded-full bg-linear-to-t from-[#7E34D9] to-[#ffffff00] animate-recoil-left-3"/>

                                    {/* desce */}
                                    <div style={{ "--recoil-distance": "-50px" }} className="absolute lg:w-[480px] lg:h-[480px] w-[260px] h-[260px] rounded-full bg-linear-to-b from-[#7e34d98a] to-[#ffffff00] animate-recoil-right-1"/>
                                    <div style={{ "--recoil-distance": "-150px" }} className="absolute lg:w-[480px] lg:h-[480px] w-[260px] h-[260px] rounded-full bg-linear-to-b from-[#7e34d98a] to-[#ffffff00] animate-recoil-right-2"/>
                                    <div style={{ "--recoil-distance": "-300px" }} className="absolute lg:w-[480px] lg:h-[480px] w-[260px] h-[260px] rounded-full bg-linear-to-b from-[#7e34d98a] to-[#ffffff00] animate-recoil-right-3"/>

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

                                        {/*
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
                                        */}

                                            <SubmitButton>
                                                <span className="text-[#7F33D9] text-lg cursor-pointer">Entrar</span>
                                                
                                                {/*seta*/}
                                                <svg 
                                                    width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                                                    className="text-[#7F33D9] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform stroke-current stroke-2"
                                                >
                                                    <path d="M7 17L17 7M17 7H7M17 7V17" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </SubmitButton>

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

                                    <form onSubmit={handleSubmit} className="flex flex-col mt-5">
                                        <GoogleButton onClick={handleGoogleLogin} />
                                    </form>

                                    
                                    {/* cadastrar se n tem conta */}
                                    <Link to="/register" className="inline-block text-center w-full py-2 lg:py-4 lg:text-sm lg:text-xl lg:font-light bg-gradient-to-l from-[#7e34d90] via-[#271E3F] to-[#c53ed40] mt-5">
                                        Novo por aqui? <span className="text-[#9F50FF] underline">crie sua conta</span>
                                    </Link>
                                    
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}