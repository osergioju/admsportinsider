import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../services/api";
import bgimage from "../../../assets/img/bg-clubs.jpg";
import {ChevronRight, Loader2} from "lucide-react"

export default function DashClubs() {

    const [search, setSearch] = useState("");
    const [country, setCountry] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const [listCountries, setListCountries] = useState([]);
    const [loadingCountries, setLoadingCountries] = useState(true);

    const [clubs, setClubs] = useState([]);
    const [loadingClubs, setLoadingClubs] = useState(false);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

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

    useEffect(() => {
        getCountries();
    }, []);


    async function handleSearch() {
        try {
            setLoadingClubs(true);
            setSubmitted(true);

            const { data } = await api.post(
            `/admin/clubs/search?page=${page}`,
                {
                    name: search || null,
                    country: country || null
                }
            );

            setClubs(data.clubs);
            setTotalPages(data.pagination.totalPages);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingClubs(false);
        } 
    }

    useEffect(() => {
        if (submitted) {
            handleSearch();
        }
    }, [page]);

    return (
        <div className="w-full">
            <div className="relative overflow-hidden w-full p-2 px-6 rounded-tl-lg rounded-tr-lg bg-cover bg-center"
             style={{ backgroundImage: `url(${bgimage})` }}
            >
                <div className="w-full absolute h-full bg-black top-0 left-0 opacity-40"></div>
                <div className="w-full p-8  flex flex-col justify-center relative">
                    <h2 className="text-white text-xl mb-2 lg:text-2xl lg:font-[300]">Todos os clubes</h2>
                    <p className="text-white font-light">Busque por nome ou filtre pelo país</p>
                </div>
            </div>
            <div className="w-full p-6 lg:px-12 border bg-white rounded-bl-lg rounded-br-lg">
                {/* Filtros */}
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                    {/* Busca por nome */}
                    <div className="lg:w-1/3">
                        <input
                            type="text"
                            placeholder="Nome do clube"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="lg:text-lg lg:font-light text-sm w-full px-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Filtro por país */}
                    <div className="w-full lg:w-64">
                        <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            disabled={loadingCountries}
                            className={`lg:text-lg lg:font-light text-sm w-full px-4 py-3 border rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                loadingCountries
                                    ? "opacity-60 cursor-not-allowed"
                                    : ""
                            }`}
                        >
                            {loadingCountries ? (
                                <option>Carregando países...</option>
                            ) : (
                                <>
                                    <option value="">
                                        Todos os países
                                    </option>
                                    {listCountries.map((c) => (
                                        <option
                                            key={c.id_country}
                                            value={c.id_country}
                                        >
                                            {c.name}
                                        </option>
                                    ))}
                                </>
                            )}
                        </select>
                    </div>

                    {/* Botão */}
                    <button
                        onClick={handleSearch}
                        className="cursor-pointer lg:px-8 xl:px-10 px-6 py-3 bg-black rounded-full font-light text-white hover:bg-[#7F33D9] transition"
                    >
                        Buscar
                    </button>
                </div>

                {/* Resulatdo padrão, agrupado por país */}
                {
                    submitted && (
                        <div className="mt-8 w-full flex flex-col gap-2">
                            <div className="w-full p-4 border rounded-3xl">
                                <div className="flex items-center gap-3">
                                    {clubs.map((club) => (
                                        <Link
                                            key={club.id_club}
                                            to={`/dashboard/clubs/${club.id_club}`}
                                            className="bg-black flex items-center w-1/2 lg:w-1/3 rounded-3xl"
                                        >
                                            <div className="w-20 h-20 lg:h-30 xl:h-40 p-2 lg:p-4 xl:p-7"
                                                style={{
                                                background: `linear-gradient(135deg, ${club.primary_color} 60%, ${club.secondary_color} 160%)`
                                                }}>
                                                <div className="relative bg-contain bg-center bg-no-repeat w-full h-full"
                                                    style={{ backgroundImage: `url(${club.crest_url})` }}
                                                >
                                                    <div className="w-5 h-5 lg:w-8 lg:h-8 bg-black rounded-full absolute right-0 top-0 translate-x-3 -translate-y-3 bg-center bg-cover"
                                                    style={{ backgroundImage: `url(${club.flag_url})` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="text-center p-2 lg:p-6">
                                                <h2 className="text-lg lg:text-xl xl:text-2xl font-light text-[#111]">
                                                    {club.name}
                                                </h2>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {club.country}
                                                </p>
                                                <span className="hover:text-white hover:bg-black transition-all rounded-full px-4 py-3 lg:px-6 inline-block mt-4 text-sm text-[#000000] border border-[#000000]">
                                                    Ver detalhes →
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                }
                {/* Resultado */}
                {submitted && (
                    <div className="mt-10">
                        {loadingClubs ? (
                            <p className="text-sm text-gray-500">
                                Buscando clubes...
                            </p>
                        ) : clubs.length === 0 ? (
                            <p className="text-gray-500 text-sm">
                                Nenhum clube encontrado.
                            </p>
                        ) : (
                            <div className="w-full">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                    {clubs.map((club) => (
                                        <Link
                                            key={club.id_club}
                                            to={`/dashboard/clubs/${club.id_club}`}
                                            className="rounded-xl overflow-hidden group border rounded-xl transition bg-white"
                                        >
                                            <div className="w-full h-20 lg:h-30 xl:h-40 p-2 lg:p-4 xl:p-7"
                                                style={{
                                                background: `linear-gradient(135deg, ${club.primary_color} 60%, ${club.secondary_color} 160%)`
                                                }}>
                                                <div className="relative bg-contain bg-center bg-no-repeat w-full h-full"
                                                    style={{ backgroundImage: `url(${club.crest_url})` }}
                                                >
                                                    <div className="w-5 h-5 lg:w-8 lg:h-8 bg-black rounded-full absolute right-0 top-0 translate-x-3 -translate-y-3 bg-center bg-cover"
                                                    style={{ backgroundImage: `url(${club.flag_url})` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="text-center p-2 lg:p-6">
                                                <h2 className="text-lg lg:text-xl xl:text-2xl font-light text-[#111]">
                                                    {club.name}
                                                </h2>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {club.country}
                                                </p>
                                                <span className="hover:text-white hover:bg-black transition-all rounded-full px-4 py-3 lg:px-6 inline-block mt-4 text-sm text-[#000000] border border-[#000000]">
                                                    Ver detalhes →
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                
                                <div className="flex justify-end gap-2 mt-8">
                                    <button
                                        disabled={page === 1}
                                        onClick={() => setPage(page - 1)}
                                        className="cursor-pointer transition-all hover:bg-black hover:border-black group rounded-full px-2 py-2 border rounded disabled:opacity-40"
                                    >
                                        <ChevronRight className="rotate-180 transition-all group-hover:text-white" />
                                    </button>

                                    <span className="px-4 py-2 text-sm">
                                        Página {page} de {totalPages}
                                    </span>

                                    <button
                                        disabled={page === totalPages}
                                        onClick={() => setPage(page + 1)}
                                        className="cursor-pointer transition-all hover:bg-black hover:border-black group rounded-full px-2 py-2 border rounded disabled:opacity-40"
                                    >
                                        <ChevronRight className="transition-all group-hover:text-white" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
