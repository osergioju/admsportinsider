import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Blackout from "../assets/img/blackout.png";
import Tela from "../assets/img/tela.png";
import Icone from "../assets/img/icone.png";

export default function FrontPage() {
  return (

    <div className="w-full bg-[#030015]">
        <div className="pt-20 pb-2 w-full relative ">
            <h1 class="font-light text-center lg:text-4xl xl:text-6xl xl:mb-4 text-center text-2xl leading-none bg-gradient-to-r from-[#FFFFFF] to-[#ffffff41] bg-clip-text text-transparent ">
                O centro global de inteligência<br />
                financeira do futebol                
            </h1>
            <p className="lg:text-xl text-[#ffffffa6] text-center">
                Dados financeiros, operacionais e comerciais de clubes e ligas do mundo 
                inteiro — organizados, comparáveis e prontos para decisão.
            </p>
            <div className="flex mt-4 gap-2 lg:gap-5 lg:mt-8 items-center justify-center">
                <Link className="bg-gradient-to-r from-[#904EDE] to-[#4E2A78] px-6 flex items-center gap-3 py-4 border border-[#A572E1] text-[#ffffff] rounded-full" to="">Teste gratuito <ArrowUpRight className="w-3"></ArrowUpRight></Link>
                <Link className="px-6 flex items-center gap-3 py-4 border border-[#A572E1] text-[#A572E1] rounded-full" to="">Cadastre-se <ArrowUpRight className="w-3"></ArrowUpRight></Link>
            </div>
        </div>
        
        <div className="w-full bg-white bg-gradient-home relative mt-">
            <img className="mx-auto w-full max-w-[600px]" src={Blackout}></img>
            <img className="mx-auto w-full max-w-[1200px] -mt-14" src={Tela}></img>
        </div>

        <div className="py-20 bg-[#F2F1F1] w-full">
            <div className="container mx-auto px-6">
                <div className="text-left flex flex-col items-start">
                    <div className="lg:mb-6 mb-4 flex items-center gap-2 lg:gap-3 lg:px-6 lg:text-xl py-2 px-4 border bg-white rounded-full">
                        <img src={Icone}></img>
                        <span className="text-[#8033D9]">Informação existe. Inteligência, não.</span>
                    </div>
                    
                    <h2 className="mb-4 text-3xl lg:text-4xl xl:text-5xl  text-[#1B1917]">
                        O futebol gera bilhões — mas os<br>
                        </br>dados continuam fragmentados
                    </h2>
                    <p className="text-sm lg:text-lg text-[#0A0A0AB2]">
                        O Sportinsider centraliza dados financeiros, operacionais e comerciais de clubes e ligas em um único ambiente visual, comparável e atualizado.
                    </p>
                </div>
            </div>
        </div>

        <div className="pb-20 bg-[#F2F1F1] w-full">
            <div className="container mx-auto px-6">
                <div className="grid lg:grid-cols-3 gap-4">
                    
                    <div className="border p-4 lg:p-8 rounded-xl">
                        <span class="text-sm text-[#8033D9] font-[500] lg:text-lg">Receitas e custos operacionais</span>
                        <h3 className="mt-3 text-[#1B1917] font-[500] text-sm lg:text-2xl mb-3 lg:mb-5">
                            Entenda de onde vem 
                            o dinheiro e para onde ele vai — 
                            por clube, liga e temporada.
                        </h3>
                    </div>
                    
                    <div className="border p-4 lg:p-8 rounded-xl">
                        <span class="text-sm text-[#8033D9] font-[500] lg:text-lg">Direitos de transmissão</span>
                        <h3 className="mt-3 text-[#1B1917] font-[500] text-sm lg:text-2xl mb-3 lg:mb-5">
                            Compare contratos, distribuição e impacto financeiro entre mercados.
                        </h3>
                    </div>

                    <div className="border p-4 lg:p-8 rounded-xl">
                        <span class="text-sm text-[#8033D9] font-[500] lg:text-lg">Comparativos inteligentes</span>
                        <h3 className="mt-3 text-[#1B1917] font-[500] text-sm lg:text-2xl mb-3 lg:mb-5">
                            Coloque clubes e ligas lado a lado e descubra vantagens competitivas.
                        </h3>
                    </div>

                </div>

                <div className="overflow-hidden text-center mt-4 border pt-4 lg:pt-8 rounded-xl">
                    <span class="text-sm text-[#8033D9] font-[500] lg:text-lg">Cobertura global</span>
                    <h3 className="mt-3 text-[#1B1917] font-[500] text-sm lg:text-2xl mb-3 lg:mb-5">
                        Dados de praticamente todas as grandes ligas do mundo.
                    </h3>

                    <div className="mt-4 lg:mt-10 w-full bg-white p-10"></div>
                </div>

            </div>
        </div>


        <div className="py-20 bg-[#EBEBEF] w-full">
            <div className="container mx-auto px-6">
                <div className="text-left flex flex-col items-start mb-4">
                    <div className="lg:mb-6 mb-4 flex items-center gap-2 lg:gap-3 lg:px-6 lg:text-xl py-2 px-4 border bg-white rounded-full">
                        <img src={Icone}></img>
                        <span className="text-[#8033D9]">Por dentro</span>
                    </div>
                    
                    <h2 className="mb-4 text-3xl lg:text-4xl xl:text-5xl  text-[#1B1917]">
                        Como o Sportinsider
                        transforma dados em decisãos        
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
                            <Link className="bg-gradient-to-r from-[#904EDE] to-[#4E2A78] px-6 flex items-center gap-3 py-4 border border-[#A572E1] text-[#ffffff] rounded-full" to="">Teste gratuito <ArrowUpRight className="w-3"></ArrowUpRight></Link>
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
                                <Link className="bg-gradient-to-r from-[#904EDE] to-[#4E2A78] px-6 flex items-center gap-3 py-4 border border-[#A572E1] text-[#ffffff] rounded-full" to="">Teste gratuito <ArrowUpRight className="w-3"></ArrowUpRight></Link>
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
                                <Link className="bg-gradient-to-r from-[#904EDE] to-[#4E2A78] px-6 flex items-center gap-3 py-4 border border-[#A572E1] text-[#ffffff] rounded-full" to="">Teste gratuito <ArrowUpRight className="w-3"></ArrowUpRight></Link>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>


      <div className="py-20 w-full">
        <div className="w-5/6 max-w-3xl mx-auto p-10 bg-white rounded-3xl ">
            <h3 className="mb-5 text-3xl font-bold">Links maneiros pra testar</h3>
            <ul className="border-b border-[#e5e7eb] pb-3 mb-3">
                <span className="text-xl font-bold mb-2">Usuário comum</span>
                <li><Link to="/login" className="py-2 inline-block py-2 inline-block cursor-pointer hover:text-gray-300">Login</Link></li>
                <li><Link to="/register" className="py-2 inline-block cursor-pointer hover:text-gray-300">Cadastrar</Link></li>
                <li><Link to="/pricing" className="py-2 inline-block cursor-pointer hover:text-gray-300">Planos</Link></li>
                <li><Link to="/reset-password" className="py-2 inline-block cursor-pointer hover:text-gray-300">Trocar a senha</Link></li>
                <li><Link to="/login" className="py-2 inline-block cursor-pointer hover:text-gray-300">Dashboard user (página logada)</Link></li>
            </ul>

            <ul className="border-b border-[#e5e7eb] pb-3 mb-3">
                <span className="text-xl font-bold mb-2">Admin</span>
                <li><Link to="/login" className="py-2 inline-block cursor-pointer hover:text-gray-300">Login</Link></li>
                <li><Link to="/login" className="py-2 inline-block cursor-pointer hover:text-gray-300">Trocar a senha</Link></li>
                <li><Link to="/login" className="py-2 inline-block cursor-pointer hover:text-gray-300">Dashboard adm (página logada)</Link></li>
            </ul>
        </div>
      </div>
    </div>
    
    
  )
}