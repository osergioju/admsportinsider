import { Link } from "react-router-dom";
import SportinsiderIcon from "../assets/svg/brand-white.svg";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";

const REVOKE_URL = "https://myaccount.google.com/permissions";

// Cada seção tem um título (rótulo roxo) e blocos: parágrafo, lista ou link.
const SECTIONS = [
    {
        title: "1. Dados coletados",
        blocks: [
            { p: "Quando o usuário opta por acessar a plataforma utilizando sua Conta Google (Google Sign-In), podemos acessar as seguintes informações, mediante autorização do próprio usuário:" },
            { ul: ["Nome completo;", "Endereço de e-mail;", "Foto de perfil (quando disponibilizada pelo Google);", "Identificador único da Conta Google (Google User ID)."] },
            { p: "Não solicitamos acesso a e-mails, contatos, arquivos do Google Drive, calendário ou quaisquer outros dados além daqueles necessários para autenticação do usuário." },
        ],
    },
    {
        title: "2. Como utilizamos esses dados",
        blocks: [
            { p: "Os dados obtidos são utilizados exclusivamente para:" },
            { ul: ["autenticar o usuário na plataforma;", "criar ou localizar sua conta;", "identificar o usuário durante o uso do sistema;", "permitir acesso aos recursos contratados;", "melhorar a experiência de utilização da plataforma."] },
            { p: "Os dados não são utilizados para envio de publicidade baseada em informações da Conta Google." },
        ],
    },
    {
        title: "3. Compartilhamento de informações",
        blocks: [
            { p: "Não vendemos, alugamos ou compartilhamos os dados obtidos da Conta Google com terceiros para fins comerciais." },
            { p: "As informações somente poderão ser compartilhadas quando:" },
            { ul: ["houver obrigação legal;", "necessário para cumprimento de determinações judiciais;", "indispensável para o funcionamento da plataforma mediante fornecedores de infraestrutura que seguem padrões adequados de segurança."] },
        ],
    },
    {
        title: "4. Armazenamento e segurança",
        blocks: [
            { p: "Os dados são armazenados em ambiente protegido e são utilizados apenas pelo tempo necessário para prestação dos serviços da plataforma." },
            { p: "Adotamos medidas técnicas e administrativas razoáveis para proteger as informações contra acesso não autorizado, perda, alteração ou divulgação indevida." },
        ],
    },
    {
        title: "5. Dados do Google",
        blocks: [
            { p: "A Sport Insider utiliza as informações obtidas da Conta Google exclusivamente para autenticação e identificação do usuário." },
            { p: "As informações obtidas por meio das APIs do Google não são utilizadas para desenvolver, melhorar ou treinar modelos de inteligência artificial, aprendizado de máquina ou sistemas similares." },
        ],
    },
    {
        title: "6. Revogação do acesso",
        blocks: [
            { p: "O usuário pode revogar, a qualquer momento, a autorização concedida à Sport Insider acessando:" },
            { link: REVOKE_URL },
            { p: "Após a revogação, o login com Google poderá deixar de funcionar até que uma nova autorização seja concedida." },
        ],
    },
    {
        title: "7. Direitos do usuário",
        blocks: [
            { p: "O usuário poderá solicitar:" },
            { ul: ["acesso aos seus dados;", "correção de informações;", "exclusão de sua conta;", "esclarecimentos sobre o tratamento de dados."] },
            { p: "As solicitações poderão ser realizadas pelos canais de contato disponibilizados pela Sport Insider." },
        ],
    },
    {
        title: "8. Alterações nesta política",
        blocks: [
            { p: "Esta Política de Privacidade poderá ser atualizada periodicamente. Sempre que houver alterações relevantes, a nova versão será publicada nesta página." },
        ],
    },
    {
        title: "9. Contato",
        blocks: [
            { p: "Em caso de dúvidas sobre esta Política de Privacidade ou sobre o tratamento de dados pessoais, entre em contato conosco pelos canais oficiais disponibilizados pela Sport Insider." },
        ],
    },
];

function Block({ block }) {
    if (block.p) {
        return <p className="text-[#0A0A0AB2] text-base lg:text-lg leading-relaxed">{block.p}</p>;
    }
    if (block.ul) {
        return (
            <ul className="list-disc pl-6 space-y-2">
                {block.ul.map((item, i) => (
                    <li key={i} className="text-[#0A0A0AB2] text-base lg:text-lg leading-relaxed">{item}</li>
                ))}
            </ul>
        );
    }
    if (block.link) {
        return (
            <a
                href={block.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8033D9] font-medium text-base lg:text-lg break-all hover:underline"
            >
                {block.link}
            </a>
        );
    }
    return null;
}

export default function Privacidade() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="w-full bg-[#030015] min-h-screen">

            {/* ── NAVBAR (idêntica à Legal/FrontPage) ───────────── */}
            <div className="w-full flex justify-center pt-8 px-4 sm:px-6 lg:px-8 z-20">
                <div className="relative w-full max-w-[1740px] h-[68px] rounded-full flex justify-between items-center pl-4 lg:pl-12 pr-2 backdrop-blur-md border border-white/10 bg-gradient-to-l from-[#1C142F] via-[#3D315D] to-transparent">
                    <Link to="/">
                        <img src={SportinsiderIcon} alt="Sport Insider" className="w-36 lg:w-44 xl:w-50 h-auto" />
                    </Link>
                    <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 gap-10 text-[#C2B3E0] font-light">
                        <Link to="/dados" className="hover:text-white transition-colors">METODOLOGIA</Link>
                        <Link to="/pricing" className="hover:text-white transition-colors">PLANOS</Link>
                        <Link to="/dashboard-public" className="hover:text-white transition-colors">TESTE GRÁTIS</Link>
                        <Link to="/register" className="hover:text-white transition-colors">COMEÇAR AGORA</Link>
                    </div>
                    <div className="flex items-center">
                        <Link
                            to="/login"
                            className="bg-gradient-to-r from-[#904EDE] to-[#4E2A78] mr-0 px-5 py-3 text-sm sm:px-5 sm:py-3 flex items-center border border-[#A572E1] text-white rounded-full hover:brightness-110 transition-all lg:text-lg"
                        >
                            Acessar <ArrowUpRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4" />
                        </Link>
                        <button
                            className="flex items-center lg:hidden ml-2 bg-gradient-to-r from-[#904EDE] to-[#4E2A78] px-4 py-3 text-sm border border-[#A572E1] text-white rounded-full hover:brightness-110 transition-all"
                            onClick={() => setMenuOpen(o => !o)}
                        >
                            ☰
                        </button>
                    </div>
                </div>
            </div>

            {menuOpen && (
                <div className="w-[90%] left-[5%] bg-gradient-to-r from-[#904EDE] to-[#4E2A78] absolute top-[120px] rounded-xl flex flex-col items-center gap-2 py-6 z-50">
                    <Link className="text-white font-light" to="/dados">METODOLOGIA</Link>
                    <Link className="text-white font-light" to="/pricing">PLANOS</Link>
                    <Link className="text-white font-light" to="/dashboard-public">TESTE GRÁTIS</Link>
                    <Link className="text-white font-light" to="/register">COMEÇAR AGORA</Link>
                </div>
            )}

            {/* ── HERO ─────────────────────────────────────────── */}
            <div className="pt-20 pb-16 px-6 text-center">
                <p className="text-[#8033D9] font-medium text-sm lg:text-base mb-4 tracking-wide uppercase">
                    Sport Insider PRO
                </p>
                <h1 className="font-medium text-3xl lg:text-5xl xl:text-6xl leading-tight bg-gradient-to-r from-[#ffffff3a] to-[#ffffff] bg-clip-text text-transparent">
                    Política de Privacidade
                </h1>
                <p className="mt-4 text-[#ffffff66] font-light text-sm">
                    Última atualização: 15 de junho de 2026
                </p>
                <div className="mt-6 text-[#ffffffa6] font-light text-base lg:text-xl max-w-2xl mx-auto leading-relaxed space-y-4">
                    <p>
                        A <span className="text-white font-medium">Sport Insider</span> ("nós", "nosso" ou "plataforma")
                        respeita a privacidade de seus usuários e está comprometida com a proteção de seus dados pessoais.
                    </p>
                    <p>
                        Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos as
                        informações obtidas por meio da utilização da plataforma Sport Insider, incluindo aquelas
                        fornecidas por meio do login com a Conta Google.
                    </p>
                </div>
            </div>

            {/* ── CONTEÚDO (seção clara, como na Legal) ─────────── */}
            <div className="bg-[#F5F0F0] w-full relative overflow-hidden">

                {/* Grid de fundo sutil */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{ backgroundImage: "linear-gradient(to right, #e5e5e5 1px, transparent 1px)", backgroundSize: "6rem 100%" }}
                />

                <div className="relative z-10 max-w-3xl mx-auto px-6 py-20 space-y-12">
                    {SECTIONS.map((s, idx) => (
                        <div key={s.title}>
                            {idx > 0 && <div className="h-px bg-gray-200 mb-12" />}
                            <p className="text-[#8033D9] font-medium text-sm mb-4 uppercase tracking-wide">
                                {s.title}
                            </p>
                            <div className="space-y-4">
                                {s.blocks.map((b, i) => <Block key={i} block={b} />)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
