import { useLayoutEffect } from "react";
import { Outlet } from "react-router-dom";
import LogoWatermark from "../assets/img/footer-logo.png"
import { useTheme } from "../hooks/useTheme";

export default function AuthLayout() {
    const { isDark } = useTheme();

    // Login, cadastro, landing, planos e páginas legais já têm fundo e gradientes próprios e NÃO têm o botão
    // de tema: ficam sempre no visual claro. Só tira a classe `dark` do <html> enquanto esta tela está montada
    // (antes da pintura, p/ não piscar) e devolve ao sair, se o usuário estava no escuro.
    useLayoutEffect(() => {
        const root = document.documentElement;
        root.classList.remove("dark");
        root.style.colorScheme = "light";
        return () => {
            if (isDark) {
                root.classList.add("dark");
                root.style.colorScheme = "dark";
            }
        };
    }, [isDark]);

    return (
        <div className="min-h-screen w-full bg-black relative overflow-hidden flex flex-col justify-center items-center">
            <div className="xl:w-180 xl:h-180 xl:blur-4xl blur-3xl lg:w-120 lg:h-120 w-100 h-100 bg-[radial-gradient(50%_50%_at_50%_50%,_#7E34D9_0%,_rgba(126,52,217,0)_89%)] rounded-full absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="xl:blur-4xl blur-3xl lg:w-120 lg:h-120 w-100 h-100 bg-[radial-gradient(50%_50%_at_50%_50%,_#7E34D9_0%,_rgba(126,52,217,0)_89%)] rounded-full absolute top-0 right-0 translate-x-1/2 -translate-y-1/2"></div>
            <Outlet />

            {/* Rodapé */}
            <footer className="w-full relative overflow-hidden pt-20 pb-8 mt-auto z-10 bg-gradient-to-b from-[#0C0718] to-[#3F257E]">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-[500px] opacity-20 pointer-events-none blur-[120px] z-0"></div>
                <div className="container mx-auto px-6 relative z-10">
                    {/*
              <div className="w-full">
                  <img 
                      src={LogoWatermark} 
                      alt="Sportinsider Background" 
                      className="w-full lg:max-w-[90%] mx-auto"
                  />
              </div>

              <div className="flex flex-wrap justify-between py-8 lg:py-12 lg:w-3/5 xl:py-18">
                  <div className="flex flex-col gap-4 text-xs tracking-wider font-light text-[#FFFFFF99] uppercase">
                      <a href="#" className="hover:text-white transition-colors">Home</a>
                      <a href="#" className="hover:text-white transition-colors">Newsletter</a>
                      <a href="#" className="hover:text-white transition-colors">Vídeocast</a>
                      <a href="#" className="hover:text-white transition-colors">Relatórios</a>
                      <a href="#" className="hover:text-white transition-colors">Eventos</a>
                      <a href="#" className="hover:text-white transition-colors">Banco de Vagas</a>
                  </div>

                  <div className="flex flex-col gap-4 text-xs tracking-wider font-light text-[#FFFFFF99] uppercase">
                      <a href="#" className="hover:text-white transition-colors">O que é a Sportinsider</a>
                      <a href="#" className="hover:text-white transition-colors">Nossa Equipe</a>
                      <a href="#" className="hover:text-white transition-colors">Nossos Parceiros</a>
                      <a href="#" className="hover:text-white transition-colors">Anuncie</a>
                      <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
                      <a href="#" className="hover:text-white transition-colors">Preços</a>
                  </div>

                  <div className="flex flex-col gap-4">
                      <span className="text-xs tracking-wider font-light text-[#FFFFFF99] uppercase">Siga</span>
                      <div className="flex items-center gap-4">
                          <a href="#" className="bg-white text-[#0C0718] w-6 h-6 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.299z"/></svg>
                          </a>
                          <a href="#" className="bg-white text-[#0C0718] p-1 rounded hover:opacity-80 transition-opacity">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5S0 4.881 0 3.5C0 2.119 1.12 1 2.5 1s2.48 1.119 2.48 2.5zM5 8H0v16h5V8zm7.98 0H8v16h5v-8.381C13 7.26 16.98 7 16.98 12.5V24H22V11.5c0-6.5-4.5-7.5-9.02-5.5V8z"/></svg>
                          </a>
                          <a href="#" className="text-white hover:opacity-80 transition-opacity">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                          </a>
                          <a href="#" className="text-white hover:opacity-80 transition-opacity">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                          </a>
                          <a href="#" className="text-white hover:opacity-80 transition-opacity">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                          </a>
                      </div>
                  </div>
              </div>
              */}

                    <div className="w-full bg-[#FFFFFF0D] border border-[#FFFFFF33] rounded-full px-8 py-3 flex items-center justify-between text-xs text-[#FFFFFF99] backdrop-blur-md">
                        <span>Sportinsider todos os direitos reservados</span>
                        <span>2025</span>
                    </div>
                </div>
            </footer>

        </div>
    );
}
