import { Link } from "react-router-dom";

export default function FrontPage() {
  return (
    <div className="w-5/6 max-w-3xl mx-auto p-10 bg-white rounded-3xl ">
        <h3 class="mb-5 text-3xl font-bold">Links maneiros pra testar</h3>
        <ul class="border-b border-[#e5e7eb] pb-3 mb-3">
            <span className="text-xl font-bold mb-2">Usuário comum</span>
            <li><Link to="/login" className="cursor-pointer hover:text-gray-300">Login</Link></li>
            <li><Link to="/register" className="cursor-pointer hover:text-gray-300">Cadastrar</Link></li>
            <li><Link to="/reset-password" className="cursor-pointer hover:text-gray-300">Trocar a senha</Link></li>
            <li><Link to="/login" className="cursor-pointer hover:text-gray-300">Dashboard user (página logada)</Link></li>
        </ul>

        <ul class="border-b border-[#e5e7eb] pb-3 mb-3">
            <span className="text-xl font-bold mb-2">Admin</span>
            <li><Link to="/login" className="cursor-pointer hover:text-gray-300">Login</Link></li>
            <li><Link to="/login" className="cursor-pointer hover:text-gray-300">Trocar a senha</Link></li>
            <li><Link to="/login" className="cursor-pointer hover:text-gray-300">Dashboard adm (página logada)</Link></li>
        </ul>
    </div>
  )
}