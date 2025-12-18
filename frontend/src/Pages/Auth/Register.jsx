import { useState } from "react";
import Input from "../../components/uxui/Input";
import useTitle from '../../hooks/useTitle'
import { useNavigate, Link } from "react-router-dom";
import LoadingSkeleton from "../../components/uxui/LoadingSkeleton";
import { api } from "../../services/api";
import GoogleButton from "@/Components/uxui/googleButton";
import SubmitButton from "../../components/uxui/submitButton";
import SportinsiderIcon from "../../assets/img/sportinsider-logo.png";

export default function Register() {
    useTitle("Crie sua conta");
    
    const navigate = useNavigate();

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState(""); 
    const [error, setError] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [strength, setStrength] = useState(0);
    const [registerOk, setRegisterOk] = useState(false);

    function checkPasswordStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++; // símbolos
        return score;
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        
        if (senha !== confirmarSenha) {
            setError("As senhas não coincidem. Por favor, verifique.");
            return; 
        }

        if (strength < 3) {
            setError("A senha precisa ser mais forte.");
            return;
        }

        setIsRegistering(true);

        try {
            await api.post("/auth/register", { nome, email, senha });

            setIsRegistering(false);
            // alert("Cadastro realizado com sucesso! Faça login para continuar.");
            setRegisterOk(true);

            localStorage.setItem("pending_email_verification", email);
        } catch (error) {
            setIsRegistering(false);
            setRegisterOk(false);
            const msg = error.response?.data?.error || "Erro ao fazer cadastro.";
            setError(msg);
        }
    };


    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:3000/auth/google";

    };

    return (
        <div className="w-full min-h-screen flex flex-col top-0 left-0 bg-[#0C0718] text-white overflow-x-hidden">

             { 
                !registerOk && (
                    <div className="w-full flex justify-center pt-8 px-4 sm:px-6 lg:px-8 z-20">
                        <div className="w-full max-w-[1740px] h-[68px] rounded-full flex justify-between items-center px-4 lg:px-12 backdrop-blur-md border border-white/10 bg-gradient-to-l from-[#1C142F] via-[#3D315D] to-[#c53ed40] to-transparent">
                            <div className="flex items-center gap-3">
                                <img 
                                    src={SportinsiderIcon} 
                                    alt="Logo Sportinsider" 
                                    className="w-36 h-auto" 
                                />
                            </div>
                            <div className="flex items-center text-sm text-gray-300 bg-[#0C0718] px-8 py-3 rounded-full border border-white/10 shadow-lg">
                                <span className="mr-1 hidden sm:inline font-light">Já tem uma conta?</span>
                                <Link to="/login" className="text-[#9F50FF] hover:text-[#B475FF] font-medium transition-colors underline decoration-[#9F50FF] underline-offset-4 hover:decoration-[#B475FF]">
                                    Login aqui
                                </Link>
                            </div>
                        </div>
                    </div>
                )

             }   
            

            {/* Conteúdo Principal Centralizado */}
            {
                registerOk ? (
                    <div class="w-full h-full flex flex-col items-center justify-center">
                        <h2>
                            Cadastro realizado com sucesso!
                        </h2>
                        <p>
                            verifique seu e-mail para confirmar o cadastro
                        </p>
                        <span>Se já confirmou seu email,  <Link to="/login">faça login aqui</Link></span>
                    </div>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center w-full py-12 lg:py-24 relative z-10">
                        <div className="w-full max-w-[500px] px-6 flex flex-col gap-10">
                            {/* ANimação das bolinhasss */}
                            <div className="absolute top-0 right-0 left-0 rotate-90 bottom-0 flex items-center justify-center opacity-10">

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
                            <div className="w-full z-40">
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
                                        onChange={(e) => {
                                            setSenha(e.target.value);
                                            setStrength(checkPasswordStrength(e.target.value));
                                        }}
                                    />
                                    
                                    {senha.length > 0 && (
                                            <div className="flex items-center justify-between px-1 mb-3">
                                                <div className="flex gap-1 h-1 flex-grow mr-4">
                                                    {[1, 2, 3, 4, 5].map((level) => (
                                                        <div 
                                                            key={level} 
                                                            className={`h-full flex-grow rounded-full transition-all duration-300 ${
                                                                strength >= level 
                                                                    ? (strength < 3 ? 'bg-red-500' : strength < 4 ? 'bg-yellow-400' : 'bg-green-400') 
                                                                    : 'bg-[#FFFFFF1A]'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className={`text-xs font-medium ${
                                                    strength < 3 ? 'text-red-400' : strength < 4 ? 'text-yellow-400' : 'text-green-400'
                                                }`}>
                                                    {strength === 0 && "Muito fraca"}
                                                    {strength === 1 && "Fraca"}
                                                    {strength === 2 && "Média"}
                                                    {strength === 3 && "Boa"}
                                                    {strength === 4 && "Forte"}
                                                    {strength === 5 && "Muito forte!"}
                                                </span>
                                            </div>
                                        )}

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
                                    <SubmitButton {...{disabled: isRegistering}} text={ isRegistering ? "Cadastrando..." : "Cadastrar"} />

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
                                <form onSubmit={handleSubmit} className="flex flex-col mt-5">
                                <GoogleButton onClick={handleGoogleLogin} />
                                </form>

                            </div>
                        </div>
                    </div>
                )
            }
            

            
        </div>
    );
}