import { useState } from "react";
import Input from "../../Components/UI/Input";
import Submit from "../../Components/UI/Submit";
import useTitle from '../../hooks/useTitle'
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
    useTitle("Entre na sua conta");
    
    // Consts do ambiente
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [error, setError] = useState("");

    // Enviar o formulário para a API do logim
    const handleSubmit = async (event) => {
        event.preventDefault();

        // Remove o erro 
        setError("");

        try {
            const response = await fetch("http://localhost:3000/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    senha,
                }),
            });

            const data = await response.json();


            if (response.ok) {
                login(data.token, data.user);

                // Redireciona para o dashboard

                if (data.user.role === "user") navigate("/dashboard");
                if (data.user.role === "admin") navigate("/admin");
                if (data.user.role === "admin_master") navigate("/admin");
            } else {
                setError(data.error);
            }

        } catch (error) {
            console.error("Erro ao fazer login:", error);
        }
    };


    return (
        <div className="mx-2">
            <h1 className="text-2xl font-bold mb-6">Entrar</h1>

            <form onSubmit={handleSubmit}>
                <Input
                    label="E-mail"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                    label="Senha"
                    type="password"
                    placeholder="********"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                />

                <Submit value="Entrar" />

                {error && <p className="text-red-500">{error}</p>}
            </form>
        </div>
    );
}
