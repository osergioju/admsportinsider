import { Link } from "react-router-dom";
import Blackout from "../assets/img/blackout.png";
import Tela from "../assets/img/tela.png";
import Icone from "../assets/img/icone.png";
import Icone2 from "../assets/img/icone2.png";
import SportinsiderIcon from "../assets/img/sportinsider-logo.png";
import SlideImage from "../assets/img/slide.png";
import ShieldsImage from "../assets/img/2shields.png";
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
    Shield,
    Info
} from "lucide-react";

export default function FrontPage() {

    const leftPillStyle = "flex items-center gap-2 px-4 py-2 bg-[#E5E5E5] border border-[#D4D4D4] rounded-full text-[#404040] text-xs lg:text-sm font-medium shadow-sm z-10 relative whitespace-nowrap hover:scale-105 transition-transform cursor-default";
    const rightPillStyle = "flex items-center gap-3 px-5 py-3 bg-white border border-[#F0F0F0] rounded-full text-[#404040] text-sm font-medium shadow-lg shadow-purple-500/5 z-10 relative whitespace-nowrap min-w-[220px] hover:border-purple-200 transition-colors cursor-default";
    const cardClass = "bg-[#FFF5F5] rounded-2xl p-6 lg:p-8 flex flex-col justify-between h-full border border-pink-50 hover:shadow-lg transition-shadow duration-300";
    const titleClass = "text-[#8033D9] font-medium text-sm lg:text-base mb-2";
    const descClass = "text-[#1B1917] font-medium text-xl lg:text-2xl leading-tight";

  return (

    <div className="w-full bg-[#030015]">
        
        <style>{`
            @keyframes scroll-infinite {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
            }
            .animate-marquee {
                animation: scroll-infinite 30s linear infinite;
                width: max-content;
            }
            .animate-marquee:hover {
                animation-play-state: paused;
            }
        `}</style>
        
        <div className="w-full flex justify-center pt-8 px-4 sm:px-6 lg:px-8 z-20">
            <div className="relative w-full max-w-[1740px] h-[68px] rounded-full flex justify-between items-center pl-4 lg:pl-12 pr-2 backdrop-blur-md border border-white/10 bg-gradient-to-l from-[#1C142F] via-[#3D315D] to-[#c53ed40] to-transparent">
                <div className="flex items-center gap-3">
                    <img 
                        src={SportinsiderIcon} 
                        alt="Logo Sportinsider" 
                        className="w-36 h-auto" 
                    />
                </div>
                <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 gap-10 text-[#C2B3E0] font-light">
                    <div className="cursor-pointer hover:text-white transition-colors">
                        Dados
                    </div>
                    <div className="cursor-pointer hover:text-white transition-colors">
                        Planos
                    </div>
                    <div className="cursor-pointer hover:text-white transition-colors">
                        Ajuda
                    </div>
                </div>
                <div className="flex items-center">
                    <Link className="bg-gradient-to-r from-[#904EDE] to-[#4E2A78] mr-0 px-5 flex items-center py-3 border border-[#A572E1] text-[#ffffff] rounded-full hover:brightness-110 transition-all" to="">
                        Começar Agora <ArrowUpRight className="w-4 ml-2"></ArrowUpRight>
                    </Link>
                </div>
            </div>
        </div>
        <div className="pt-20 pb-2 w-full relative ">
            <h1 class="font-medium text-center lg:text-4xl xl:text-6xl xl:mb-4 text-center text-2xl leading-none bg-gradient-to-r from-[#ffffff1f] to-[#ffffff] bg-clip-text text-transparent ">
                O centro global de inteligência<br />
                financeira do futebol                
            </h1>
            <p className="font-light lg:text-xl text-[#ffffffa6] text-center">
                Dados financeiros, operacionais e comerciais de clubes e ligas do mundo 
                inteiro — organizados, comparáveis e prontos para decisão.
            </p>
            <div className="flex mt-4 gap-2 lg:gap-5 lg:mt-8 items-center justify-center">
                <Link className="bg-gradient-to-r from-[#904EDE] to-[#4E2A78] gap-4 mr-0 px-5 flex items-center py-3 border border-[#A572E1] text-[#ffffff] rounded-full hover:brightness-110 transition-all" to="">Teste gratuito <ArrowUpRight className="w-3"></ArrowUpRight></Link>
                <Link className="px-6 flex items-center gap-4 py-3 border border-[#A572E1] text-[#A572E1] rounded-full" to="">Cadastre-se <ArrowUpRight className="w-3"></ArrowUpRight></Link>
            </div>
        </div>
        
        <div className="w-full bg-white bg-gradient-home relative mt-20">
            <img className="mx-auto w-full max-w-[600px]" src={Blackout}></img>
            <img className="mx-auto w-full max-w-[1200px] -mt-26" src={Tela}></img>
        </div>

        <div className="py-20 bg-[#F5F0F0] w-full relative overflow-hidden">
            
            {/* Grid de fundo (Listras verticais) */}
            <div className="absolute inset-0 pointer-events-none opacity-30" 
                style={{ backgroundImage: 'linear-gradient(to right, #e5e5e5 1px, transparent 1px)', backgroundSize: '6rem 100%' }}>
            </div>

            <div className="container items-center mx-auto px-15 relative z-10">
                {/* Cabeçalho da Seção */}
                <div className="text-left flex flex-col items-start max-w-4xl mb-16">
                    <div className="lg:mb-6 mb-4 flex items-center gap-2 lg:gap-3 lg:px-5 py-2 px-3 border border-purple-200 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
                        <img src={Icone} className="h-5" alt="Icone" />
                        <span className="text-[#8033D9] font-medium text-sm lg:text-base">Informação existe. Inteligência, não.</span>
                    </div>
                    
                    <h2 className="mb-4 text-3xl lg:text-5xl font-medium text-[#1B1917] leading-tight">
                        O futebol gera bilhões — mas os<br className="hidden lg:block"/>
                        dados continuam fragmentados
                    </h2>
                    <p className="text-sm lg:text-lg text-[#0A0A0AB2] max-w-3xl">
                        O Sportinsider centraliza dados financeiros, operacionais e comerciais de clubes e ligas em um único ambiente visual, comparável e atualizado.
                    </p>
                </div>

        {/* DIAGRAMA VISUAL */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-0 relative">
        
                    {/* ESQUERDA: Entradas (Fluxo de Dados) */}
                    <div className="relative h-[320px] w-full lg:w-[424px] flex-shrink-0">
    
                        {/* SVG Linhas Esquerda (O "Funil") */}
                        <svg className="absolute top-0 right-0 w-full h-full pointer-events-none hidden lg:block" viewBox="0 0 450 320" preserveAspectRatio="none">
                            {/* Linhas de fluxo suavizadas */}
                            
                            {/* Patrocínios (Topo Direita) */}
                            {/* M260 50: Início da linha alinhado com o botão de Patrocínios */}
                            <path d="M260 50 C 350 50, 400 160, 450 160" stroke="#D1D1D1" strokeWidth="3.0" fill="none" /> 
                            
                            {/* Clubes (Meio Esquerda - Superior) */}
                            {/* M150 110: Início da linha alinhado com o botão de Clubes */}
                            <path d="M150 110 C 250 110, 350 160, 450 160" stroke="#D1D1D1" strokeWidth="3.0" fill="none" />
                            
                            {/* Receitas (Centro Direita) */}
                            {/* M270 160: Linha reta central */}
                            <path d="M270 160 L 450 160" stroke="#D1D1D1" strokeWidth="3.0" fill="none" />
                            
                            {/* Ligas (Meio Esquerda - Inferior) */}
                            {/* M150 210: Início da linha alinhado com o botão de Ligas */}
                            <path d="M150 210 C 250 210, 350 160, 450 160" stroke="#D1D1D1" strokeWidth="3.0" fill="none" />
                            
                            {/* Despesas (Baixo Direita) */}
                            {/* M260 270: Início da linha alinhado com o botão de Despesas */}
                            <path d="M260 270 C 350 270, 400 160, 450 160" stroke="#D1D1D1" strokeWidth="3.0" fill="none" />
                        </svg>

                        {/* Itens posicionados (Desktop) - Coordenadas CSS sincronizadas com o SVG */}
                        <div className="relative w-full h-full hidden lg:block">
                            
                            {/* Nível 1: Coluna da Esquerda (Mais afastados) */}
                            <div className="absolute top-[90px] left-[50px]">
                                <div className={leftPillStyle}><Trophy size={16} /> Clubes</div>
                            </div>
                            <div className="absolute top-[190px] left-[50px]">
                                <div className={leftPillStyle}><Users size={16} /> Ligas</div>
                            </div>

                            {/* Nível 2: Coluna da Direita (Mais próximos do centro) */}
                            <div className="absolute top-[30px] right-[100px]">
                                <div className={leftPillStyle}><DollarSign size={16} /> Patrocínios</div>
                            </div>
                            
                            {/* Centralizado verticalmente em relação ao Orb */}
                            <div className="absolute top-[140px] right-[80px] z-20">
                                <div className={leftPillStyle}><Activity size={16} /> Receitas</div>
                            </div>
                            
                            <div className="absolute top-[250px] right-[100px]">
                                <div className={leftPillStyle}><Database size={16} /> Despesas</div>
                            </div>
                        </div>

                        {/* Versão Mobile (Lista simples) */}
                        <div className="flex flex-wrap gap-3 justify-center lg:hidden w-full mb-8">
                            <div className={leftPillStyle}>Clubes</div>
                            <div className={leftPillStyle}>Ligas</div>
                            <div className={leftPillStyle}>Patrocínios</div>
                            <div className={leftPillStyle}>Receitas</div>
                            <div className={leftPillStyle}>Despesas</div>
                        </div>
                    </div>

                    {/* CENTRO: Núcleo (Orb Roxo) */}
                    <div className="relative z-20 shrink-0 mx-[-20px] lg:mx-0">
                        {/* Glow Effects */}
                        <div className="absolute inset-0 bg-[#8033D9] opacity-30 blur-3xl rounded-full scale-150"></div>
                        <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-[#9d5ce6] to-[#6a1cb8] p-1 shadow-2xl flex items-center justify-center relative z-10">
                            <div className="w-full h-full bg-[#5E1E99] rounded-full flex items-center justify-center shadow-inner border-[6px] border-[#9d5ce6]/20">
                                {/* Ícone Central Branco */}
                                <img src={Icone2} alt="Core" />
                            </div>
                        </div>
                    </div>

                    {/* DIREITA: Saídas (Lista com Bracket) */}
                    <div className="relative h-auto lg:h-[360px] flex-shrink-0 flex items-center">
    
                        <svg className="absolute top-0 left-0 w-[200px] h-full pointer-events-none hidden lg:block" viewBox="0 0 120 360" preserveAspectRatio="none">
                            {/* Linha central saindo do orb */}
                            <path d="M0 180 L 30 180" stroke="#8033D9" strokeWidth="4" fill="none" />

                            <path d="M30 180 C 60 180, 60 52, 120 52" stroke="#8033D9" strokeWidth="2" fill="none" />   {/* Top */}
                            <path d="M30 180 C 60 180, 60 116, 120 116" stroke="#8033D9" strokeWidth="2" fill="none" />  {/* Mid-Top */}
                            <path d="M30 180 L 120 180" stroke="#8033D9" strokeWidth="2" fill="none" />                 {/* Center */}
                            <path d="M30 180 C 60 180, 60 244, 120 244" stroke="#8033D9" strokeWidth="2" fill="none" />  {/* Mid-Bottom */}
                            <path d="M30 180 C 60 180, 60 308, 120 308" stroke="#8033D9" strokeWidth="2" fill="none" />  {/* Bottom */}
                        </svg>

                        <div className="flex flex-col gap-5 lg:gap-5 lg:pl-[200px] pointer-events-none hidden lg:flex items-center lg:items-start z-10">
                            <div className={rightPillStyle}><div className="text-[#8033D9]"><BarChart3 size={18} /></div>Comparativos inteligentes</div>
                            <div className={rightPillStyle}><div className="text-[#8033D9]"><Layers size={18} /></div>Visão financeira centralizada</div>
                            <div className={rightPillStyle}><div className="text-[#8033D9]"><Search size={18} /></div>Filtros avançados</div>
                            <div className={rightPillStyle}><div className="text-[#8033D9]"><Trophy size={18} /></div>Benchmarking</div>
                            <div className={rightPillStyle}><div className="text-[#8033D9]"><Check size={18} /></div>Redução de análise manual</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <div className="py-20 bg-[#F5F0F0] w-full relative overflow-hidden">
        
        {/* Grid de Fundo (Opcional, para match com a imagem) */}
        <div className="absolute inset-0 pointer-events-none opacity-30" 
            style={{ backgroundImage: 'linear-gradient(to right, #e5e5e5 1px, transparent 1px)', backgroundSize: '6rem 100%' }}>
        </div>

        <div className="container mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-3 gap-6">
                
                {/* === CARD 1: RECEITAS === */}
                <div className={cardClass}>
                    <div className="mb-8">
                        <span className={titleClass}>Receitas e custos operacionais</span>
                        <h3 className={descClass}>
                            Entenda de onde vem o dinheiro e para onde ele vai — por clube, liga e temporada.
                        </h3>
                    </div>

                    {/* Gráfico Simulado (CSS Puro) */}
                   <div className="relative mt-auto flex flex-col items-center pb-4">
                         
                         {/* Item 1 (Topo - Principal) */}
                         <div className="w-full bg-white rounded-xl border border-gray-100 p-4 shadow-sm z-30 relative flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {/* Simulação do ícone quadrado da esquerda */}
                                <div className="w-12 h-9 border border-gray-100 rounded flex items-center justify-center">
                                    <div className="w-5 h-px bg-gray-300"></div>
                                </div>
                                <span className="text-gray-900 font-medium text-sm lg:text-base">Direito de imagem</span>
                            </div>
                            {/* Ícone de barras na direita */}
                            <BarChart3 className="text-gray-400" size={18} />
                         </div>

                         {/* Item 2 (Meio - Fantasma) */}
                         <div className="w-[92%] bg-white/80 rounded-xl border border-gray-100 p-3 shadow-sm z-20 -mt-6 pt-8 opacity-70 flex items-center gap-4">
                             <div className="w-10 h-6 border border-gray-200 rounded"></div>
                             <div className="w-24 h-px bg-gray-300"></div>
                         </div>

                         {/* Item 3 (Fundo - Fantasma) */}
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

                    {/* Área do Gráfico */}
                    <div className="relative h-48 mt-8 mx-2">
                        
                        {/* Linhas de Grade (Background) */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                            <div className="w-full h-[1px] bg-gray-200"></div>
                            <div className="w-full h-[1px] bg-gray-200"></div>
                            <div className="w-full h-[1px] bg-gray-200"></div>
                            <div className="w-full h-[1px] bg-gray-200"></div>
                            <div className="w-full h-[1px] bg-gray-200"></div>
                        </div>

                        {/* Container das Barras */}
                        <div className="absolute inset-0 flex items-end justify-between px-2 gap-3">
                            
                            {/* Barra 1: Baixa */}
                            <div className="flex-1 h-[35%] bg-gradient-to-b from-[#C4A6ED] to-[#F3EBFD] rounded-t-md opacity-90"></div>
                            
                            {/* Barra 2: Média */}
                            <div className="flex-1 h-[60%] bg-gradient-to-b from-[#9F6CDF] to-[#EADBF9] rounded-t-md opacity-95"></div>

                            {/* Barra 3: Alta (Referência) */}
                            <div className="flex-1 h-[100%] bg-gradient-to-b from-[#9A5CE5] to-[#E5D4F5] rounded-t-md relative z-10">
                                
                                {/* TOOLTIP FLUTUANTE À DIREITA */}
                                <div className="absolute top-12 -right-[150%] z-50">
                                    <div className="bg-white px-2 py-1.5 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100 flex items-center gap-2 min-w-[120px] relative">
                                        
                                        {/* Indicador Verde */}
                                        <div className="w-2 h-2 bg-[#86D29A] rounded-[2px]"></div>
                                        
                                        {/* Texto */}
                                        <span className="text-[10px] font-semibold text-gray-600">Clube</span>
                                        
                                        {/* Valor com fundo cinza */}
                                        <div className="bg-gray-100 px-1.5 py-0.5 rounded ml-auto">
                                            <span className="text-[10px] font-bold text-gray-800">R$90</span>
                                        </div>

                                        {/* Ícone do Cursor (SVG) posicionado sobre o tooltip */}
                                        <svg className="absolute -bottom-4 -right-3 w-5 h-5 text-[#8B5CF6] drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Barra 4: Baixa */}
                            <div className="flex-1 h-[30%] bg-gradient-to-b from-[#9F6CDF] to-[#EADBF9] rounded-t-md opacity-90"></div>

                            {/* Barra 5: Média */}
                            <div className="flex-1 h-[50%] bg-gradient-to-b from-[#C4A6ED] to-[#F3EBFD] rounded-t-md opacity-90"></div>
                            
                            {/* Barra 6: Muito Baixa */}
                            <div className="flex-1 h-[20%] bg-gradient-to-b from-[#D6BDF5] to-[#F7F2FD] rounded-t-md opacity-70"></div>

                        </div>
                    </div>
                </div>
                {/* === CARD 3: COMPARATIVOS INTELIGENTES === */}
                <div className={cardClass}>
    
                    <div className="mb-6">
                        <span className={titleClass}>Comparativos inteligentes</span>
                        <h3 className={descClass}>
                            Coloque clubes e ligas lado a lado e descubra vantagens competitivas.
                        </h3>
                    </div>


                    <div className="mt-auto w-full h-48 flex items-end justify-center">
                        
                    </div>
                    <img 
                            src={ShieldsImage} 
                            alt="Comparativo Shields" 
                            className="h-full w-auto object-contain pointer-events-none" 
                        />

                </div>
            </div>
        </div>

        <div className="container mx-auto mt-5 bg-[#FFF5F5] border border-pink-50 rounded-2xl p-15 relative overflow-hidden group shadow-sm">
                
                <div className="relative z-10 text-center mb-8">
                     <span className="text-[#8033D9] font-medium text-xl tracking-wide">Cobertura global</span>
                     <h3 className="text-[#1B1917] font-medium text-xl lg:text-2xl mt-2 max-w-2xl mx-auto">
                        Dados de praticamente todas as grandes ligas do mundo.
                     </h3>
                </div>

                {/* Slider Infinito */}
                <div className="relative w-full overflow-hidden mask-linear-fade">
                    
                    {/* Degradês laterais (mantive para suavizar as pontas) */}
                    <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#FFF5F5] to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#FFF5F5] to-transparent z-10 pointer-events-none"></div>

                    {/* Container da Animação */}
                    <div className="flex animate-marquee items-center">
                        
                        <img 
                            src={SlideImage} 
                            alt="Cobertura Global de Ligas" 
                            className="h-24 w-auto max-w-none opacity-70 grayscale hover:grayscale-0 transition-all duration-500 mr-10" 
                        />
                        <img 
                            src={SlideImage} 
                            alt="Cobertura Global de Ligas" 
                            className="h-24 w-auto max-w-none opacity-70 grayscale hover:grayscale-0 transition-all duration-500 mr-10" 
                        />
                        
                        <img 
                            src={SlideImage} 
                            alt="Cobertura Global de Ligas" 
                            className="h-24 w-auto max-w-none opacity-70 grayscale hover:grayscale-0 transition-all duration-500 mr-10 hidden xl:block" 
                        />
                    </div>
                </div>
            </div>
        </div>


        <div className="py-20 bg-[#EBEBEF] w-full">
            <div className="container mx-auto px-10">
                <div className="text-left flex flex-col items-start mb-4">
                    <div className="lg:mb-2 mb-2 flex items-center gap-2 lg:gap-3 lg:px-6 lg:text-xl py-2 px-4 border bg-white rounded-full">
                        <img src={Icone}></img>
                        <span className="text-[#8033D9]">Por dentro</span>
                    </div>
                    
                    <h2 className="mb-4 text-3xl lg:text-4xl xl:text-5xl  text-[#1B1917]">
                        Como o Sportinsider
                        <br/>transforma dados em decisãos        
                    </h2>
                </div>

                <div className="bg-black w-full relative rounded-2xl overflow-hidden flex items-end min-h-[400px]">
                    <div className="p-6 lg:p-12 justify-between text-left relative text-white w-full flex items-end">
                        <div className="text-left">
                            <span className="text-[#8033D9]">Para gestores e clubes</span>
                            <h2 className="font-light text-2xl lg:text-3xl mt-3">
                                Planeje orçamentos com base em <br/>
                                benchmarks reais e identifique gaps <br/>
                                financeiros e oportunidades de crescimento.
                            </h2>
                        </div>
                        <div className="text-left">
                            <Link className="bg-gradient-to-r from-[#904EDE] to-[#4E2A78] gap-4 mr-0 px-5 flex items-center py-3 border border-[#A572E1] text-[#ffffff] rounded-full hover:brightness-110 transition-all" to="">Teste gratuito <ArrowUpRight className="w-3"></ArrowUpRight></Link>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-4 mt-4">
                    <div className="bg-black w-full relative rounded-2xl overflow-hidden flex items-end min-h-[400px]">
                        <div className="p-6 lg:p-12 flex-col text-left relative text-white w-full flex items-start gap-4">
                            <div className="text-left">
                                <span className="text-[#8033D9]">Para gestores e clubes</span>
                                <h2 className="font-light text-2xl lg:text-3xl mt-3">
                                    Planeje orçamentos com base em <br/>
                                    benchmarks reais e identifique gaps <br/>
                                    financeiros e oportunidades de crescimento.
                                </h2>
                            </div>
                            <div className="text-left">
                                <Link className="bg-gradient-to-r from-[#904EDE] to-[#4E2A78] gap-4 mr-0 px-5 flex items-center py-3 border border-[#A572E1] text-[#ffffff] rounded-full hover:brightness-110 transition-all" to="">Teste gratuito <ArrowUpRight className="w-3"></ArrowUpRight></Link>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black w-full relative rounded-2xl overflow-hidden flex items-end min-h-[400px]">
                        <div className="p-6 lg:p-12 flex-col text-left relative text-white w-full flex items-start gap-4">
                            <div className="text-left">
                                <span className="text-[#8033D9]">Para gestores e clubes</span>
                                <h2 className="font-light text-2xl lg:text-3xl mt-3">
                                    Planeje orçamentos com base em <br/>
                                    benchmarks reais e identifique gaps <br/>
                                    financeiros e oportunidades de crescimento.
                                </h2>
                            </div>
                            <div className="text-left">
                                <Link className="bg-gradient-to-r from-[#904EDE] to-[#4E2A78] gap-4 mr-0 px-5 flex items-center py-3 border border-[#A572E1] text-[#ffffff] rounded-full hover:brightness-110 transition-all" to="">Teste gratuito <ArrowUpRight className="w-3"></ArrowUpRight></Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-4 mt-4 lg:mt-8">
                    <div className="flex items-center justify-center gap-3 py-4 lg:py-6 rounded-sm bg-white border p-2">
                        <span className="font-light text-[#4E4E4F] lg:text-lg">Dados estruturados e comparáveis</span>
                    </div>

                    <div className="flex items-center justify-center gap-3 py-4 lg:py-6 rounded-sm bg-white border p-2">
                        <span className="font-light text-[#4E4E4F] lg:text-lg">Visualização clara e interativa</span>
                    </div>

                    <div className="flex items-center justify-center gap-3 py-4 lg:py-6 rounded-sm bg-white border p-2">
                        <span className="font-light text-[#4E4E4F] lg:text-lg">Atualizações constantes</span>
                    </div>
                </div>

            </div>
        </div>

        <div className="py-20 bg-black">
            <div className="container mx-auto px-6">
                <div className="w-full relative flex flex-col items-center">
                    <div className="lg:mb-6 mb-4 flex items-center gap-2 lg:gap-3 lg:px-6 lg:text-xl py-2 lg:py-3 px-4 bg-gradient-to-r from-[#FFFFFF00] to-[#99999953] rounded-full">
                        <img src={Icone}></img>
                        <span className="text-[#BFB2CD]">Por dentro</span>
                    </div>

                    <h1 class="font-light text-center lg:text-4xl xl:text-6xl xl:mb-4 text-center text-2xl leading-none bg-gradient-to-r from-[#FFFFFF] to-[#ffffff41] bg-clip-text text-transparent ">
                        O futebol evoluiu. <br/>
                        A análise financeira também<br/>
                         precisa evoluir.     
                    </h1>
                    <p className="lg:text-xl text-[#ffffffa6] text-center">
                        Dados financeiros, operacionais e comerciais de clubes e ligas do mundo 
                        inteiro — organizados, comparáveis e prontos para decisão.
                    </p>
                </div>
            </div>
        </div>
    </div>
    
    
  )
}