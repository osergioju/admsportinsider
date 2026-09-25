// Piloto de SSR só para /dashboard/clubs/:id/:slug — não faz parte do build/dev normal do SPA.
// Roda como um processo isolado, à parte do `vite` (porta 5173) e do backend Express (porta 3000).
import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SSR_PORT = process.env.SSR_PORT || 4001;
const API_URL = process.env.API_URL || "http://localhost:3000";

const app = express();

const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
    ssr: {
        // Deixa o Vite transformar (em vez de `require` nativo do Node) libs cujo
        // interop de export default costuma quebrar sob SSR.
        noExternal: ["echarts-for-react", "lucide-react"],
    },
});
app.use(vite.middlewares);

function escapeHtml(str = "") {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

async function fetchClubInitialData(id) {
    const [res, revRes, netRes, netEvoRes, debtEvRes, debtBrkRes, layoutRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard/clubs/${id}/info`),
        axios.get(`${API_URL}/dashboard/clubs/${id}/financials/revenues`),
        axios.get(`${API_URL}/dashboard/clubs/${id}/financials/net-result`),
        axios.get(`${API_URL}/dashboard/clubs/${id}/financials/net-result/evolution`),
        axios.get(`${API_URL}/dashboard/clubs/${id}/financials/debts/evolution`),
        axios.get(`${API_URL}/dashboard/clubs/${id}/financials/debts/breakdown`),
        // Layout modular da página (próprio/padrão) + dados dos blocos. Falha aqui não derruba o SSR:
        // sem layout, o cliente busca sozinho e o snapshot fica só com a testeira.
        axios.get(`${API_URL}/dashboard/clubs/${id}/layout`).catch(() => null),
    ]);

    return {
        theClub: res.data,
        layout: layoutRes?.data ?? undefined,
        financials: {
            revenues: revRes.data?.data || [],
            netResult: netRes.data?.data || [],
            netEvolution: netEvoRes.data?.data || [],
            debts: debtEvRes.data?.data || [],
            debtsBreakdown: debtBrkRes.data?.data || [],
            currency: revRes.data?.fromCurrency || "BRL",
        },
    };
}

async function renderClub(req, res) {
    const { id, slug } = req.params;

    try {
        const initialData = await fetchClubInitialData(id);

        const templatePath = path.resolve(__dirname, "index.html");
        let template = fs.readFileSync(templatePath, "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, template);

        const { renderClubPage } = await vite.ssrLoadModule("/src/entry-server.jsx");
        const { html, title, description } = renderClubPage({ id, slug, initialData });

        const page = template
            .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
            .replace(
                /<meta name="description" content=".*?"\s*\/?>/,
                `<meta name="description" content="${escapeHtml(description)}" />`
            )
            .replace("<!--ssr-outlet-->", html);

        res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (err) {
        vite.ssrFixStacktrace(err);
        console.error("[ssr-server] Erro ao renderizar clube:", err);
        res.status(500).end("Erro ao renderizar página.");
    }
}

app.get("/dashboard/clubs/:id/:slug", renderClub);
app.get("/dashboard/clubs/:id", renderClub);

app.listen(SSR_PORT, () => {
    console.log(`SSR piloto (clubes) rodando em http://localhost:${SSR_PORT}`);
});
