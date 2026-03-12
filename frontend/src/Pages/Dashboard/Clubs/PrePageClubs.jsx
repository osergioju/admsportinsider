import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../services/api";

export default function PrePageClubs() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [theClub, setTheClub] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);
                const [theclubData] = await Promise.all([
                    api.get(`/admin/clubs/${id}`),
                ]);
                setTheClub(theclubData.data);
            } catch (err) {
                console.error("Erro ao carregar dashboard:", err);
            } finally {
                setLoading(false);
            }
        }
        loadDashboard();
    }, [id]);

    if (loading || !theClub) return null;

    const cards = [
        {
            title: "Finanças",
            desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
            route: `/dashboard/clubs/finance/${id}`,
        },
        {
            title: "Resultados esportivos",
            desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
            route: `/dashboard/clubs/competitions/${id}`,
        },
        {
            title: "Elenco principal",
            desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
            route: `/dashboard/clubs/club-players/${id}`,
        },
    ];

    return (
        <div
            className="w-full rounded-2xl p-8"
            style={{
                background: `linear-gradient(135deg, ${theClub.club.primary_color} 40%, ${theClub.club.secondary_color || "#FFF5F5"} 100%)`,
            }}
        >
            {/* Header */}
            <div className="flex items-center gap-6 pb-6">
                <div className="w-20 h-20 flex-shrink-0">
                    <img
                        src={theClub?.club.crest_url}
                        alt=""
                        className="w-full h-full object-contain drop-shadow-lg"
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <h1 className="text-white text-2xl font-bold drop-shadow">
                        {theClub?.club.name}
                    </h1>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { icon: "", label: "Fundação", value: "21 de agosto de 1898 | 127 anos" },
                            { icon: "", label: "Estadio", value: "São Januário" },
                            { icon: "", label: "Estrutura societária", value: "SAF" },
                        ].map((badge) => (
                            <span
                                key={badge.label}
                                className="flex items-center gap-2 text-white text-sm px-3 py-1.5 rounded-full"
                                style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
                            >
                                <span>{badge.icon}</span>
                                <span>{badge.label} | <strong>{badge.value}</strong></span>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="ml-auto relative">
                    <span className="text-3xl">
                         <div className="overflow-hidden absolute bg-black rounded-full w-5 h-5 lg:w-10 lg:h-10 right-4 top-4">
                            <img className="h-full" src={theClub.club.flag_url} alt="" />
                        </div>
                    </span>
                </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-3 gap-6 mt-6">
                {cards.map((card) => (
                    <div
                        key={card.title}
                        className="rounded-2xl p-6 flex flex-col justify-between min-h-64"
                        style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}
                    >
                        <div>
                            <h2 className="text-white text-xl font-bold mb-3 drop-shadow">
                                {card.title}
                            </h2>
                            <p className="text-white/80 text-sm leading-relaxed">
                                {card.desc}
                            </p>
        </div>
                        <button
                            onClick={() => navigate(card.route)}
                            className="cursor-pointer mt-6 self-start bg-black/70 hover:bg-black text-white text-sm px-5 py-2.5 rounded-full flex items-center gap-1 transition-colors"
                        >
                            Ver mais
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}