// Dados da testeira que ainda não existem (ou vêm vazios) no cadastro dos clubes.
//
// SIMULAÇÃO (temporária, p/ avaliar o layout): enquanto SIMULATE_MISSING_FACTS estiver ligado, o que faltar
// no cadastro é preenchido com um valor de exemplo (estável por clube) e a testeira mostra "dados simulados".
//  • Data de fundação  → usa `founded_at` real; se vazio, simula.
//  • Estrutura societária → usa `ownership_model` real (hoje vazio em todos os clubes); se vazio, simula.
//  • Ativo/inativo → NÃO existe no banco. `clubs.active` NÃO serve: é o controle de visibilidade do admin
//    (bulkDisableClubs), não indica clube extinto. Sempre simulado. Dica: ?status=inativo na URL força o inativo.
// Ao virar dado real: criar as colunas/regras no backend e desligar a flag.
export const SIMULATE_MISSING_FACTS = true;

export const STRUCTURE_INTRO = "Como o clube é constituído juridicamente e quem o controla.";

const STRUCTURES = [
    { label: "Associação ", hint: "Clube controlado pelos próprios sócios/associados, que elegem a diretoria. Não distribui lucros." },
    { label: "SAF", hint: "Empresa criada só para o futebol (Lei 14.193/2021). Investidores podem comprar participação e o clube associativo passa a ser acionista." },
    { label: "Clube-empresa", hint: "O clube é uma empresa com fins lucrativos, com donos ou acionistas, e não uma associação de sócios." },
    { label: "Investidor majoritário", hint: "Um grupo ou investidor detém o controle da sociedade que administra o clube." },
];

export const STATUS_HINT = "Ativo: o clube existe e disputa competições. Inativo: clube extinto, sem equipe profissional ou que deixou de disputar competições.";

function formatDate(value) {
    // Lê só AAAA-MM-DD do texto: passar por `new Date()` deslocaria o dia por fuso horário.
    const m = typeof value === "string" ? value.match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
    return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

export function getClubFacts(club) {
    const n = Math.abs(Number(club?.id_club) || 0);
    const realFounded = formatDate(club?.founded_at);
    const realStructure = (club?.ownership_model || "").trim();
    let simulated = false;

    let founded = realFounded;
    if (!founded && SIMULATE_MISSING_FACTS) {
        const y = 1880 + ((n * 37) % 130);
        const mo = String(1 + ((n * 7) % 12)).padStart(2, "0");
        const d = String(1 + ((n * 13) % 28)).padStart(2, "0");
        founded = `${d}/${mo}/${y}`;
        simulated = true;
    }

    let structure = realStructure ? { label: realStructure, hint: "" } : null;
    if (!structure && SIMULATE_MISSING_FACTS) {
        structure = STRUCTURES[n % STRUCTURES.length];
        simulated = true;
    }

    let status = null;
    if (SIMULATE_MISSING_FACTS) {
        const forced = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("status") : null;
        status = forced === "inativo" ? "inactive" : forced === "ativo" ? "active" : n % 6 === 0 ? "inactive" : "active";
        simulated = true;
    }

    return { founded, structure, status, simulated };
}
