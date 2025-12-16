import { Outlet, Link } from "react-router-dom";
import { useContext, useState, useRef, useEffect} from "react";
import { AuthContext } from "../context/AuthContext";
import brand from "../assets/svg/brand-full.svg"
import HomeBanners from "../components/uxui/banner"
import FixedMenu from "../components/uxui/FixedMenu"
import MenuMaximo from "../components/uxui/MenuMaximo"
import { CircleX, Heart, Search, Cog } from "lucide-react";
import NotificationDropdown from "../components/notifications/NotificationDropdown";

export default function DashboardLayout() {
  const [openMenu, setOpenMenu] = useState(false)
  const menuRef = useRef(null);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;

    // só permite arrastar para esquerda
    if (diff < 0) {
      setTranslateX(diff);
    } 
  };

  // Quando carregar, ele ve se é maior que 1024 a tela 
  useEffect(() => {
    if (window.innerWidth > 1024) {
      setOpenMenu(true);
    }
  });

  const handleTouchEnd = () => {
    // se arrastar mais que 30% do menu, fecha
    if (Math.abs(translateX) > window.innerWidth * 0.25) {
      setOpenMenu(false);
    }

    // reseta posição
    setTranslateX(0);
  };

  // Sair 
  const { logout, user } = useContext(AuthContext);
    return (
        <div className="
          lg:flex lg:overflow-y-auto
          w-full h-screen bg-[#F6F5FA]">

            {/* Sidebar */}
            <div className="
                lg:border-r lg:relative top-0 lg:w-[300px]
                w-full ">
                <div className="lg:hidden flex flex-wrap items-center p-5">
                    <div className="w-1/2">
                        {/* Pega o logo da pasta assets */}
                        <img src={brand} alt="Brand" className="h-10" />
                    </div>
                    <div className="w-1/2 flex items-center justify-end">
                        <div className="flex"></div>
                        <span className="#0A0A0A">Modo</span>
                    </div>
                    <div className="mt-5 w-full border-b border-[#DADADA]"></div>
                </div>

                <div className="lg:hidden flex items-center flex-wrap items-center px-5">
                    <div className="w-1/4">
                        <button className="flex items-center flex-col gap-[5px]"
                            onClick={() => setOpenMenu(!openMenu)}
                        > 
                            <span className="bg-[#BA7FFF] h-[1px] w-[30px] inline-block"></span>
                            <span className="bg-[#BA7FFF] h-[1px] w-[30px] inline-block"></span>
                            <span className="bg-[#BA7FFF] h-[1px] w-[30px] inline-block"></span>
                        </button>
                    </div>


                    <div className="w-3/4 flex gap-2 items-center justify-end">
                        <h1 className="font-light text-base text-[#AFAFB2]">Bem vindo, <span className="text-[#0A0A0A]">{user.name.split(" ")[0]}</span></h1>
                        <span className="inline-block bg-[#CCF5C9] text-sm rounded-sm px-4 py-1">Plano X</span>
                    </div>
                </div>

                {/* Super menu expandido */}
                   {openMenu && (
                    <>
                      {/* Overlay */}
                      <div
                        className="
                        lg:hidden
                        fixed inset-0 bg-black/60 z-40"
                        onClick={() => setOpenMenu(false)}
                      />

                        {/* Menu */}
                        <div
                          ref={menuRef}
                          className="
                          lg:w-[300px]
                          lg:border-r
                          fixed top-0 left-0 z-50 bg-[#F6F5FA] h-screen w-3/4 
                          flex flex-col gap-2 items-center justify-start
                          transition-transform duration-300"
                          style={{ transform: `translateX(${translateX}px)` }}
                          onTouchStart={handleTouchStart}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                        >
                          {/* Conteúdo */}
                          <div className="flex flex-wrap items-center p-3">
                            <div className="w-1/2">
                                <img src={brand} alt="Brand" className="h-10" />
                            </div>
                            <div className="w-1/2 flex items-center justify-end">
                                <div className="flex"></div>
                                <CircleX 
                                  className="lg:hidden"
                                  onClick={() => setOpenMenu(false)}
                                  strokeWidth={1} size={20} color="#BA7FFF"></CircleX>
                            </div>
                            <div className="mt-2 w-full border-b border-[#DADADA]"></div>
                              <div className="w-full flex gap-2 items-center justify-start py-4">
                                <h1 className="lg:text-lg font-light text-base text-[#AFAFB2]">Bem vindo, <span className="text-[#0A0A0A]">{user.name.split(" ")[0]}</span></h1>
                                <span className="inline-block bg-[#CCF5C9] text-sm rounded-sm px-4 py-1">Plano X</span>
                            </div>

                            {/* Super Menu */}
                            <MenuMaximo></MenuMaximo>
                        </div>

                      </div>
                    </>
                  )}

            </div>

            <div className="lg:w-[calc(100%_-_300px)] lg:h-screen lg:overflow-y-auto lg:px-10 w-full p-5">
                  {/* Top Bar */}
                  <div className="hidden lg:block py-1 mb-5">
                    <div className="flex items-center flex-wrap justify-end">
                      <div className="w-1/2">
                    
                      </div>
                      <div className="w-1/2">
                        <div className="gap-2 flex items-center justify-end flex-wrap">
                            <NotificationDropdown />
                            <div className="text-center">
                                <button className="cursor-pointer transition-all group hover:bg-[#7F33D9] hover:border-[#7F33D9] border border-[#AFAFB2] rounded-full w-[50px] h-[50px] flex flex-col items-center justify-center">
                                    <Cog strokeWidth={1} className="text-[#7F33D9] group-hover:text-white transition-all w-[30px]"></Cog>
                                </button>
                            </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Banners */}
                  <HomeBanners></HomeBanners>

                  <Outlet />

                  {/* Menu Fixo */}
                  <FixedMenu mode={user.active}></FixedMenu>
                  
            </div>
    </div>
  );
}
