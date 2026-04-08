import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../services/api";
import { ChevronRight, ChevronLeft, Globe, Loader2, Heart} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { useFavorites } from "../../../hooks/useFavorites";
import "swiper/css";
import "swiper/css/navigation";

export default function DashLeagues() {
    const { isFavorited, toggleFavorite } = useFavorites();
    const [search, setSearch] = useState("");
    const [country, setCountry] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const [listCountries, setListCountries] = useState([]);
    const [loadingCountries, setLoadingCountries] = useState(true);
    const [leagues, setLeagues] = useState([]);
    const [loadingLeagues, setLoadingLeagues] = useState(false);
    const [groupedLeagues, setGroupedLeagues] = useState([]);

    const getInitials = (name) => {
        if (!name) return "";
        return name.substring(0, 3).toUpperCase();
    };

    const groupLeaguesByCountry = (leaguesList) => {
        if (!leaguesList) return [];
        const grouped = leaguesList.reduce((acc, league) => {
            const countryName = league.country_name || league.country || "Outros";
            const flagUrl = league.flag_url || null;
            if (!acc[countryName]) {
                acc[countryName] = {
                    country_name: countryName,
                    id_country: league.id_country || countryName,
                    flag_url: flagUrl,
                    leagues: []
                };
            }
            acc[countryName].leagues.push(league);
            return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => a.country_name.localeCompare(b.country_name));
    };

    async function getCountries() {
        try {
            setLoadingCountries(true);
            const { data } = await api.get("/dashboard/countries");
            setListCountries(data.countries);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingCountries(false);
        }
    }

    async function fetchInitialLeagues() {
        try {
            setLoadingLeagues(true);
            const { data } = await api.post("/dashboard/leagues/search", { name: null, country: null });
            setGroupedLeagues(groupLeaguesByCountry(data.leagues));
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingLeagues(false);
        }
    }

    useEffect(() => {
        getCountries();
        fetchInitialLeagues();
    }, []);

    async function handleSearch() {
        if (!search && !country) {
            setSubmitted(false);
            return;
        }
        try {
            setLoadingLeagues(true);
            setSubmitted(true);
            const { data } = await api.post("/dashboard/leagues/search", { name: search || null, country: country || null });
            setLeagues(groupLeaguesByCountry(data.leagues));
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingLeagues(false);
        }
    }

    return (
        <div className="w-full pb-20">
            {/* --- HEADER (Padrão Original com Font-Light) --- */}
            <div className="w-full p-6 lg:p-10 border bg-white rounded-xl shadow-sm mb-10">
                <div className="mb-8">
                    <h2 className="text-[#111] text-xl mb-2 lg:text-2xl lg:font-[300]">Ligas</h2>
                    <p className="text-gray-500 font-light">Busque por nome ou filtre pelo país</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 items-end">
                    <div className="w-full">
                        <label className="block text-sm text-gray-600 mb-1">Nome da liga</label>
                        <input
                            type="text"
                            placeholder="Ex: La Liga"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-light"
                        />
                    </div>

                    <div className="w-full lg:w-64">
                        <label className="block text-sm text-gray-600 mb-1">País</label>
                        <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            disabled={loadingCountries}
                            className="w-full px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-light"
                        >
                            <option value="">Todos os países</option>
                            {!loadingCountries && listCountries.map((c) => (
                                <option key={c.id ?? c.id_country} value={c.id ?? c.id_country}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <button onClick={handleSearch} className="px-8 py-2 bg-black text-white rounded-full font-light hover:bg-[#7F33D9] transition shadow-md">
                        Buscar
                    </button>
                </div>
            </div>

            {/* --- CONTAINER DAS LIGAS --- */}
            <div className="w-full p-6 lg:px-12 border bg-white rounded-xl">
                {loadingLeagues ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="animate-spin text-purple-600 mb-4" size={40} />
                        <p className="text-gray-400 font-light">Buscando informações...</p>
                    </div>
                ) : (
                    (submitted ? leagues : groupedLeagues).map((item) => (
                        <div key={item.id_country} className="mb-12 mt-6">
                            {/* País Header */}
                            <div className="flex items-center gap-3 mb-5 px-2">
                                {item.flag_url ? (
                                    <img src={item.flag_url} className="w-8 h-5 object-cover rounded shadow-sm" alt="" />
                                ) : (
                                    <Globe size={18} className="text-gray-400" />
                                )}
                                <h2 className="text-xl font-bold tracking-tight text-gray-900">{item.country_name}</h2>
                                <span className="text-sm text-gray-400 font-normal">{item.leagues.length} ligas</span>
                            </div>

                            {/* Container Swiper com Padding para evitar cortes no hover */}
                            <div className="relative group px-2 py-4">
                                <button className={`swiper-prev-${item.id_country} absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50`}>
                                    <ChevronLeft size={18} className="text-gray-600" />
                                </button>
                                <button className={`swiper-next-${item.id_country} absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50`}>
                                    <ChevronRight size={18} className="text-gray-600" />
                                </button>

                                <Swiper
                                    modules={[Navigation]}
                                    slidesPerView={5}
                                    spaceBetween={16}
                                    navigation={{ prevEl: `.swiper-prev-${item.id_country}`, nextEl: `.swiper-next-${item.id_country}` }}
                                    breakpoints={{
                                        320: { slidesPerView: 1.3, spaceBetween: 12 },
                                        640: { slidesPerView: 2.3, spaceBetween: 14 },
                                        1024: { slidesPerView: 4, spaceBetween: 16 },
                                        1280: { slidesPerView: 5, spaceBetween: 16 },
                                    }}
                                >
                                    {item.leagues.map((league) => (
                                        <SwiperSlide key={league.id_league} className="!h-auto py-2">
                                            <Link to={`/dashboard/league/${league.id_league}`} className="block group/card h-full">
                                                <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 ease-out h-full">

                                                    {/* Topo do Card - Cor Sólida */}
                                                    <div
                                                    className="h-36 flex items-center justify-center p-5 relative"
                                                    style={{ backgroundColor: league.primary_color || '#7F33D9' }}
                                                    >

                                                    {/* Botão Favoritar */}
                                                    <button
                                                        onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        toggleFavorite(league.id_league, "league");
                                                        }}
                                                        className="cursor-pointer absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-all duration-200"
                                                        aria-label="Favoritar liga"
                                                    >
                                                        <Heart
                                                        size={14}
                                                        strokeWidth={2}
                                                        className="text-white transition-all duration-200"
                                                        fill={isFavorited(league.id_league, "league") ? "white" : "transparent"}
                                                        />
                                                    </button>

                                                    {/* Efeito Glass sutil no container do logo */}
                                                    <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-inner group-hover/card:scale-110 transition-transform duration-500">
                                                        {league.logo_url ? (
                                                        <img src={league.logo_url} alt={league.name} className="w-16 h-16 object-contain drop-shadow-md" />
                                                        ) : (
                                                        <span className="text-white font-bold text-xl italic tracking-tighter">
                                                            {getInitials(league.name)}
                                                        </span>
                                                        )}
                                                    </div>
                                                    </div>

                                                    {/* Nome */}
                                                    <div className="px-4 py-4 text-center">
                                                    <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2">
                                                        {league.name}
                                                    </p>
                                                    </div>

                                                </div>
                                                </Link>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}