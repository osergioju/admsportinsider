import { Link } from "react-router-dom";
import Blackout from "../assets/img/blackout.png";
import Tela from "../assets/img/tela.png";
import Icone from "../assets/img/icone.png";
import Icone2 from "../assets/img/icone2.png";
import Icone3 from "../assets/img/iconeMaior.png";
import SportinsiderIcon from "../assets/svg/brand-white.svg"
import banner1 from "../assets/img/banner1.png";
import banner2 from "../assets/img/banner2.png";
import banner3 from "../assets/img/banner3.png";
import backgroundFooter from "../assets/img/backgrandEnd.png";
import Time from "../assets/img/slide/time.png";
import Time1 from "../assets/img/slide/time1.png";
import Time2 from "../assets/img/slide/time2.png";
import Time3 from "../assets/img/slide/time3.png";
import Time4 from "../assets/img/slide/time4.png";
import Time5 from "../assets/img/slide/time5.png";
import videoTeste from "../assets/video/vd-x.mp4"

// Importa o redirect 
import { useRedirectIfAuthenticated } from "../services/checkUser";

// Swiper Imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';

import {
    ArrowUpRight,
    Database,
    DollarSign,
    Trophy,
    Users,
    Activity,
    BarChart3,
    Layers,
    Search,
    Check,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function FrontPage() {
    const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone;

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Sport Insider',
                    text: 'Acesse o app:',
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Cancelado ou erro:', err);
            }
        } else {
            alert('Compartilhamento não suportado nesse navegador');
        }
    };

    const { loadingAuth, user } = useRedirectIfAuthenticated();
    const [menuOpen, setMenuOpen] = useState(false);
    const [show, setShow] = useState(true);

    const leftPillStyle = "flex items-center justify-center gap-2 px-3 py-2 bg-white border border-[#E5E5E5] rounded-full text-[#404040] text-xs sm:text-sm font-medium shadow-sm z-20 relative whitespace-nowrap hover:scale-105 transition-transform cursor-default";
    const rightPillStyle = "flex items-center gap-3 px-4 py-3 bg-white border border-[#F0F0F0] rounded-2xl text-[#404040] text-sm font-medium shadow-sm z-20 relative w-full hover:border-purple-200 transition-colors cursor-default";
    const cardClass = "bg-[#FFF5F5] rounded-2xl p-5 sm:p-6 lg:p-8 flex flex-col justify-between h-full border border-pink-50 hover:shadow-lg transition-shadow duration-300 min-h-[300px]";
    const titleClass = "text-[#8033D9] font-medium text-sm lg:text-base mb-2 block";
    const descClass = "text-[#1B1917] font-medium text-lg sm:text-xl lg:text-2xl leading-tight";

    // ESTILO ORIGINAL DOS BOTÕES
    const primaryButtonClass = "bg-gradient-to-r from-[#904EDE] to-[#4E2A78] flex items-center justify-center border border-[#A572E1] text-[#ffffff] rounded-full hover:brightness-110 transition-all";
    const secondaryButtonClass = "flex items-center justify-center border border-[#A572E1] text-[#A572E1] rounded-full hover:bg-white/5 transition-colors";

    useEffect(() => {
        const dismissed = localStorage.getItem('pwa-banner-dismissed');
        if (dismissed) {
            setShow(false);
        }
    }, []);

    if (loadingAuth || user) return null;

    return (

        <div className="w-full bg-[#030015]">
            {isIOS && !isStandalone && show && (
                <div className="fixed bottom-6 left-4 right-4 z-50">
                    <div className="bg-gradient-to-r from-[#1C142F] to-[#3D315D] text-white rounded-2xl px-5 py-4 shadow-2xl backdrop-blur-xl border border-white/10">

                        <div className="flex items-center justify-between gap-4">

                            {/* Texto */}
                            <div className="flex-1">
                                <p className="text-sm font-semibold tracking-tight">
                                    Instale o app
                                </p>
                                <p className="text-xs text-white/70 mt-1 leading-relaxed">
                                    Use o menu de compartilhar do navegador e selecione “Adicionar à Tela de Início”.
                                </p>
                            </div>

                            {/* Ações */}
                            <div className="flex items-center gap-2">

                                <button
                                    onClick={handleShare}
                                    className="bg-[#7F33D9] hover:bg-[#6a28b8] transition-all px-4 py-2 rounded-full text-xs font-semibold shadow-lg shadow-purple-900/30"
                                >
                                    Compartilhar
                                </button>

                                <button
                                    onClick={() => setShow(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                                >
                                    <span className="text-white/60 text-sm">×</span>
                                </button>

                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- NAVBAR --- */}
            <div className="w-full flex justify-center pt-8 px-4 sm:px-6 lg:px-8 z-20">
                <div className="relative w-full max-w-[1740px] h-[68px] rounded-full flex justify-between items-center pl-4 lg:pl-12 pr-2 backdrop-blur-md border border-white/10 bg-gradient-to-l from-[#1C142F] via-[#3D315D] to-[#c53ed40] to-transparent">
                    <div className="flex items-center gap-3">
                        <Link to="/">
                            <img
                                src={SportinsiderIcon}
                                alt="Logo Sportinsider"
                                className="w-36 lg:w-44 xl:w-50 h-auto"
                            />
                        </Link>
                    </div>
                    <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 gap-10 text-[#C2B3E0] font-light">
                        <Link to="/dados"><div className="cursor-pointer hover:text-white transition-colors">METODOLOGIA</div></Link>
                        <Link to="/pricing"><div className="cursor-pointer hover:text-white transition-colors">PLANOS</div></Link>
                        <Link to="/dashboard-public"><div className="cursor-pointer hover:text-white transition-colors">TESTE GRÁTIS</div></Link>
                        <Link to="/register"><div className="cursor-pointer hover:text-white transition-colors">COMEÇAR AGORA</div></Link>
                    </div>
                    <div className="flex items-center">
                        <Link className="bg-gradient-to-r from-[#904EDE] to-[#4E2A78] mr-0 px-5 py-3 text-sm sm:px-5 sm:py-3 sm:text-sm sm:mr-0 flex items-center border border-[#A572E1] text-[#ffffff] rounded-full hover:brightness-110 transition-all lg:text-lg" to="/login">
                            Acessar <ArrowUpRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4"></ArrowUpRight>
                        </Link>
                        <div className="flex items-center lg:hidden">
                            <button className="ml-2 bg-gradient-to-r from-[#904EDE] to-[#4E2A78] mr-0 px-4 py-3 text-sm sm:px-5 sm:py-3 sm:text-sm sm:mr-0 flex items-center border border-[#A572E1] text-[#ffffff] rounded-full hover:brightness-110 transition-all lg:text-lg" onClick={() => setMenuOpen(!menuOpen)}>
                                ☰
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {menuOpen && (
                <div className="w-[90%] left-[5%] bg-gradient-to-r from-[#904EDE] to-[#4E2A78] absolute top-[120px] rounded-xl bg-[#1C142F] flex flex-col items-center gap-2 py-6 z-50">
                    <Link className="text-white font-light" to="/dados">METODOLOGIA</Link>
                    <Link className="text-white font-light" to="/pricing">PLANOS</Link>
                    <Link className="text-white font-light" to="/dashboard-public">TESTE GRÁTIS</Link>
                    <Link className="text-white font-light" to="/register">COMEÇAR AGORA</Link>
                </div>
            )}

            {/* --- HERO SECTION --- */}
            <div className="pt-20 pb-2 w-full relative ">
                <h1 className="font-medium text-center lg:text-4xl xl:text-6xl xl:mb-4 text-center text-2xl leading-none bg-gradient-to-r from-[#ffffff1f] to-[#ffffff] bg-clip-text text-transparent ">
                    O centro global de inteligência<br />
                    financeira do futebol
                </h1>
                <p className="font-light lg:text-xl text-[#ffffffa6] text-center">
                    Dados financeiros, operacionais e comerciais de clubes e ligas do mundo
                    inteiro — organizados, comparáveis e prontos para decisão.
                </p>
                <div className="flex mt-4 gap-2 lg:gap-5 lg:mt-8 items-center justify-center">
                    <Link className="lg:text-lg lg:font-light xl:text-xl bg-gradient-to-r from-[#904EDE] to-[#4E2A78] gap-4 mr-0 px-5 flex items-center py-3 border border-[#A572E1] text-[#ffffff] rounded-full hover:brightness-110 transition-all" to="/dashboard-public">Teste gratuito <ArrowUpRight className="w-3 lg:w-5 xl:w-6"></ArrowUpRight></Link>
                    <Link className="lg:text-lg lg:font-light xl:text-xl px-6 flex items-center gap-4 py-3 border border-[#A572E1] text-[#A572E1] rounded-full" to="/register">Cadastre-se <ArrowUpRight className="w-3 lg:w-5 xl:w-6"></ArrowUpRight></Link>
                </div>
            </div>

            <div className="w-full bg-white bg-gradient-home relative mt-10 lg:mt-20 px-4">
                <img className="hidden mx-auto w-full max-w-[600px] lg:max-w-[800px] lg:-mt-20" src={Blackout} alt="Blackout"></img>
                <img className="hidden mx-auto w-full max-w-[1200px] -mt-26" src={Tela} alt="Tela"></img>
                <video
                    src={videoTeste}
                    muted
                    autoPlay
                    loop
                    playsInline
                    className="w-full mx-auto overflow-hidden rounded-xl max-w-[1200px]"
                />
            </div>

            {/* --- SEÇÃO CINZA: DIAGRAMA + CARDS + COBERTURA GLOBAL --- */}
            <div className="py-20 bg-[#F5F0F0] w-full relative overflow-hidden">

                {/* Grid de fundo */}
                <div className="absolute inset-0 pointer-events-none opacity-30"
                    style={{ backgroundImage: 'linear-gradient(to right, #e5e5e5 1px, transparent 1px)', backgroundSize: '6rem 100%' }}>
                </div>

                <div className="container items-center mx-auto px-6 relative z-10">

                    {/*TEXTO E DIAGRAMA DE FLUXO */}
                    <div className="text-left flex flex-col items-start lg:max-w-4xl mb-16 mx-auto lg:mx-0">
                        <div className="lg:mb-6 mb-4 flex items-center gap-2 lg:gap-3 lg:px-5 py-2 px-3 border border-purple-200 bg-white/80  rounded-full shadow-sm">
                            <img src={Icone} className="h-5" alt="Icone" />
                            <span className="text-[#8033D9] font-medium text-sm lg:text-base">Informação existe. Inteligência, não.</span>
                        </div>

                        <h2 className="mb-4 text-3xl lg:text-5xl font-medium text-[#1B1917] leading-tight">
                            O futebol gera bilhões — mas os <br className="hidden lg:block" />
                            dados continuam fragmentados
                        </h2>
                        <p className="text-sm lg:text-lg text-[#0A0A0AB2] max-w-3xl">
                            O Sportinsider centraliza dados financeiros, operacionais e comerciais de clubes e ligas em um único ambiente visual, comparável e atualizado.
                        </p>
                    </div>

                    {/* DIAGRAMA*/}
                    <div className="w-full mb-12 sm:mb-20">

                        {/* ====== VERSÃO DESKTOP (Apenas LG+) ====== */}
                        <div className="hidden lg:flex flex-row items-center justify-center relative h-[360px]">
                            {/* Esquerda Desktop */}
                            <div className="relative w-[424px] h-[320px]">
                                <svg className="absolute top-0 right-0 w-full h-full pointer-events-none" viewBox="0 0 450 320" preserveAspectRatio="none">
                                    <path d="M260 50 C 350 50, 400 160, 450 160" stroke="#D1D1D1" strokeWidth="3.0" fill="none" />
                                    <path d="M150 110 C 250 110, 350 160, 450 160" stroke="#D1D1D1" strokeWidth="3.0" fill="none" />
                                    <path d="M270 160 L 450 160" stroke="#D1D1D1" strokeWidth="3.0" fill="none" />
                                    <path d="M150 210 C 250 210, 350 160, 450 160" stroke="#D1D1D1" strokeWidth="3.0" fill="none" />
                                    <path d="M260 270 C 350 270, 400 160, 450 160" stroke="#D1D1D1" strokeWidth="3.0" fill="none" />
                                </svg>
                                <div className="absolute top-[90px] left-[50px]"><div className={leftPillStyle}><Trophy size={16} /> Clubes</div></div>
                                <div className="absolute top-[190px] left-[50px]"><div className={leftPillStyle}><Users size={16} /> Ligas</div></div>
                                <div className="absolute top-[30px] right-[100px]"><div className={leftPillStyle}><DollarSign size={16} /> Patrocínios</div></div>
                                <div className="absolute top-[140px] right-[80px] z-20"><div className={leftPillStyle}><Activity size={16} /> Receitas</div></div>
                                <div className="absolute top-[250px] right-[100px]"><div className={leftPillStyle}><Database size={16} /> Despesas</div></div>
                            </div>

                            {/* Centro Desktop */}
                            <div className="relative z-20 shrink-0 mx-[-10px]">
                                <div className="w-32 h-32 bg-[#5E1E99] rounded-full flex items-center justify-center shadow-inner border-[6px] border-[#9d5ce6]/10">
                                    <img src={Icone2} alt="Core" />
                                </div>
                            </div>

                            {/* Direita Desktop */}
                            <div className="relative w-[400px] h-[360px] flex items-center">
                                <svg className="absolute top-0 left-0 w-[200px] h-full pointer-events-none" viewBox="0 0 120 360" preserveAspectRatio="none">
                                    <path d="M0 180 L 30 180" stroke="#8033D9" strokeWidth="4" fill="none" />
                                    <path d="M30 180 C 60 180, 60 52, 120 52" stroke="#8033D9" strokeWidth="2" fill="none" />
                                    <path d="M30 180 C 60 180, 60 116, 120 116" stroke="#8033D9" strokeWidth="2" fill="none" />
                                    <path d="M30 180 L 120 180" stroke="#8033D9" strokeWidth="2" fill="none" />
                                    <path d="M30 180 C 60 180, 60 244, 120 244" stroke="#8033D9" strokeWidth="2" fill="none" />
                                    <path d="M30 180 C 60 180, 60 308, 120 308" stroke="#8033D9" strokeWidth="2" fill="none" />
                                </svg>
                                <div className="flex flex-col gap-5 pl-[140px] z-10">
                                    <div className={rightPillStyle}><div className="text-[#8033D9]"><BarChart3 size={18} /></div>Comparativos inteligentes</div>
                                    <div className={rightPillStyle}><div className="text-[#8033D9]"><Layers size={18} /></div>Visão financeira centralizada</div>
                                    <div className={rightPillStyle}><div className="text-[#8033D9]"><Search size={18} /></div>Filtros avançados</div>
                                    <div className={rightPillStyle}><div className="text-[#8033D9]"><Trophy size={18} /></div>Benchmarking</div>
                                    <div className={rightPillStyle}><div className="text-[#8033D9]"><Check size={18} /></div>Redução de análise manual</div>
                                </div>
                            </div>
                        </div>

                        {/* ====== VERSÃO MOBILE/TABLET (Fluxo Vertical com Gradiente) - Até LG ====== */}
                        <div className="flex flex-col items-center w-full lg:hidden relative py-2">

                            {/* LINHA CONECTORA (ESPINHA DORSAL):
                           - top-6 e bottom-12: limitam a altura para não vazar
                           - bg-gradient-to-b: cria o degradê
                           - from-transparent: começo suave
                           - via-[#8033D9]/40: meio roxo visível
                           - to-transparent: fim suave (evita o corte brusco)
                        */}
                            <div className="absolute top-6 bottom-12 left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-b from-transparent via-[#8033D9]/40 to-transparent z-0 rounded-full"></div>

                            {/* 1. INPUTS (Topo) */}
                            <div className="grid grid-cols-2 gap-3 z-10 w-full max-w-sm mb-6 px-2">
                                <div className={leftPillStyle}><Trophy size={14} /> Clubes</div>
                                <div className={leftPillStyle}><Users size={14} /> Ligas</div>
                                <div className={leftPillStyle}><DollarSign size={14} /> Patrocínios</div>
                                <div className={leftPillStyle}><Activity size={14} /> Receitas</div>
                                <div className={`${leftPillStyle} col-span-2 w-max mx-auto px-6`}><Database size={14} /> Despesas</div>
                            </div>

                            {/* 2. CORE (Centro) - Integrado */}
                            <div className="relative z-20 my-2">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#9d5ce6] to-[#6a1cb8] p-1 shadow-xl flex items-center justify-center relative z-10">
                                    <div className="w-full h-full bg-[#5E1E99] rounded-full flex items-center justify-center shadow-inner border-[3px] sm:border-[4px] border-[#9d5ce6]/20">
                                        <img src={Icone2} alt="Core" className="w-1/2 h-1/2 object-contain" />
                                    </div>
                                </div>
                            </div>

                            {/* 3. OUTPUTS (Base) */}
                            <div className="flex flex-col gap-3 z-10 w-full max-w-sm px-2 mt-6">
                                <div className={rightPillStyle}><div className="text-[#8033D9] shrink-0"><BarChart3 size={18} /></div><span className="truncate">Comparativos inteligentes</span></div>
                                <div className={rightPillStyle}><div className="text-[#8033D9] shrink-0"><Layers size={18} /></div><span className="truncate">Visão financeira centralizada</span></div>
                                <div className={rightPillStyle}><div className="text-[#8033D9] shrink-0"><Search size={18} /></div><span className="truncate">Filtros avançados</span></div>
                                <div className={rightPillStyle}><div className="text-[#8033D9] shrink-0"><Trophy size={18} /></div><span className="truncate">Benchmarking</span></div>
                                <div className={rightPillStyle}><div className="text-[#8033D9] shrink-0"><Check size={18} /></div><span className="truncate">Redução de análise manual</span></div>
                            </div>

                        </div>

                    </div>

                    {/* GRID DE CARDS */}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* === CARD 1: RECEITAS */}
                        <div className={cardClass}>
                            <div className="mb-8">
                                <span className={titleClass}>Receitas e custos operacionais</span>
                                <h3 className={descClass}>
                                    Entenda de onde vem o dinheiro e para onde ele vai — por clube, liga e temporada.
                                </h3>
                            </div>
                            <div className="relative mt-auto flex flex-col items-center pb-4">
                                <div className="w-full bg-white rounded-xl border border-gray-100 p-4 shadow-sm z-30 relative flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-9 border border-gray-100 rounded flex items-center justify-center">
                                            <div className="w-5 h-px bg-gray-300"></div>
                                        </div>
                                        <span className="text-gray-900 font-medium text-sm lg:text-base">Direito de imagem</span>
                                    </div>
                                    <BarChart3 className="text-gray-400" size={18} />
                                </div>
                                <div className="w-[92%] bg-white/80 rounded-xl border border-gray-100 p-3 shadow-sm z-20 -mt-6 pt-8 opacity-70 flex items-center gap-4">
                                    <div className="w-10 h-6 border border-gray-200 rounded"></div>
                                    <div className="w-24 h-px bg-gray-300"></div>
                                </div>
                                <div className="w-[84%] bg-white/50 rounded-xl border border-gray-100 p-3 shadow-sm z-10 -mt-6 pt-8 opacity-40 flex items-center gap-4">
                                    <div className="w-10 h-4 border border-gray-200 rounded"></div>
                                    <div className="w-16 h-px bg-gray-300"></div>
                                </div>
                            </div>
                        </div>

                        {/* === CARD 2: DIREITOS DE TRANSMISSÃO === */}
                        <div className={cardClass}>
                            <div className="mb-8">
                                <span className={titleClass}>Direitos de transmissão</span>
                                <h3 className={descClass}>
                                    Compare contratos, distribuição e impacto financeiro entre mercados.
                                </h3>
                            </div>
                            <div className="relative h-48 mt-8 mx-2">
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                                    <div className="w-full h-[1px] bg-gray-200"></div>
                                    <div className="w-full h-[1px] bg-gray-200"></div>
                                    <div className="w-full h-[1px] bg-gray-200"></div>
                                    <div className="w-full h-[1px] bg-gray-200"></div>
                                    <div className="w-full h-[1px] bg-gray-200"></div>
                                </div>
                                <div className="absolute inset-0 flex items-end justify-between px-2 gap-3">
                                    <div className="flex-1 h-[35%] bg-gradient-to-b from-[#C4A6ED] to-[#F3EBFD] rounded-t-md opacity-90"></div>
                                    <div className="flex-1 h-[60%] bg-gradient-to-b from-[#9F6CDF] to-[#EADBF9] rounded-t-md opacity-95"></div>
                                    <div className="flex-1 h-[100%] bg-gradient-to-b from-[#9A5CE5] to-[#E5D4F5] rounded-t-md relative z-10">
                                        <div className="absolute top-12 -right-[150%] z-50">
                                            <div className="bg-white px-2 py-1.5 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100 flex items-center gap-2 min-w-[120px] relative">
                                                <div className="w-2 h-2 bg-[#86D29A] rounded-[2px]"></div>
                                                <span className="text-[10px] font-semibold text-gray-600">Clube</span>
                                                <div className="bg-gray-100 px-1.5 py-0.5 rounded ml-auto">
                                                    <span className="text-[10px] font-bold text-gray-800">R$90</span>
                                                </div>
                                                <svg className="absolute -bottom-4 -right-3 w-5 h-5 text-[#8B5CF6] drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 h-[30%] bg-gradient-to-b from-[#9F6CDF] to-[#EADBF9] rounded-t-md opacity-90"></div>
                                    <div className="flex-1 h-[50%] bg-gradient-to-b from-[#C4A6ED] to-[#F3EBFD] rounded-t-md opacity-90"></div>
                                    <div className="flex-1 h-[20%] bg-gradient-to-b from-[#D6BDF5] to-[#F7F2FD] rounded-t-md opacity-70"></div>
                                </div>
                            </div>
                        </div>

                        {/* === CARD 3: COMPARATIVOS INTELIGENTES  === */}
                        <div className={`overflow-hidden bg-[#FFF5F5] rounded-2xl flex flex-col justify-between h-full border border-pink-50 hover:shadow-lg transition-shadow duration-300 min-h-[300px] md:col-span-2 lg:col-span-1`}>
                            <div className="mb-6 p-5 sm:p-6 lg:p-8 ">
                                <span className={titleClass}>Comparativos inteligentes</span>
                                <h3 className={descClass}>
                                    Coloque clubes e ligas lado a lado e descubra vantagens competitivas.
                                </h3>
                            </div>


                            <div className="mt-auto w-[calc(100%_+_30px)] -left-[15px] pb-2 relative">
                                <Swiper
                                    modules={[Autoplay]}
                                    slidesPerView="auto"
                                    spaceBetween={20}
                                    loop={true}
                                    speed={16000} // quanto maior, mais suave/lento
                                    autoplay={{
                                        delay: 0,
                                        disableOnInteraction: false,
                                    }}
                                    allowTouchMove={false} // impede arrastar
                                    className="w-full "
                                >
                                    {/* Slide 1 */}
                                    <SwiperSlide>
                                        <div className="flex items-end gap-3 h-[200px] lg:h-[250px] pb-3">
                                            {/* Brasileirão */}
                                            <div className="flex-1 h-full rounded-[14.5px] border border-[#F0F0F0] bg-gradient-to-b from-white to-[#FEF7FF] relative flex flex-col items-center justify-center overflow-hidden group hover:-translate-y-1 transition-transform">
                                                <div className="w-full">
                                                    <svg className="w-full max-w-[100px] lg:max-w-[120px] mx-auto" viewBox="0 0 155 155" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M149.986 53.3283C142.348 30.4096 124.178 12.3528 101.209 4.85868C85.7698 -0.179185 69.0088 -0.152809 53.5842 4.92901C30.7434 12.4539 12.679 30.4326 5.04418 53.2349C-0.257442 69.0716 -0.216778 86.3239 5.16947 102.134C12.8351 124.638 30.6654 142.39 53.2127 149.948C69.189 155.303 86.6204 155.238 102.636 149.659C124.729 141.961 142.125 124.466 149.731 102.423C155.205 86.5591 155.289 69.2354 149.986 53.3272V53.3283ZM131.911 128.291C103.253 158.982 54.9074 159.909 25.0989 130.36C-3.56766 101.943 -4.34906 55.8396 23.3042 26.4795C38.4134 10.4384 59.8178 1.90014 81.876 3.18708C121.292 5.48841 152.17 38.3411 151.937 77.9297C151.827 96.6612 144.679 114.617 131.911 128.291Z" stroke="#EAEDF4" strokeWidth="2.2" strokeMiterlimit="10" />
                                                        <path d="M114.965 49.34C113.801 28.8193 96.1427 12.8485 75.3835 14.0211C54.5935 15.196 38.8304 33.0966 40.0273 53.6492C41.2263 74.2491 58.9039 90.055 79.485 88.9615C100.206 87.8603 116.141 70.0684 114.965 49.34ZM106.939 29.7776C96.3175 27.351 85.834 22.1274 78.0101 14.9454C89.5322 15.0762 100.179 20.6097 106.939 29.7776ZM77.0068 14.9509C68.6455 22.1516 58.7863 27.2609 48.0149 29.8216C54.8199 20.6009 65.4792 15.0641 77.0068 14.9509ZM45.4509 69.3629C38.6392 57.0287 39.4338 42.0789 47.4599 30.5722C47.4785 36.1772 47.9896 41.4964 49.2644 46.8639C53.1659 63.2974 62.7933 78.2627 76.7891 88.1801C63.6637 88.068 51.613 80.5233 45.4498 69.3629H45.4509ZM72.6953 83.9665C66.6002 78.677 61.4415 72.439 57.3894 65.4394C51.2405 54.8197 48.1347 42.7965 48.2973 30.4942C58.7874 28.0346 69.4928 22.7912 77.5046 15.563C85.5548 22.8715 96.2163 28.006 106.769 30.492C106.834 39.2863 105.349 47.9289 102.221 56.1143C97.2978 68.7628 88.8112 79.7342 77.5848 87.7087C75.7803 86.5613 74.2647 85.3282 72.6953 83.9665ZM109.567 69.3167C103.368 80.5706 91.3203 88.0516 78.1508 88.1988C92.1324 78.5363 101.9 63.6953 105.779 47.1068C107.058 41.636 107.559 36.2244 107.544 30.6008C115.573 42.0964 116.329 57.0419 109.567 69.3167Z" stroke="#EAEDF4" strokeWidth="2.19802" strokeMiterlimit="10" />
                                                    </svg>
                                                </div>
                                                <div className="flex items-center justify-center mt-4 w-full">
                                                    <div className="bg-white py-2 px-4 lg:px-6 lg:py-3 lg:rounded-xl border border-[#00000018] rounded-lg flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-[1px] bg-[#86D29A] rounded-[1px]"></div>
                                                        <span className="text-xs font-[400] lg:text-sm  text-[#0A0A0A] whitespace-nowrap">Brasileirao Serie A</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-1 h-full rounded-[14.5px] border border-[#F0F0F0] bg-gradient-to-b from-white to-[#FEF7FF] relative flex flex-col items-center justify-center overflow-hidden group hover:-translate-y-1 transition-transform">
                                                <div className="w-full">
                                                    <svg className="w-full max-w-[100px] lg:max-w-[120px] mx-auto" viewBox="0 0 152 152" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M151.445 72.7923V71.5293C150.998 70.4741 151.032 69.1921 150.919 68.081C146.86 28.1396 112.315 -1.49633 72.6584 0.0584542C33.3764 1.59759 1.60337 33.3561 0.0765332 72.6448C-0.00282666 74.6824 -0.035238 76.5871 0.0519461 78.5476C1.82134 118.173 32.5783 148.304 71.2277 151.43H72.807C72.7824 151.185 73.0943 151.107 73.4218 151.107H77.5597C77.8883 151.107 78.1979 151.184 78.1756 151.43H79.755C79.7784 151.136 80.2993 151.013 80.657 151.086C81.8641 151.331 82.7728 150.937 83.7833 150.828C119.012 147.011 147.025 118.998 150.842 83.7697C150.842 83.7663 150.842 83.763 150.843 83.7585C150.845 83.7529 150.845 83.7451 150.846 83.7362C150.847 83.7261 150.848 83.7116 150.85 83.6937C150.851 83.6847 150.852 83.6747 150.854 83.6635C150.854 83.6557 150.856 83.6456 150.857 83.6322C150.859 83.611 150.862 83.5875 150.865 83.5618C150.866 83.5473 150.868 83.5305 150.87 83.5093C150.873 83.4847 150.876 83.4578 150.879 83.4299C150.88 83.4187 150.881 83.4053 150.884 83.3874C150.887 83.3561 150.89 83.3237 150.894 83.2891C150.902 83.2265 150.909 83.1549 150.918 83.0767C150.923 83.0309 150.928 82.9839 150.934 82.9347C150.957 82.7313 150.984 82.4999 151.013 82.2551C151.023 82.1657 151.035 82.0741 151.047 81.9813C151.061 81.8583 151.077 81.7309 151.094 81.6024C151.099 81.5532 151.106 81.504 151.113 81.4548C151.135 81.2794 151.159 81.1039 151.182 80.9373C151.186 80.9094 151.19 80.8826 151.193 80.8557C151.201 80.8032 151.208 80.7507 151.216 80.6981C151.22 80.6724 151.224 80.6478 151.227 80.6232C151.245 80.5036 151.263 80.3919 151.281 80.2913C151.287 80.2544 151.293 80.2186 151.3 80.1851C151.31 80.1292 151.32 80.0778 151.33 80.0331C151.333 80.0141 151.338 79.9951 151.342 79.9783C151.36 79.9045 151.376 79.8531 151.39 79.8319C151.395 79.8241 151.399 79.8207 151.403 79.8207C151.406 79.8207 151.408 79.8207 151.41 79.8241C151.412 79.8263 151.415 79.8296 151.417 79.8341C151.417 79.8341 151.418 79.8352 151.418 79.8363C151.419 79.8386 151.42 79.8397 151.42 79.8419C151.421 79.8475 151.424 79.8531 151.425 79.8598C151.427 79.8665 151.428 79.8732 151.429 79.8811C151.433 79.8978 151.435 79.9191 151.437 79.9448C151.438 79.9537 151.439 79.9638 151.439 79.9727C151.441 79.9973 151.444 80.0241 151.445 80.0554V78.4772C151.2 78.5018 151.122 78.1888 151.122 77.8613V73.4082C151.122 73.0796 151.2 72.77 151.445 72.7923ZM125.547 128.258C97.4444 154.942 53.3236 154.686 25.5287 128.054C-4.33074 99.4438 -4.30949 51.8089 25.5063 23.2449C54.3911 -4.42705 100.324 -3.44456 128.03 25.4804C155.734 54.4043 154.778 100.502 125.547 128.258Z" fill="#EAEDF4" />
                                                        <path d="M151.41 79.824C151.41 79.824 151.418 79.8318 151.42 79.8419C151.42 79.8385 151.418 79.8363 151.417 79.834C151.415 79.8296 151.412 79.8262 151.41 79.824Z" fill="#EAEDF4" />
                                                        <path d="M151.444 78.477C151.2 78.5016 151.121 78.1886 151.121 77.8611V73.408C151.121 73.0805 151.199 72.7698 151.444 72.7922V78.477Z" fill="#EAEDF4" />
                                                        <path d="M78.1746 151.43H72.8061C72.7815 151.185 73.0933 151.107 73.4219 151.107H77.5598C77.8873 151.107 78.1981 151.184 78.1757 151.43H78.1746Z" fill="#EAEDF4" />
                                                        <path d="M125.311 25.0177C97.5976 -2.16924 53.2097 -2.03623 25.6674 25.334C-1.93757 52.7668 -2.27959 97.2731 24.8805 125.14C52.3043 153.278 97.4936 153.801 125.545 126.01C153.733 98.0857 153.493 52.6651 125.311 25.0177ZM82.0486 143.1C44.8356 146.627 11.7414 119.312 8.17356 82.0405C4.64372 45.1628 31.6663 11.8596 69.0291 8.19895C106.552 4.52269 139.621 32.1545 143.12 69.2311C146.634 106.473 119.278 139.571 82.0486 143.1Z" fill="#EAEDF4" />
                                                        <path d="M111.616 46.0714L110.352 40.6392L105.284 39.7438C88.1718 25.5854 63.3511 25.4926 46.1468 39.6365L40.6486 40.6738L39.2749 46.5733C28.4797 60.1729 25.8978 78.4759 33.2369 94.8475C39.5845 109.006 53.3585 119.696 69.6116 121.849C71.6258 122.116 73.4298 123.711 75.7905 123.572C77.8964 123.448 79.5629 122.117 81.3613 121.89C97.9084 119.803 111.931 108.924 118.261 94.3904C125.445 77.9003 122.627 59.5637 111.616 46.0714ZM99.5828 38.7893C97.9889 39.1771 96.6443 38.5054 95.2583 38.4238C81.9225 37.638 69.0248 37.6224 56.0388 38.4204C54.607 38.6306 53.4412 39.0084 51.7467 38.7826C66.1187 29.3097 85.089 29.2728 99.5828 38.7893ZM38.3517 52.3844C38.6747 54.1147 38.1315 55.3263 38.0499 56.6598C37.4418 66.6301 37.2171 76.2315 38.8043 85.9592C40.2351 94.7313 44.6826 102.102 50.0746 108.8C50.3317 109.12 50.6893 109.066 50.7162 109.409C50.7173 109.42 50.7184 109.428 50.7217 109.437C50.7229 109.444 50.7251 109.452 50.7273 109.459C50.7307 109.469 50.7352 109.479 50.7407 109.489C50.7452 109.499 50.7508 109.508 50.7575 109.517C50.7642 109.527 50.772 109.537 50.781 109.546C50.7933 109.56 50.8067 109.575 50.8223 109.587C50.8346 109.598 50.848 109.608 50.8603 109.617C50.8737 109.627 50.8883 109.638 50.9006 109.646H50.9028C50.9475 109.678 50.9878 109.703 51.0068 109.73C51.0112 109.735 51.0135 109.74 51.0157 109.746C51.0202 109.754 51.0202 109.764 51.0179 109.773C52.7124 111.807 55.2788 112.764 56.5742 115.212C32.9094 103.791 24.5397 74.4878 38.3517 52.3844ZM75.605 121.002C67.565 118.47 60.4081 114.456 54.2538 108.716C48.3018 102.647 43.386 95.4835 42.0033 86.8724C39.6617 72.2892 40.9124 57.3751 44.212 43.0781C54.8049 41.0874 65.0736 40.5218 75.396 40.5106C86.0592 40.4994 96.3615 41.0974 106.879 43.0904C110.128 57.6188 111.469 72.5821 108.972 87.21C106.214 103.364 90.633 116.608 75.605 121.002ZM94.0388 115.494C95.6159 113.39 97.5977 111.674 99.5605 110.383C99.6298 109.985 99.9014 109.782 100.266 109.376C106.314 102.649 110.88 94.6072 112.306 85.5188C113.863 75.6011 113.57 65.8219 112.918 56.0283C112.834 54.7652 112.312 53.5525 112.665 51.9641C127.013 74.2766 118.36 104.367 94.0388 115.494Z" fill="#EAEDF4" />
                                                        <path d="M75.548 99.0379L75.5424 96.8494L75.5089 83.783C74.3196 83.8333 74.0681 85.6284 73.2465 86.0743C72.2015 86.641 71.1362 86.7048 70.4645 87.856C69.8497 88.9089 68.6548 89.8948 67.4354 90.1161C66.0505 90.3654 65.6436 91.3691 64.7651 92.2286C64.1235 92.8557 62.4055 92.5718 61.9897 93.5398C61.489 94.7056 63.2986 95.5573 63.4227 96.5286C63.5847 97.7972 63.4227 98.868 64.3795 99.9254C66.4831 102.25 64.4018 103.501 66.6026 106.167C67.2118 106.905 66.3523 108.934 67.2219 109.454C67.4454 109.587 67.8042 109.648 68.191 109.524L70.3337 108.839C72.6463 110.158 73.7361 108.886 75.5737 108.798L75.548 99.0379ZM76.3013 45.8367C75.9727 45.925 75.6765 46.011 75.4105 46.0949L75.4127 47.0259C75.605 47.0148 75.7346 47.0807 75.7413 47.2741C75.9056 48.1213 75.6195 48.6221 76.0364 49.1754C76.6981 48.0733 76.4343 46.9354 76.3013 45.8367ZM79.4131 48.6824C78.2954 50.4418 77.0927 51.7149 75.4284 52.789L75.4317 54.1437C76.1996 53.8855 76.9943 53.6978 77.8863 53.7849C78.6229 53.8565 80.1285 53.6978 80.3912 52.9377C79.9541 51.5226 79.4433 50.3557 79.4131 48.6824ZM80.6259 54.3595C79.3818 57.0711 77.2928 58.4325 75.4451 59.5771L75.4496 60.9888C76.0208 60.7753 76.6087 60.6144 77.248 60.5227L82.7742 59.7291C81.491 57.9217 81.0897 56.4463 80.6259 54.3595ZM93.6074 57.8446C92.2962 61.0156 90.7761 63.8279 88.4009 66.2579C87.7425 67.0481 87.3592 67.9199 86.7478 68.7404L86.4527 57.6501L86.4024 51.2678L81.9314 53.0349C83.399 53.7782 84.3278 52.7756 85.8334 52.4146L85.7038 70.0738C83.4191 67.5108 82.5909 64.5321 82.5462 60.9776C81.405 64.7176 79.0052 67.2571 75.5591 68.9259C75.5301 68.9404 75.4999 68.955 75.4697 68.9695L75.4742 70.7109C75.6665 71.4252 75.3624 72.2054 75.9425 73.018C76.6646 72.1841 76.308 71.2989 76.5405 70.2918C79.6959 69.8738 82.6702 70.3555 85.6244 71.0284C85.7798 71.4654 85.7854 71.708 85.9039 71.8443C85.9966 71.9516 86.4527 71.8879 86.4885 71.756C86.5209 71.6387 86.456 71.006 86.598 70.9535L95.6417 67.6595C93.5794 64.7165 93.5124 61.5767 93.6074 57.8446Z" fill="#EAEDF4" />
                                                        <path d="M50.9002 109.646C50.8879 109.637 50.8734 109.627 50.86 109.617C50.8477 109.608 50.8343 109.598 50.822 109.587C50.8064 109.575 50.7929 109.56 50.7806 109.546C50.7717 109.537 50.7639 109.527 50.7572 109.517C50.7505 109.508 50.7449 109.499 50.7404 109.489C50.7348 109.479 50.7303 109.469 50.727 109.459C50.7248 109.452 50.7225 109.444 50.7214 109.437C50.718 109.428 50.7169 109.419 50.7158 109.409C50.7728 109.492 50.8343 109.57 50.9002 109.646Z" fill="#EAEDF4" />
                                                        <path d="M50.7158 109.409C50.7728 109.492 50.8343 109.57 50.9002 109.646C50.8879 109.637 50.8734 109.627 50.86 109.617C50.8477 109.608 50.8343 109.598 50.822 109.587C50.8064 109.575 50.7929 109.56 50.7806 109.546C50.7717 109.537 50.7639 109.527 50.7572 109.517C50.7505 109.508 50.7449 109.499 50.7404 109.489C50.7348 109.479 50.7303 109.469 50.727 109.459C50.7248 109.452 50.7225 109.444 50.7214 109.437C50.718 109.428 50.7169 109.419 50.7158 109.409Z" fill="#EAEDF4" />
                                                        <path d="M51.018 109.773C50.9777 109.733 50.9386 109.69 50.9028 109.648C50.9475 109.678 50.9878 109.704 51.0068 109.73C51.0113 109.735 51.0135 109.74 51.0157 109.746C51.0202 109.754 51.0202 109.764 51.018 109.773Z" fill="#EAEDF4" />
                                                        <path d="M95.6414 67.6595L86.5977 70.9535C86.4558 71.0061 86.5206 71.6387 86.4882 71.7561C86.4524 71.888 85.9964 71.9517 85.9036 71.8444C85.7851 71.708 85.7795 71.4655 85.6242 71.0284C82.67 70.3555 79.6957 69.8738 76.5403 70.2918C76.3078 71.2989 76.6643 72.1842 75.9423 73.018C75.3622 72.2054 75.6662 71.4252 75.4739 70.7121C75.4605 70.6629 75.446 70.616 75.4281 70.569L72.6572 71.7147C72.9568 70.2169 74.2947 69.5385 75.4695 68.9695C75.4996 68.955 75.5298 68.9405 75.5589 68.9259C79.0049 67.2572 81.4047 64.7176 82.5459 60.9777C82.5906 64.5321 83.4189 67.5109 85.7035 70.0739L85.8332 52.4146C84.3276 52.7757 83.3987 53.7783 81.9311 53.035L86.4021 51.2678L86.4524 57.6501L86.7475 68.7404C87.3589 67.92 87.7423 67.0481 88.4006 66.2579C90.7758 63.8279 92.296 61.0157 93.6071 57.8446C93.5121 61.5768 93.5792 64.7165 95.6414 67.6595Z" fill="#EAEDF4" />
                                                        <path d="M71.3001 70.2684C68.9238 70.1879 67.0113 69.9879 64.8619 70.1924C64.7982 70.8876 64.8753 71.4678 64.4092 72.4681C64.1074 71.8377 64.1096 71.1168 63.9163 70.4204C62.803 70.3019 62.2262 70.9894 60.9028 71.252C61.4505 68.1402 66.7565 69.0937 68.9338 62.8589C69.2222 65.7471 69.6123 68.0262 71.3001 70.2684Z" fill="#EAEDF4" />
                                                        <path d="M82.7738 59.7293L77.2477 60.5229C76.6083 60.6145 76.0204 60.7755 75.4492 60.989C74.2946 61.4171 73.2093 62.0553 71.9082 62.755C72.4537 61.3791 73.8609 60.5586 75.4448 59.5772C77.2924 58.4327 79.3814 57.0713 80.6255 54.3596C81.0894 56.4464 81.4906 57.9219 82.7738 59.7293Z" fill="#EAEDF4" />
                                                        <path d="M68.8143 61.4125C67.4048 63.078 64.236 61.3913 59.983 64.3779C59.5448 62.347 65.4778 60.3015 67.4026 56.6118C67.6116 58.4572 67.9279 59.9796 68.8143 61.4125Z" fill="#EAEDF4" />
                                                        <path d="M80.3911 52.9376C80.1284 53.6977 78.6228 53.8564 77.8862 53.7849C76.9942 53.6977 76.1995 53.8855 75.4316 54.1437C74.42 54.4812 73.4543 54.9373 72.3701 55.0412C73.1347 53.8117 74.3116 53.492 75.293 52.875C75.3388 52.846 75.3835 52.818 75.4283 52.789C77.0926 51.7148 78.2953 50.4417 79.413 48.6824C79.4432 50.3556 79.954 51.5226 80.3911 52.9376Z" fill="#EAEDF4" />
                                                        <path d="M56.9921 69.3082C57.0458 69.9308 55.4675 69.5306 55.0506 69.2892C53.0275 68.1223 56.2477 62.3111 57.6985 61.4426C57.2402 64.313 56.678 66.3875 56.9921 69.3082Z" fill="#EAEDF4" />
                                                        <path d="M76.0362 49.1754C75.6193 48.6221 75.9054 48.1213 75.7411 47.2741C75.7344 47.0807 75.6048 47.0148 75.4125 47.0259C74.7363 47.064 73.281 48.0442 73.614 47.7279C73.4665 47.8665 71.9475 47.1802 75.4103 46.0949C75.6763 46.011 75.9725 45.925 76.3011 45.8367C76.4341 46.9354 76.6979 48.0733 76.0362 49.1754Z" fill="#EAEDF4" />
                                                        <path d="M64.9282 56.3682C64.6376 56.6141 64.765 57.0455 64.3258 57.2612C64.2062 56.2553 64.29 55.332 63.9781 54.3875C63.094 54.2903 62.6033 55.0045 61.6152 54.7586C62.3317 53.7649 63.3511 53.3737 64.5605 53.1982C64.727 54.3607 64.6723 55.2873 64.9282 56.3682Z" fill="#EAEDF4" />
                                                        <path d="M58.0058 61.1074C58.0058 61.2181 57.9163 61.3075 57.8057 61.3075C57.695 61.3075 57.6045 61.2181 57.6045 61.1074C57.6045 60.9968 57.695 60.9062 57.8057 60.9062C57.9163 60.9062 58.0058 60.9968 58.0058 61.1074Z" fill="#EAEDF4" />
                                                        <path d="M71.8592 55.8965C71.8592 55.9837 71.7887 56.0541 71.7016 56.0541C71.6144 56.0541 71.5439 55.9837 71.5439 55.8965C71.5439 55.8093 71.6144 55.7378 71.7016 55.7378C71.7887 55.7378 71.8592 55.8093 71.8592 55.8965Z" fill="#EAEDF4" />
                                                        <path d="M72.1757 55.2649C72.1757 55.3521 72.1042 55.4225 72.017 55.4225C71.9298 55.4225 71.8594 55.3521 71.8594 55.2649C71.8594 55.1777 71.9298 55.1062 72.017 55.1062C72.1042 55.1062 72.1757 55.1777 72.1757 55.2649Z" fill="#EAEDF4" />
                                                        <path d="M88.9698 93.4548C88.4568 92.5405 86.6885 92.8646 86.1196 92.0263C84.0998 89.0565 82.0611 90.5319 80.6963 87.9533C80.029 86.6913 78.9146 86.6343 77.8047 86.0453C76.9932 85.6149 76.7562 83.8456 75.6284 83.7841C75.5871 83.7818 75.548 83.7818 75.5089 83.783C74.3196 83.8333 74.0681 85.6284 73.2465 86.0743C72.2015 86.641 71.1362 86.7047 70.4645 87.856C69.8497 88.9089 68.6548 89.8948 67.4354 90.1161C66.0505 90.3654 65.6436 91.3691 64.7651 92.2286C64.1235 92.8557 62.4055 92.5718 61.9897 93.5397C61.489 94.7056 63.2986 95.5573 63.4227 96.5286C63.5847 97.7972 63.4227 98.868 64.3795 99.9254C66.4831 102.25 64.4018 103.501 66.6026 106.167C67.2118 106.905 66.3523 108.934 67.2219 109.454C67.4454 109.587 67.8042 109.648 68.191 109.523L70.3337 108.839C72.6463 110.158 73.7361 108.886 75.5737 108.798C76.1828 108.77 76.8725 108.871 77.7164 109.237C78.6721 109.652 79.5305 109.356 80.6147 109.046C81.6889 108.739 83.2336 110.11 84.0082 109.383C84.7515 108.684 84.0149 106.919 84.6296 106.111C87.2999 102.601 83.9277 103.897 87.4307 98.8043C87.9695 98.0208 87.339 96.865 87.8163 96.0334C88.2455 95.2857 89.5097 94.4183 88.9698 93.4548ZM76.2812 98.8312C76.2555 98.8479 76.2309 98.8624 76.2052 98.877C76.2019 98.8792 76.1985 98.8803 76.1963 98.8826C76.1728 98.8949 76.1504 98.906 76.1269 98.9172C76.0398 98.9597 75.9504 98.9899 75.8609 99.01C75.7559 99.0335 75.6508 99.0435 75.548 99.0379C75.5278 99.0379 75.5077 99.0357 75.4876 99.0335C75.4664 99.0312 75.4463 99.029 75.4273 99.0256C75.4094 99.0223 75.3915 99.0189 75.3747 99.0156C75.3602 99.0133 75.3457 99.01 75.3322 99.0055C75.2775 98.9932 75.2238 98.9742 75.1724 98.9519C75.1579 98.9452 75.1422 98.9385 75.1277 98.9306C75.083 98.9094 75.0394 98.8837 74.998 98.8546C74.9802 98.8435 74.9634 98.83 74.9466 98.8166C74.912 98.7898 74.8795 98.7596 74.8483 98.7283C74.836 98.716 74.8237 98.7037 74.8114 98.6892C74.7946 98.6702 74.779 98.6512 74.7633 98.6311C74.7555 98.621 74.7488 98.6121 74.741 98.6009C74.7331 98.5908 74.7253 98.5808 74.7186 98.5696C74.4246 98.1348 74.4347 97.2719 75.1277 96.9545C75.1679 96.9366 75.2071 96.9209 75.2473 96.9075C75.2663 96.8997 75.2864 96.8941 75.3065 96.8885C75.3255 96.8829 75.3457 96.8785 75.3647 96.874C75.3848 96.8695 75.4049 96.865 75.4239 96.8628C75.463 96.8561 75.5032 96.8516 75.5424 96.8494C76.0062 96.8259 76.4097 97.1154 76.6143 97.5111C76.8423 97.9537 76.6422 98.5975 76.2812 98.8312Z" fill="#EAEDF4" />
                                                        <path d="M75.1275 96.9544C75.7534 96.6672 76.3503 97.0003 76.6141 97.5122C76.8421 97.9548 76.642 98.5987 76.281 98.8323C75.7344 99.1855 75.0649 99.0849 74.7184 98.5707C74.4255 98.1359 74.4345 97.273 75.1275 96.9544Z" fill="#EAEDF4" />
                                                    </svg>
                                                </div>
                                                <div className="flex items-center justify-center mt-4 w-full">
                                                    <div className="bg-white py-2 px-4 lg:px-6 lg:py-3 lg:rounded-xl border border-[#00000018] rounded-lg flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-[1px] bg-[#FFBFD1] rounded-[1px]"></div>
                                                        <span className="text-xs font-[400] lg:text-sm  text-[#0A0A0A] whitespace-nowrap">Premier League</span>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </SwiperSlide>

                                    <SwiperSlide>
                                        <div className="flex items-end gap-3 h-[200px] lg:h-[250px] pb-3">
                                            {/* Brasileirão */}
                                            <div className="flex-1 h-full rounded-[14.5px] border border-[#F0F0F0] bg-gradient-to-b from-white to-[#FEF7FF] relative flex flex-col items-center justify-center overflow-hidden group hover:-translate-y-1 transition-transform">
                                                <div className="w-full">
                                                    <svg className="w-full max-w-[100px] lg:max-w-[120px] mx-auto" viewBox="0 0 155 155" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M149.986 53.3283C142.348 30.4096 124.178 12.3528 101.209 4.85868C85.7698 -0.179185 69.0088 -0.152809 53.5842 4.92901C30.7434 12.4539 12.679 30.4326 5.04418 53.2349C-0.257442 69.0716 -0.216778 86.3239 5.16947 102.134C12.8351 124.638 30.6654 142.39 53.2127 149.948C69.189 155.303 86.6204 155.238 102.636 149.659C124.729 141.961 142.125 124.466 149.731 102.423C155.205 86.5591 155.289 69.2354 149.986 53.3272V53.3283ZM131.911 128.291C103.253 158.982 54.9074 159.909 25.0989 130.36C-3.56766 101.943 -4.34906 55.8396 23.3042 26.4795C38.4134 10.4384 59.8178 1.90014 81.876 3.18708C121.292 5.48841 152.17 38.3411 151.937 77.9297C151.827 96.6612 144.679 114.617 131.911 128.291Z" stroke="#EAEDF4" strokeWidth="2.2" strokeMiterlimit="10" />
                                                        <path d="M114.965 49.34C113.801 28.8193 96.1427 12.8485 75.3835 14.0211C54.5935 15.196 38.8304 33.0966 40.0273 53.6492C41.2263 74.2491 58.9039 90.055 79.485 88.9615C100.206 87.8603 116.141 70.0684 114.965 49.34ZM106.939 29.7776C96.3175 27.351 85.834 22.1274 78.0101 14.9454C89.5322 15.0762 100.179 20.6097 106.939 29.7776ZM77.0068 14.9509C68.6455 22.1516 58.7863 27.2609 48.0149 29.8216C54.8199 20.6009 65.4792 15.0641 77.0068 14.9509ZM45.4509 69.3629C38.6392 57.0287 39.4338 42.0789 47.4599 30.5722C47.4785 36.1772 47.9896 41.4964 49.2644 46.8639C53.1659 63.2974 62.7933 78.2627 76.7891 88.1801C63.6637 88.068 51.613 80.5233 45.4498 69.3629H45.4509ZM72.6953 83.9665C66.6002 78.677 61.4415 72.439 57.3894 65.4394C51.2405 54.8197 48.1347 42.7965 48.2973 30.4942C58.7874 28.0346 69.4928 22.7912 77.5046 15.563C85.5548 22.8715 96.2163 28.006 106.769 30.492C106.834 39.2863 105.349 47.9289 102.221 56.1143C97.2978 68.7628 88.8112 79.7342 77.5848 87.7087C75.7803 86.5613 74.2647 85.3282 72.6953 83.9665ZM109.567 69.3167C103.368 80.5706 91.3203 88.0516 78.1508 88.1988C92.1324 78.5363 101.9 63.6953 105.779 47.1068C107.058 41.636 107.559 36.2244 107.544 30.6008C115.573 42.0964 116.329 57.0419 109.567 69.3167Z" stroke="#EAEDF4" strokeWidth="2.19802" strokeMiterlimit="10" />
                                                    </svg>
                                                </div>
                                                <div className="flex items-center justify-center mt-4 w-full">
                                                    <div className="bg-white py-2 px-4 lg:px-6 lg:py-3 lg:rounded-xl border border-[#00000018] rounded-lg flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-[1px] bg-[#86D29A] rounded-[1px]"></div>
                                                        <span className="text-xs font-[400] lg:text-sm  text-[#0A0A0A] whitespace-nowrap">Brasileirao Serie A</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-1 h-full rounded-[14.5px] border border-[#F0F0F0] bg-gradient-to-b from-white to-[#FEF7FF] relative flex flex-col items-center justify-center overflow-hidden group hover:-translate-y-1 transition-transform">
                                                <div className="w-full">
                                                    <svg className="w-full max-w-[100px] lg:max-w-[120px] mx-auto" viewBox="0 0 152 152" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M151.445 72.7923V71.5293C150.998 70.4741 151.032 69.1921 150.919 68.081C146.86 28.1396 112.315 -1.49633 72.6584 0.0584542C33.3764 1.59759 1.60337 33.3561 0.0765332 72.6448C-0.00282666 74.6824 -0.035238 76.5871 0.0519461 78.5476C1.82134 118.173 32.5783 148.304 71.2277 151.43H72.807C72.7824 151.185 73.0943 151.107 73.4218 151.107H77.5597C77.8883 151.107 78.1979 151.184 78.1756 151.43H79.755C79.7784 151.136 80.2993 151.013 80.657 151.086C81.8641 151.331 82.7728 150.937 83.7833 150.828C119.012 147.011 147.025 118.998 150.842 83.7697C150.842 83.7663 150.842 83.763 150.843 83.7585C150.845 83.7529 150.845 83.7451 150.846 83.7362C150.847 83.7261 150.848 83.7116 150.85 83.6937C150.851 83.6847 150.852 83.6747 150.854 83.6635C150.854 83.6557 150.856 83.6456 150.857 83.6322C150.859 83.611 150.862 83.5875 150.865 83.5618C150.866 83.5473 150.868 83.5305 150.87 83.5093C150.873 83.4847 150.876 83.4578 150.879 83.4299C150.88 83.4187 150.881 83.4053 150.884 83.3874C150.887 83.3561 150.89 83.3237 150.894 83.2891C150.902 83.2265 150.909 83.1549 150.918 83.0767C150.923 83.0309 150.928 82.9839 150.934 82.9347C150.957 82.7313 150.984 82.4999 151.013 82.2551C151.023 82.1657 151.035 82.0741 151.047 81.9813C151.061 81.8583 151.077 81.7309 151.094 81.6024C151.099 81.5532 151.106 81.504 151.113 81.4548C151.135 81.2794 151.159 81.1039 151.182 80.9373C151.186 80.9094 151.19 80.8826 151.193 80.8557C151.201 80.8032 151.208 80.7507 151.216 80.6981C151.22 80.6724 151.224 80.6478 151.227 80.6232C151.245 80.5036 151.263 80.3919 151.281 80.2913C151.287 80.2544 151.293 80.2186 151.3 80.1851C151.31 80.1292 151.32 80.0778 151.33 80.0331C151.333 80.0141 151.338 79.9951 151.342 79.9783C151.36 79.9045 151.376 79.8531 151.39 79.8319C151.395 79.8241 151.399 79.8207 151.403 79.8207C151.406 79.8207 151.408 79.8207 151.41 79.8241C151.412 79.8263 151.415 79.8296 151.417 79.8341C151.417 79.8341 151.418 79.8352 151.418 79.8363C151.419 79.8386 151.42 79.8397 151.42 79.8419C151.421 79.8475 151.424 79.8531 151.425 79.8598C151.427 79.8665 151.428 79.8732 151.429 79.8811C151.433 79.8978 151.435 79.9191 151.437 79.9448C151.438 79.9537 151.439 79.9638 151.439 79.9727C151.441 79.9973 151.444 80.0241 151.445 80.0554V78.4772C151.2 78.5018 151.122 78.1888 151.122 77.8613V73.4082C151.122 73.0796 151.2 72.77 151.445 72.7923ZM125.547 128.258C97.4444 154.942 53.3236 154.686 25.5287 128.054C-4.33074 99.4438 -4.30949 51.8089 25.5063 23.2449C54.3911 -4.42705 100.324 -3.44456 128.03 25.4804C155.734 54.4043 154.778 100.502 125.547 128.258Z" fill="#EAEDF4" />
                                                        <path d="M151.41 79.824C151.41 79.824 151.418 79.8318 151.42 79.8419C151.42 79.8385 151.418 79.8363 151.417 79.834C151.415 79.8296 151.412 79.8262 151.41 79.824Z" fill="#EAEDF4" />
                                                        <path d="M151.444 78.477C151.2 78.5016 151.121 78.1886 151.121 77.8611V73.408C151.121 73.0805 151.199 72.7698 151.444 72.7922V78.477Z" fill="#EAEDF4" />
                                                        <path d="M78.1746 151.43H72.8061C72.7815 151.185 73.0933 151.107 73.4219 151.107H77.5598C77.8873 151.107 78.1981 151.184 78.1757 151.43H78.1746Z" fill="#EAEDF4" />
                                                        <path d="M125.311 25.0177C97.5976 -2.16924 53.2097 -2.03623 25.6674 25.334C-1.93757 52.7668 -2.27959 97.2731 24.8805 125.14C52.3043 153.278 97.4936 153.801 125.545 126.01C153.733 98.0857 153.493 52.6651 125.311 25.0177ZM82.0486 143.1C44.8356 146.627 11.7414 119.312 8.17356 82.0405C4.64372 45.1628 31.6663 11.8596 69.0291 8.19895C106.552 4.52269 139.621 32.1545 143.12 69.2311C146.634 106.473 119.278 139.571 82.0486 143.1Z" fill="#EAEDF4" />
                                                        <path d="M111.616 46.0714L110.352 40.6392L105.284 39.7438C88.1718 25.5854 63.3511 25.4926 46.1468 39.6365L40.6486 40.6738L39.2749 46.5733C28.4797 60.1729 25.8978 78.4759 33.2369 94.8475C39.5845 109.006 53.3585 119.696 69.6116 121.849C71.6258 122.116 73.4298 123.711 75.7905 123.572C77.8964 123.448 79.5629 122.117 81.3613 121.89C97.9084 119.803 111.931 108.924 118.261 94.3904C125.445 77.9003 122.627 59.5637 111.616 46.0714ZM99.5828 38.7893C97.9889 39.1771 96.6443 38.5054 95.2583 38.4238C81.9225 37.638 69.0248 37.6224 56.0388 38.4204C54.607 38.6306 53.4412 39.0084 51.7467 38.7826C66.1187 29.3097 85.089 29.2728 99.5828 38.7893ZM38.3517 52.3844C38.6747 54.1147 38.1315 55.3263 38.0499 56.6598C37.4418 66.6301 37.2171 76.2315 38.8043 85.9592C40.2351 94.7313 44.6826 102.102 50.0746 108.8C50.3317 109.12 50.6893 109.066 50.7162 109.409C50.7173 109.42 50.7184 109.428 50.7217 109.437C50.7229 109.444 50.7251 109.452 50.7273 109.459C50.7307 109.469 50.7352 109.479 50.7407 109.489C50.7452 109.499 50.7508 109.508 50.7575 109.517C50.7642 109.527 50.772 109.537 50.781 109.546C50.7933 109.56 50.8067 109.575 50.8223 109.587C50.8346 109.598 50.848 109.608 50.8603 109.617C50.8737 109.627 50.8883 109.638 50.9006 109.646H50.9028C50.9475 109.678 50.9878 109.703 51.0068 109.73C51.0112 109.735 51.0135 109.74 51.0157 109.746C51.0202 109.754 51.0202 109.764 51.0179 109.773C52.7124 111.807 55.2788 112.764 56.5742 115.212C32.9094 103.791 24.5397 74.4878 38.3517 52.3844ZM75.605 121.002C67.565 118.47 60.4081 114.456 54.2538 108.716C48.3018 102.647 43.386 95.4835 42.0033 86.8724C39.6617 72.2892 40.9124 57.3751 44.212 43.0781C54.8049 41.0874 65.0736 40.5218 75.396 40.5106C86.0592 40.4994 96.3615 41.0974 106.879 43.0904C110.128 57.6188 111.469 72.5821 108.972 87.21C106.214 103.364 90.633 116.608 75.605 121.002ZM94.0388 115.494C95.6159 113.39 97.5977 111.674 99.5605 110.383C99.6298 109.985 99.9014 109.782 100.266 109.376C106.314 102.649 110.88 94.6072 112.306 85.5188C113.863 75.6011 113.57 65.8219 112.918 56.0283C112.834 54.7652 112.312 53.5525 112.665 51.9641C127.013 74.2766 118.36 104.367 94.0388 115.494Z" fill="#EAEDF4" />
                                                        <path d="M75.548 99.0379L75.5424 96.8494L75.5089 83.783C74.3196 83.8333 74.0681 85.6284 73.2465 86.0743C72.2015 86.641 71.1362 86.7048 70.4645 87.856C69.8497 88.9089 68.6548 89.8948 67.4354 90.1161C66.0505 90.3654 65.6436 91.3691 64.7651 92.2286C64.1235 92.8557 62.4055 92.5718 61.9897 93.5398C61.489 94.7056 63.2986 95.5573 63.4227 96.5286C63.5847 97.7972 63.4227 98.868 64.3795 99.9254C66.4831 102.25 64.4018 103.501 66.6026 106.167C67.2118 106.905 66.3523 108.934 67.2219 109.454C67.4454 109.587 67.8042 109.648 68.191 109.524L70.3337 108.839C72.6463 110.158 73.7361 108.886 75.5737 108.798L75.548 99.0379ZM76.3013 45.8367C75.9727 45.925 75.6765 46.011 75.4105 46.0949L75.4127 47.0259C75.605 47.0148 75.7346 47.0807 75.7413 47.2741C75.9056 48.1213 75.6195 48.6221 76.0364 49.1754C76.6981 48.0733 76.4343 46.9354 76.3013 45.8367ZM79.4131 48.6824C78.2954 50.4418 77.0927 51.7149 75.4284 52.789L75.4317 54.1437C76.1996 53.8855 76.9943 53.6978 77.8863 53.7849C78.6229 53.8565 80.1285 53.6978 80.3912 52.9377C79.9541 51.5226 79.4433 50.3557 79.4131 48.6824ZM80.6259 54.3595C79.3818 57.0711 77.2928 58.4325 75.4451 59.5771L75.4496 60.9888C76.0208 60.7753 76.6087 60.6144 77.248 60.5227L82.7742 59.7291C81.491 57.9217 81.0897 56.4463 80.6259 54.3595ZM93.6074 57.8446C92.2962 61.0156 90.7761 63.8279 88.4009 66.2579C87.7425 67.0481 87.3592 67.9199 86.7478 68.7404L86.4527 57.6501L86.4024 51.2678L81.9314 53.0349C83.399 53.7782 84.3278 52.7756 85.8334 52.4146L85.7038 70.0738C83.4191 67.5108 82.5909 64.5321 82.5462 60.9776C81.405 64.7176 79.0052 67.2571 75.5591 68.9259C75.5301 68.9404 75.4999 68.955 75.4697 68.9695L75.4742 70.7109C75.6665 71.4252 75.3624 72.2054 75.9425 73.018C76.6646 72.1841 76.308 71.2989 76.5405 70.2918C79.6959 69.8738 82.6702 70.3555 85.6244 71.0284C85.7798 71.4654 85.7854 71.708 85.9039 71.8443C85.9966 71.9516 86.4527 71.8879 86.4885 71.756C86.5209 71.6387 86.456 71.006 86.598 70.9535L95.6417 67.6595C93.5794 64.7165 93.5124 61.5767 93.6074 57.8446Z" fill="#EAEDF4" />
                                                        <path d="M50.9002 109.646C50.8879 109.637 50.8734 109.627 50.86 109.617C50.8477 109.608 50.8343 109.598 50.822 109.587C50.8064 109.575 50.7929 109.56 50.7806 109.546C50.7717 109.537 50.7639 109.527 50.7572 109.517C50.7505 109.508 50.7449 109.499 50.7404 109.489C50.7348 109.479 50.7303 109.469 50.727 109.459C50.7248 109.452 50.7225 109.444 50.7214 109.437C50.718 109.428 50.7169 109.419 50.7158 109.409C50.7728 109.492 50.8343 109.57 50.9002 109.646Z" fill="#EAEDF4" />
                                                        <path d="M50.7158 109.409C50.7728 109.492 50.8343 109.57 50.9002 109.646C50.8879 109.637 50.8734 109.627 50.86 109.617C50.8477 109.608 50.8343 109.598 50.822 109.587C50.8064 109.575 50.7929 109.56 50.7806 109.546C50.7717 109.537 50.7639 109.527 50.7572 109.517C50.7505 109.508 50.7449 109.499 50.7404 109.489C50.7348 109.479 50.7303 109.469 50.727 109.459C50.7248 109.452 50.7225 109.444 50.7214 109.437C50.718 109.428 50.7169 109.419 50.7158 109.409Z" fill="#EAEDF4" />
                                                        <path d="M51.018 109.773C50.9777 109.733 50.9386 109.69 50.9028 109.648C50.9475 109.678 50.9878 109.704 51.0068 109.73C51.0113 109.735 51.0135 109.74 51.0157 109.746C51.0202 109.754 51.0202 109.764 51.018 109.773Z" fill="#EAEDF4" />
                                                        <path d="M95.6414 67.6595L86.5977 70.9535C86.4558 71.0061 86.5206 71.6387 86.4882 71.7561C86.4524 71.888 85.9964 71.9517 85.9036 71.8444C85.7851 71.708 85.7795 71.4655 85.6242 71.0284C82.67 70.3555 79.6957 69.8738 76.5403 70.2918C76.3078 71.2989 76.6643 72.1842 75.9423 73.018C75.3622 72.2054 75.6662 71.4252 75.4739 70.7121C75.4605 70.6629 75.446 70.616 75.4281 70.569L72.6572 71.7147C72.9568 70.2169 74.2947 69.5385 75.4695 68.9695C75.4996 68.955 75.5298 68.9405 75.5589 68.9259C79.0049 67.2572 81.4047 64.7176 82.5459 60.9777C82.5906 64.5321 83.4189 67.5109 85.7035 70.0739L85.8332 52.4146C84.3276 52.7757 83.3987 53.7783 81.9311 53.035L86.4021 51.2678L86.4524 57.6501L86.7475 68.7404C87.3589 67.92 87.7423 67.0481 88.4006 66.2579C90.7758 63.8279 92.296 61.0157 93.6071 57.8446C93.5121 61.5768 93.5792 64.7165 95.6414 67.6595Z" fill="#EAEDF4" />
                                                        <path d="M71.3001 70.2684C68.9238 70.1879 67.0113 69.9879 64.8619 70.1924C64.7982 70.8876 64.8753 71.4678 64.4092 72.4681C64.1074 71.8377 64.1096 71.1168 63.9163 70.4204C62.803 70.3019 62.2262 70.9894 60.9028 71.252C61.4505 68.1402 66.7565 69.0937 68.9338 62.8589C69.2222 65.7471 69.6123 68.0262 71.3001 70.2684Z" fill="#EAEDF4" />
                                                        <path d="M82.7738 59.7293L77.2477 60.5229C76.6083 60.6145 76.0204 60.7755 75.4492 60.989C74.2946 61.4171 73.2093 62.0553 71.9082 62.755C72.4537 61.3791 73.8609 60.5586 75.4448 59.5772C77.2924 58.4327 79.3814 57.0713 80.6255 54.3596C81.0894 56.4464 81.4906 57.9219 82.7738 59.7293Z" fill="#EAEDF4" />
                                                        <path d="M68.8143 61.4125C67.4048 63.078 64.236 61.3913 59.983 64.3779C59.5448 62.347 65.4778 60.3015 67.4026 56.6118C67.6116 58.4572 67.9279 59.9796 68.8143 61.4125Z" fill="#EAEDF4" />
                                                        <path d="M80.3911 52.9376C80.1284 53.6977 78.6228 53.8564 77.8862 53.7849C76.9942 53.6977 76.1995 53.8855 75.4316 54.1437C74.42 54.4812 73.4543 54.9373 72.3701 55.0412C73.1347 53.8117 74.3116 53.492 75.293 52.875C75.3388 52.846 75.3835 52.818 75.4283 52.789C77.0926 51.7148 78.2953 50.4417 79.413 48.6824C79.4432 50.3556 79.954 51.5226 80.3911 52.9376Z" fill="#EAEDF4" />
                                                        <path d="M56.9921 69.3082C57.0458 69.9308 55.4675 69.5306 55.0506 69.2892C53.0275 68.1223 56.2477 62.3111 57.6985 61.4426C57.2402 64.313 56.678 66.3875 56.9921 69.3082Z" fill="#EAEDF4" />
                                                        <path d="M76.0362 49.1754C75.6193 48.6221 75.9054 48.1213 75.7411 47.2741C75.7344 47.0807 75.6048 47.0148 75.4125 47.0259C74.7363 47.064 73.281 48.0442 73.614 47.7279C73.4665 47.8665 71.9475 47.1802 75.4103 46.0949C75.6763 46.011 75.9725 45.925 76.3011 45.8367C76.4341 46.9354 76.6979 48.0733 76.0362 49.1754Z" fill="#EAEDF4" />
                                                        <path d="M64.9282 56.3682C64.6376 56.6141 64.765 57.0455 64.3258 57.2612C64.2062 56.2553 64.29 55.332 63.9781 54.3875C63.094 54.2903 62.6033 55.0045 61.6152 54.7586C62.3317 53.7649 63.3511 53.3737 64.5605 53.1982C64.727 54.3607 64.6723 55.2873 64.9282 56.3682Z" fill="#EAEDF4" />
                                                        <path d="M58.0058 61.1074C58.0058 61.2181 57.9163 61.3075 57.8057 61.3075C57.695 61.3075 57.6045 61.2181 57.6045 61.1074C57.6045 60.9968 57.695 60.9062 57.8057 60.9062C57.9163 60.9062 58.0058 60.9968 58.0058 61.1074Z" fill="#EAEDF4" />
                                                        <path d="M71.8592 55.8965C71.8592 55.9837 71.7887 56.0541 71.7016 56.0541C71.6144 56.0541 71.5439 55.9837 71.5439 55.8965C71.5439 55.8093 71.6144 55.7378 71.7016 55.7378C71.7887 55.7378 71.8592 55.8093 71.8592 55.8965Z" fill="#EAEDF4" />
                                                        <path d="M72.1757 55.2649C72.1757 55.3521 72.1042 55.4225 72.017 55.4225C71.9298 55.4225 71.8594 55.3521 71.8594 55.2649C71.8594 55.1777 71.9298 55.1062 72.017 55.1062C72.1042 55.1062 72.1757 55.1777 72.1757 55.2649Z" fill="#EAEDF4" />
                                                        <path d="M88.9698 93.4548C88.4568 92.5405 86.6885 92.8646 86.1196 92.0263C84.0998 89.0565 82.0611 90.5319 80.6963 87.9533C80.029 86.6913 78.9146 86.6343 77.8047 86.0453C76.9932 85.6149 76.7562 83.8456 75.6284 83.7841C75.5871 83.7818 75.548 83.7818 75.5089 83.783C74.3196 83.8333 74.0681 85.6284 73.2465 86.0743C72.2015 86.641 71.1362 86.7047 70.4645 87.856C69.8497 88.9089 68.6548 89.8948 67.4354 90.1161C66.0505 90.3654 65.6436 91.3691 64.7651 92.2286C64.1235 92.8557 62.4055 92.5718 61.9897 93.5397C61.489 94.7056 63.2986 95.5573 63.4227 96.5286C63.5847 97.7972 63.4227 98.868 64.3795 99.9254C66.4831 102.25 64.4018 103.501 66.6026 106.167C67.2118 106.905 66.3523 108.934 67.2219 109.454C67.4454 109.587 67.8042 109.648 68.191 109.523L70.3337 108.839C72.6463 110.158 73.7361 108.886 75.5737 108.798C76.1828 108.77 76.8725 108.871 77.7164 109.237C78.6721 109.652 79.5305 109.356 80.6147 109.046C81.6889 108.739 83.2336 110.11 84.0082 109.383C84.7515 108.684 84.0149 106.919 84.6296 106.111C87.2999 102.601 83.9277 103.897 87.4307 98.8043C87.9695 98.0208 87.339 96.865 87.8163 96.0334C88.2455 95.2857 89.5097 94.4183 88.9698 93.4548ZM76.2812 98.8312C76.2555 98.8479 76.2309 98.8624 76.2052 98.877C76.2019 98.8792 76.1985 98.8803 76.1963 98.8826C76.1728 98.8949 76.1504 98.906 76.1269 98.9172C76.0398 98.9597 75.9504 98.9899 75.8609 99.01C75.7559 99.0335 75.6508 99.0435 75.548 99.0379C75.5278 99.0379 75.5077 99.0357 75.4876 99.0335C75.4664 99.0312 75.4463 99.029 75.4273 99.0256C75.4094 99.0223 75.3915 99.0189 75.3747 99.0156C75.3602 99.0133 75.3457 99.01 75.3322 99.0055C75.2775 98.9932 75.2238 98.9742 75.1724 98.9519C75.1579 98.9452 75.1422 98.9385 75.1277 98.9306C75.083 98.9094 75.0394 98.8837 74.998 98.8546C74.9802 98.8435 74.9634 98.83 74.9466 98.8166C74.912 98.7898 74.8795 98.7596 74.8483 98.7283C74.836 98.716 74.8237 98.7037 74.8114 98.6892C74.7946 98.6702 74.779 98.6512 74.7633 98.6311C74.7555 98.621 74.7488 98.6121 74.741 98.6009C74.7331 98.5908 74.7253 98.5808 74.7186 98.5696C74.4246 98.1348 74.4347 97.2719 75.1277 96.9545C75.1679 96.9366 75.2071 96.9209 75.2473 96.9075C75.2663 96.8997 75.2864 96.8941 75.3065 96.8885C75.3255 96.8829 75.3457 96.8785 75.3647 96.874C75.3848 96.8695 75.4049 96.865 75.4239 96.8628C75.463 96.8561 75.5032 96.8516 75.5424 96.8494C76.0062 96.8259 76.4097 97.1154 76.6143 97.5111C76.8423 97.9537 76.6422 98.5975 76.2812 98.8312Z" fill="#EAEDF4" />
                                                        <path d="M75.1275 96.9544C75.7534 96.6672 76.3503 97.0003 76.6141 97.5122C76.8421 97.9548 76.642 98.5987 76.281 98.8323C75.7344 99.1855 75.0649 99.0849 74.7184 98.5707C74.4255 98.1359 74.4345 97.273 75.1275 96.9544Z" fill="#EAEDF4" />
                                                    </svg>
                                                </div>
                                                <div className="flex items-center justify-center mt-4 w-full">
                                                    <div className="bg-white py-2 px-4 lg:px-6 lg:py-3 lg:rounded-xl border border-[#00000018] rounded-lg flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-[1px] bg-[#FFBFD1] rounded-[1px]"></div>
                                                        <span className="text-xs font-[400] lg:text-sm  text-[#0A0A0A] whitespace-nowrap">Premier League</span>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </SwiperSlide>

                                </Swiper>
                            </div>
                        </div>

                    </div>

                    <div className="w-full mt-6 bg-[#FFF5F5] border border-pink-50 rounded-[24px] sm:rounded-[32px] relative overflow-hidden group shadow-sm flex flex-col justify-center">

                        {/* Cabeçalho do Bloco */}
                        <div className="relative pt-6 sm:pt-8 z-10 text-center mb-8 sm:mb-12 px-4">
                            <span className="text-[#8033D9] font-medium text-xs sm:text-sm tracking-wide uppercase">Cobertura global</span>
                            <h3 className="text-[#1B1917] font-medium text-xl sm:text-2xl lg:text-4xl mt-3 max-w-4xl mx-auto leading-tight">
                                Dados de praticamente todas as grandes ligas do mundo.
                            </h3>
                        </div>

                        {/* Área do Slide Infinito */}
                        {/* Ajuste na margem negativa inferior para mobile (-mb-16) vs desktop (-mb-25) */}
                        <div className="relative w-full -mb-16 sm:-mb-25 pb-10">

                            {/* Degradês laterais ajustados: w-16 no mobile, w-32 no desktop */}
                            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#FFF5F5] via-[#FFF5F5]/80 to-transparent z-20 pointer-events-none"></div>
                            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#FFF5F5] via-[#FFF5F5]/80 to-transparent z-20 pointer-events-none"></div>

                            <Swiper
                                modules={[Autoplay]}
                                spaceBetween={10} // Padrão mobile
                                breakpoints={{
                                    320: {
                                        spaceBetween: 10, // Mobile pequeno
                                    },
                                    640: {
                                        spaceBetween: 16, // Tablets/iPads
                                    },
                                    1024: {
                                        spaceBetween: 24, // Desktop
                                    }
                                }}
                                slidesPerView="auto"
                                loop={true}
                                speed={5000}
                                allowTouchMove={false}
                                autoplay={{
                                    delay: 0,
                                    disableOnInteraction: false,
                                    pauseOnMouseEnter: false,
                                }}
                                className="w-full [&>.swiper-wrapper]:transition-timing-function-linear"
                                style={{
                                    "--swiper-wrapper-transition-timing-function": "linear"
                                }}
                            >
                                {[Time, Time1, Time2, Time3, Time4, Time5, Time, Time1, Time2, Time3, Time4, Time5, Time, Time1].map((logo, index) => (
                                    <SwiperSlide key={index} className="!w-auto">
                                        {/* Card Responsivo: 
                                    Mobile: 120px
                                    Tablet (sm): 160px
                                    Laptop (lg): 220px
                                    Desktop (xl): 300px
                                */}
                                        <div className="w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] lg:w-[220px] lg:h-[220px] xl:w-[300px] xl:h-[300px] bg-white border border-[#F0F0F0] rounded-2xl flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-purple-100 transition-colors">
                                            <img
                                                src={logo}
                                                alt={`Time ${index}`}
                                                // Imagem Responsiva: w-16 mobile -> w-40 desktop
                                                className="w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 xl:w-40 xl:h-40 object-contain opacity-40 hover:opacity-100 hover:grayscale-0 grayscale transition-all duration-300"
                                            />
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    </div>

                </div>
            </div>

            <div className="py-20 bg-[#EBEBEF] w-full">
                <div className="container mx-auto px-10">
                    <div className="text-left flex flex-col items-start mb-6 sm:mb-12">
                        <div className="mb-4 sm:mb-6 flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-full shadow-sm pointer-events-none select-none">
                            <img src={Icone} alt="Icone" className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-[#8033D9] cursor-pointer text-xs sm:text-sm font-medium">Por dentro</span>
                        </div>

                        {/* Título Principal: Reduzido no mobile para text-2xl */}
                        <h2 className="text-2xl sm:text-3xl lg:text-5xl font-medium text-[#1B1917] leading-tight max-w-3xl">
                            Como o Sportinsider transforma dados em decisões
                        </h2>
                    </div>

                    {/* Banner Principal (Largo) */}
                    <div className="bg-black w-full relative rounded-2xl overflow-hidden group min-h-[380px] sm:min-h-[450px] lg:min-h-0 flex flex-col justify-end">
                        <img
                            src={banner1}
                            alt="Banner Destaque"
                            className="absolute lg:relative inset-0 w-full h-full lg:h-auto object-cover lg:object-contain transition-transform duration-700 group-hover:scale-105 block opacity-60 lg:opacity-100"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 lg:via-black/30 to-transparent pointer-events-none"></div>

                        <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 lg:p-12 z-10 text-white flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 lg:gap-0">
                            <div className="text-left w-full lg:max-w-2xl">
                                {/* Título Roxo: Mais claro, negrito e caixa alta para destaque */}
                                <span className="text-[#C084FC] font-bold tracking-widest text-xs sm:text-sm uppercase mb-2 block">
                                    Para gestores e clubes
                                </span>

                                {/* Texto Branco: Reduzido para text-lg no mobile */}
                                <h2 className="font-light text-lg sm:text-2xl lg:text-3xl mt-1 leading-snug text-gray-100">
                                    Planeje orçamentos com base em benchmarks reais e identifique gaps <br className="hidden md:block" /> financeiros e oportunidades de crescimento.
                                </h2>
                            </div>

                            <div className="text-left w-full sm:w-max lg:w-auto">
                                <Link
                                    className={`${primaryButtonClass}  w-full sm:w-auto px-6 py-3 gap-4 text-sm sm:text-base`}
                                    to="/dashboard-public"
                                >
                                    Teste gratuito <ArrowUpRight className="w-3 sm:w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Banners Secundários (Grid) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 sm:mt-5">


                        {/* Banner 2 */}
                        <div className="bg-black w-full relative rounded-2xl overflow-hidden group min-h-[350px] sm:min-h-[400px] lg:min-h-[500px] xl:min-h-[800px] flex flex-col justify-end">
                            <img
                                src={banner2}
                                alt="Banner Secundário 1"
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 block opacity-60 lg:opacity-100"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 lg:via-black/30 to-transparent pointer-events-none"></div>

                            <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 lg:p-12 flex-col text-left z-10 text-white flex items-start gap-6">
                                <div className="text-left w-full">
                                    <span className="text-[#C084FC] font-bold tracking-widest text-xs sm:text-sm uppercase mb-2 block">
                                        Dados financeiros de clubes
                                    </span>
                                    <h2 className="font-light text-lg sm:text-2xl lg:text-3xl mt-1 leading-snug text-gray-100">
                                        Receitas, custos, dívidas e resultado líquido <br className="hidden lg:block" /> de centenas de clubes ao redor do mundo.
                                    </h2>
                                </div>
                                <div className="text-left w-full sm:w-auto">
                                    <Link
                                        className={`${primaryButtonClass} w-full sm:w-auto px-6 py-3 gap-4 text-sm sm:text-base`}
                                        to="/dashboard/clubs"
                                    >
                                        Explorar clubes <ArrowUpRight className="w-3 sm:w-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Banner 3 */}
                        <div className="bg-black w-full relative rounded-2xl overflow-hidden group min-h-[350px] sm:min-h-[400px] lg:min-h-[500px] xl:min-h-[800px] flex flex-col justify-end">
                            <img
                                src={banner3}
                                alt="Banner Secundário 2"
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 block opacity-60 lg:opacity-100"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 lg:via-black/30 to-transparent pointer-events-none"></div>

                            <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 lg:p-12 flex-col text-left z-10 text-white flex items-start gap-6">
                                <div className="text-left w-full">
                                    <span className="text-[#C084FC] font-bold tracking-widest text-xs sm:text-sm uppercase mb-2 block">
                                        Dados financeiros de ligas
                                    </span>
                                    <h2 className="font-light text-lg sm:text-2xl lg:text-3xl mt-1 leading-snug text-gray-100">
                                        Compare distribuições, receitas e estruturas <br className="hidden lg:block" /> financeiras das principais ligas do futebol.
                                    </h2>
                                </div>
                                <div className="text-left w-full sm:w-auto">
                                    <Link
                                        className={`${primaryButtonClass} w-full sm:w-auto px-6 py-3 gap-4 text-sm sm:text-base`}
                                        to="/dashboard/leagues"
                                    >
                                        Explorar ligas <ArrowUpRight className="w-3 sm:w-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-4 mt-4 lg:mt-8">
                        <div className="flex items-center justify-center gap-4 py-6 px-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-purple-100 transition-colors group cursor-default">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-400 group-hover:text-[#8033D9] transition-colors" strokeWidth="1.5">
                                <path d="M3 21h18" strokeLinecap="round" />
                                <path d="M6 21v-8" />
                                <path d="M12 21v-13" />
                                <path d="M18 21v-10" />
                                <circle cx="6" cy="11" r="2" />
                                <circle cx="12" cy="6" r="2" />
                                <circle cx="18" cy="10" r="2" />
                                <path d="M7.8 9.6L10.2 7.4" />
                                <path d="M13.8 7.2L16.2 8.8" />
                            </svg>
                            <span className="font-medium text-[#4E4E4F] lg:text-lg">Dados estruturados e comparáveis</span>
                        </div>

                        <div className="flex items-center justify-center gap-4 py-6 px-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-purple-100 transition-colors group cursor-default">
                            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-400 group-hover:text-[#8033D9] transition-colors" strokeWidth="1.5">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                            </svg>
                            <span className="font-medium text-[#4E4E4F] lg:text-lg">Visualização clara e interativa</span>
                        </div>

                        <div className="flex items-center justify-center gap-4 py-6 px-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-purple-100 transition-colors group cursor-default">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-400 group-hover:text-[#8033D9] transition-colors" strokeWidth="1.5">
                                <path d="M3 21h18" strokeLinecap="round" />
                                <path d="M6 21v-8" />
                                <path d="M12 21v-13" />
                                <path d="M18 21v-10" />
                                <circle cx="6" cy="11" r="2" />
                                <circle cx="12" cy="6" r="2" />
                                <circle cx="18" cy="10" r="2" />
                                <path d="M7.8 9.6L10.2 7.4" />
                                <path d="M13.8 7.2L16.2 8.8" />
                            </svg>
                            <span className="font-medium text-[#4E4E4F] lg:text-lg">Atualizações constantes</span>
                        </div>
                    </div>

                </div>
            </div>

            <div className="py-24 bg-[#0C0718] w-full relative overflow-hidden">

                <img
                    src={backgroundFooter}
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-cover opacity-90 z-0 pointer-events-none"
                />

                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-900/20 blur-[100px] rounded-full pointer-events-none z-0"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="w-full flex flex-col items-center text-center">

                        <div className="mb-8 flex items-center gap-2 px-4 py-1.5 bg-[#ffffff0a] border border-[#ffffff15] rounded-full backdrop-blur-md pointer-events-none select-none">
                            <img src={Icone} alt="Icone" className="w-4 h-4 opacity-70" />
                            <span className="text-[#D4BBFC] cursor-pointer text-sm font-medium">Por dentro</span>
                        </div>

                        <h1 className="font-medium text-4xl lg:text-6xl mb-6 leading-[1.1] tracking-tight bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent">
                            O futebol evoluiu. <br />
                            A análise financeira também <br />
                            precisa evoluir.
                        </h1>

                        <p className="text-[#ffffff80] text-sm lg:text-lg max-w-2xl mb-12 leading-relaxed">
                            O Sportinsider nasce para ser a principal camada de inteligência financeira do futebol global — conectando dados, contexto e decisão.
                        </p>

                        <div className="relative mb-12 group cursor-default">
                            {/* Glow Roxo */}
                            <div className="absolute inset-0 bg-[#8b5cf6] blur-[60px] opacity-40 rounded-full group-hover:opacity-60 transition-opacity duration-500"></div>

                            <div className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-[32px] border border-white/10 shadow-2xl overflow-hidden">
                                <img
                                    src={Icone3}
                                    alt="Logo Central"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <Link className="bg-gradient-to-r from-[#904EDE] to-[#4E2A78] gap-4 mr-0 px-5 flex items-center py-3 border border-[#A572E1] text-[#ffffff] rounded-full hover:brightness-110 transition-all" to="/dashboard-public">
                                Teste gratuito <ArrowUpRight className="w-3" />
                            </Link>
                            <Link className="px-6 flex items-center gap-4 py-3 border border-[#A572E1] text-[#A572E1] rounded-full hover:bg-white/5 transition-colors" to="/register">
                                Cadastre-se <ArrowUpRight className="w-3" />
                            </Link>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}