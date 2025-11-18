import Input from "../../Components/UI/Input";
import useTitle from '../../hooks/useTitle'

export default function Login() {
    // Adiciona título 
    useTitle("Entre na sua conta");

    return (
        <div className="mx-2">
            <h1 className="text-2xl font-bold mb-6">Entrar</h1>

            <form>
                <Input label="E-mail" type="email" placeholder="seu@email.com" />
                <Input label="Senha" type="password" placeholder="********" />
            </form>
        </div>
    );
}
