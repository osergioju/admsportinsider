import { renderToString } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PrePageClubs from "./Pages/Dashboard/Clubs/PrePageClubs";
import { formatFinancial } from "./utils/formatFinancial";

function buildClubMeta(initialData) {
    const club = initialData?.theClub?.club;
    const revenues = (initialData?.financials?.revenues || []).filter(r => r.code === "revenue");
    const latestRev = [...revenues]
        .filter(r => r.value != null && Number(r.value) !== 0)
        .sort((a, b) => b.year - a.year)[0];

    const clubName = club?.name || "Clube";
    const currency = initialData?.financials?.currency || "BRL";

    const title = `${clubName} - Indicadores financeiros | PRO - Sportinsider`;
    const description = latestRev
        ? `Confira os indicadores financeiros do ${clubName}: receita de ${formatFinancial(latestRev.value, currency, "pt-BR")} em ${latestRev.year}, dívidas, resultado líquido e mais.`
        : `Indicadores financeiros, receitas, dívidas e resultado líquido do ${clubName}.`;

    return { title, description };
}

export function renderClubPage({ id, slug, initialData }) {
    const path = slug ? `/dashboard/clubs/${id}/${slug}` : `/dashboard/clubs/${id}`;

    const html = renderToString(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/dashboard/clubs/:id/:slug?" element={<PrePageClubs initialData={initialData} />} />
            </Routes>
        </MemoryRouter>
    );

    const { title, description } = buildClubMeta(initialData);

    return { html, title, description };
}
