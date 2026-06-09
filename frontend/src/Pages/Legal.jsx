import { Link } from "react-router-dom";
import SportinsiderIcon from "../assets/svg/brand-white.svg";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";

const SECTIONS = [
    {
        tag: "Natureza da informação",
        paragraphs: [
            "Todos os dados expostos têm origem em comunicados oficiais e documentos públicos das entidades esportivas, sobretudo demonstrações contábeis de clubes e federações, exceto quando indicada outra fonte em casos eventuais.",
            "Demonstrações contábeis refletem os dados apurados pelas próprias entidades esportivas. A depender da legislação de cada país, pode haver verificação por parte de auditoria externa independente, mas o parecer pode não estar disponível.",
        ],
    },
    {
        tag: "Responsabilidade legal",
        paragraphs: [
            "O Sport Insider não fornece garantia quanto à precisão ou integridade das informações contidas em tais documentos, e não assume qualquer responsabilidade sobre os resultados de decisões baseadas nesses dados.",
            "Investidores, executivos e demais stakeholders interessados no PRO precisam sempre realizar suas próprias investigações e análises, e são aconselhados a buscar aconselhamento profissional nas áreas jurídica, financeira e tributária.",
            "Nada nesta ferramenta deve ser interpretado ou considerado como garantia ou representação quanto ao futuro, nem deve substituir o processo de due diligence que um investidor realiza antes de decidir como alocar seus investimentos.",
        ],
    },
    {
        tag: "Eventos subsequentes",
        paragraphs: [
            "Todos os dados expostos refletem as informações disponíveis até a publicação do respectivo documento, como o encerramento do exercício fiscal de uma demonstração contábil. O Sport Insider não tem obrigação legal de atualizar ou revisar novas informações que possam ser publicadas após a data inicial.",
        ],
    },
];

export default function Legal() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="w-full bg-[#030015] min-h-screen">

            {/* ── NAVBAR (idêntica à FrontPage) ─────────────────── */}
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
                    Responsabilidade legal
                </h1>
                <p className="mt-6 text-[#ffffffa6] font-light text-base lg:text-xl max-w-2xl mx-auto leading-relaxed">
                    O <span className="text-white font-medium">PRO</span> é a ferramenta desenvolvida pelo{" "}
                    <span className="text-white font-medium">Sport Insider</span> para auxiliar na prática
                    profissional de pessoas interessadas no mercado esportivo — seja executivos das áreas
                    jurídica, financeira, de marketing ou de futebol, seja investidores.
                </p>
            </div>

            {/* ── CONTEÚDO (seção clara, como na FrontPage) ─────── */}
            <div className="bg-[#F5F0F0] w-full relative overflow-hidden">

                {/* Grid de fundo sutil */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{ backgroundImage: "linear-gradient(to right, #e5e5e5 1px, transparent 1px)", backgroundSize: "6rem 100%" }}
                />

                <div className="relative z-10 max-w-3xl mx-auto px-6 py-20 space-y-12">
                    {SECTIONS.map((s, idx) => (
                        <div key={s.tag}>
                            {idx > 0 && <div className="h-px bg-gray-200 mb-12" />}
                            <p className="text-[#8033D9] font-medium text-sm mb-4 uppercase tracking-wide">
                                {s.tag}
                            </p>
                            <div className="space-y-4">
                                {s.paragraphs.map((p, i) => (
                                    <p key={i} className="text-[#0A0A0AB2] text-base lg:text-lg leading-relaxed">
                                        {p}
                                    </p>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
