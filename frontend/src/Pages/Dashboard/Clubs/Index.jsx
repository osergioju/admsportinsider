import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../services/api";
import bgimage from "../../../assets/img/bg-clubs.jpg";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

export default function DashClubs() {
    const [search, setSearch] = useState("");
    const [country, setCountry] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [groupedClubs, setGroupedClubs] = useState([]);
    const [listCountries, setListCountries] = useState([]);
    const [loadingCountries, setLoadingCountries] = useState(true);

    const [clubs, setClubs] = useState([]);
    const [loadingClubs, setLoadingClubs] = useState(false);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const getInitials = (name) => {
        if (!name) return "";
        return name.substring(0, 3).toUpperCase();
    };

    async function getCountries() {
        try {
            setLoadingCountries(true);
            const { data } = await api.get("/admin/countries");
            setListCountries(data.countries);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingCountries(false);
        }
    }

    async function handleSearch() {
        try {
            setLoadingClubs(true);
            setSubmitted(true);
            const { data } = await api.post(
                `/admin/clubs/search?page=${page}`,
                { name: search || null, country: country || null }
            );
            setClubs(data.clubs);
            setTotalPages(data.pagination.totalPages);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingClubs(false);
        }
    }

    async function fetchGroupedClubs() {
        try {
            const { data } = await api.get("/admin/clubs-grouped-by-country");
            setGroupedClubs(data);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        getCountries();
        fetchGroupedClubs();
    }, []);

    useEffect(() => {
        if (submitted) handleSearch();
    }, [page]);

    return (
        <div className="w-full pb-20 bg-[#F9FAFB]">
            {/* Header Banner */}
            <div className="relative overflow-hidden w-full p-2 px-6 rounded-tl-lg rounded-tr-lg bg-cover bg-center"
                style={{ backgroundImage: `url(${bgimage})` }}
            >
                <div className="w-full absolute h-full bg-black top-0 left-0 opacity-40"></div>
                <div className="w-full p-8 flex flex-col justify-center relative">
                    <h2 className="text-white text-xl mb-2 lg:text-2xl lg:font-[300]">Todos os clubes</h2>
                    <p className="text-white font-light">Busque por nome ou filtre pelo país</p>
                </div>
            </div>

            <div className="w-full p-6 lg:px-12 border bg-white rounded-bl-lg rounded-br-lg">
                {/* Filtros */}
                <div className="flex flex-col lg:flex-row gap-4 items-center mb-10">
                    <div className="lg:w-1/3 w-full">
                        <input
                            type="text"
                            placeholder="Nome do clube"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="lg:text-sm text-sm w-full px-5 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-light"
                        />
                    </div>

                    <div className="w-full lg:w-64">
                        <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            disabled={loadingCountries}
                            className="text-sm w-full px-5 py-3 border border-gray-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60 font-light"
                        >
                            <option value="">Todos os países</option>
                            {!loadingCountries && listCountries.map((c) => (
                                <option key={c.id_country} value={c.id_country}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleSearch}
                        className="w-full lg:w-auto px-10 py-3 bg-[#111] rounded-full text-sm font-light text-white hover:bg-[#7F33D9] transition-all shadow-lg"
                    >
                        Buscar
                    </button>
                </div>

                {/* --- RESULTADOS AGRUPADOS (CARROSSEL) --- */}
                {!submitted && groupedClubs.map((country) => (
                    <div key={country.id_country} className="mb-12 mt-6">
                        {/* Header do País - Usando font-bold e tracking-tight como na página de ligas */}
                        <div className="flex items-center gap-3 mb-6 px-2">
                            <img src={country.flag_url} alt={country.country_name} className="w-8 h-5 object-cover rounded shadow-sm" />
                            <h2 className="text-xl font-bold tracking-tight text-gray-900">{country.country_name}</h2>
                            <span className="text-sm text-gray-400 font-normal">{country.clubs.length} clubes</span>
                        </div>

                        <div className="relative group px-2 py-4">
                            {/* Botões de Navegação */}
                            <button className={`swiper-prev-${country.id_country} absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50`}>
                                <ChevronLeft size={18} className="text-gray-600" />
                            </button>
                            <button className={`swiper-next-${country.id_country} absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50`}>
                                <ChevronRight size={18} className="text-gray-600" />
                            </button>

                            <Swiper
                                modules={[Navigation]}
                                slidesPerView={5}
                                spaceBetween={16}
                                navigation={{
                                    prevEl: `.swiper-prev-${country.id_country}`,
                                    nextEl: `.swiper-next-${country.id_country}`,
                                }}
                                breakpoints={{
                                    320: { slidesPerView: 1.3, spaceBetween: 12 },
                                    640: { slidesPerView: 2.3, spaceBetween: 14 },
                                    1024: { slidesPerView: 4, spaceBetween: 16 },
                                    1280: { slidesPerView: 5, spaceBetween: 16 },
                                }}
                            >
                                {country.clubs.map((club) => (
                                    <SwiperSlide key={club.id_club} className="!h-auto py-2">
                                        <Link to={`/dashboard/clubs/${club.id_club}`} className="block group/card h-full">
                                            <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 h-full">
                                                
                                                {/* Header do Card (Cor Primária) */}
                                                <div 
                                                    className="h-36 flex items-center justify-center p-5 relative"
                                                    style={{ backgroundColor: club.primary_color || '#7F33D9' }}
                                                >
                                                    <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-inner group-hover/card:scale-110 transition-transform duration-500">
                                                        {club.crest_url ? (
                                                            <img src={club.crest_url} alt={club.name} className="w-14 h-14 object-contain drop-shadow-2xl" />
                                                        ) : (
                                                            <span className="text-white font-black text-xl tracking-tighter italic">
                                                                {getInitials(club.name)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Informações do Clube */}
                                                <div className="p-5 text-center">
                                                    <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-1 group-hover/card:text-[#7F33D9] transition-colors">
                                                        {club.name}
                                                    </p>
                                                    <div className="mt-2 flex items-center justify-center gap-1.5 opacity-60">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ativo</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    </div>
                ))}

                {/* --- RESULTADO DA BUSCA MANUAL --- */}
                {submitted && (
                    <div className="mt-10">
                        {loadingClubs ? (
                            <div className="flex flex-col items-center py-20">
                                <Loader2 className="animate-spin text-[#7F33D9] mb-4" size={32} />
                                <p className="text-gray-400 font-light">Buscando clubes...</p>
                            </div>
                        ) : clubs.length === 0 ? (
                            <p className="text-gray-500 text-center py-20 font-light">Nenhum clube encontrado.</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 py-6">
                                {clubs.map((club) => (
                                    <Link key={club.id_club} to={`/dashboard/clubs/${club.id_club}`} className="group/card block">
                                        <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                                            <div className="h-40 flex items-center justify-center relative overflow-hidden" 
                                                 style={{ backgroundColor: club.primary_color || '#111' }}>
                                                <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 shadow-inner group-hover/card:scale-105 transition-transform duration-500">
                                                    {club.crest_url ? (
                                                        <img src={club.crest_url} className="w-16 h-16 object-contain drop-shadow-2xl" alt={club.name} />
                                                    ) : (
                                                        <span className="text-white font-black text-2xl italic">{getInitials(club.name)}</span>
                                                    )}
                                                </div>
                                                <div className="absolute top-4 right-4 w-7 h-7 rounded-full border-2 border-white shadow-sm overflow-hidden">
                                                    <img src={club.flag_url} className="w-full h-full object-cover" alt="flag" />
                                                </div>
                                            </div>
                                            <div className="p-6 text-center">
                                                <h3 className="text-base font-semibold text-gray-900 mb-1">{club.name}</h3>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{club.country}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                        
                        {/* Paginação */}
                        {!loadingClubs && clubs.length > 0 && (
                            <div className="flex items-center justify-center gap-6 mt-12">
                                <button 
                                    disabled={page === 1} 
                                    onClick={() => setPage(page - 1)}
                                    className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#7F33D9] hover:border-[#7F33D9] transition-all disabled:opacity-30 cursor-pointer"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="text-sm font-light text-gray-500 tracking-wide">Página {page} de {totalPages}</span>
                                <button 
                                    disabled={page === totalPages} 
                                    onClick={() => setPage(page + 1)}
                                    className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#7F33D9] hover:border-[#7F33D9] transition-all disabled:opacity-30 cursor-pointer"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function Loader2({ className, size }) {
    return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}