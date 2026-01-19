import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../services/api";

export default function DashLeagues() {
    const [search, setSearch] = useState("");
    const [country, setCountry] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const [listCountries, setListCountries] = useState([]);
    const [loadingCountries, setLoadingCountries] = useState(true);

    const [clubs, setClubs] = useState([]);
    const [loadingClubs, setLoadingClubs] = useState(false);

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

            const { data } = await api.post("/admin/leagues/search", {
                name: search || null,
                country: country || null
            });

            setClubs(data.leagues);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingClubs(false);
        }
    }

    return (
        <div className="w-full">
            <div className="w-full p-6 lg:p-10 border bg-white rounded-xl shadow-sm">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-light text-[#111]">
                        Ligas
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Busque por nome ou filtre pelo país
                    </p>
                </div>

                {/* Filtros */}
                <div className="flex flex-col lg:flex-row gap-4 items-end">
                    {/* Busca por nome */}
                    <div className="w-full">
                        <label className="block text-sm text-gray-600 mb-1">
                            Nome da liga
                        </label>
                        <input
                            type="text"
                            placeholder="Ex: La Liga"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Filtro por país */}
                    <div className="w-full lg:w-64">
                        <label className="block text-sm text-gray-600 mb-1">
                            País
                        </label>

                        <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            disabled={loadingCountries}
                            className={`w-full px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
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
                        className="px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition font-medium"
                    >
                        Buscar
                    </button>
                </div>

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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {clubs.map((club) => (
                                    <Link
                                        key={club.id_league}
                                        to={`/dashboard/league/${club.id_league}`}
                                        className="group border rounded-xl p-5 hover:shadow-md transition bg-white"
                                    >
                                        <h2 className="text-lg font-medium text-[#111] group-hover:text-purple-600">
                                            {club.name}
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {club.country}
                                        </p>
                                        <span className="inline-block mt-4 text-sm text-purple-600 group-hover:underline">
                                            Ver detalhes →
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
