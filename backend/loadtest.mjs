// Teste de carga — rampa realista de lançamento.
// Mix de endpoints públicos de leitura (NÃO inclui /user/notas e /user/relatorios,
// que batem no WordPress de terceiros). Roda estágios crescentes de conexões
// simultâneas e reporta latência/throughput/erros de cada um.
//
// Uso: node loadtest.mjs [http://localhost:3000]
import autocannon from "autocannon";

const TARGET = process.argv[2] || "http://localhost:3000";

// Peso ~ frequência real: a home (finance-overview + currencies) é o mais aberto
const requests = [
  { path: "/dashboard/federations/fifa/finance-overview?to=BRL" },
  { path: "/dashboard/federations/fifa/finance-overview?to=USD" },
  { path: "/dashboard/leagues/310/financials/currencies" },
  { path: "/dashboard/federations" },
  { path: "/dashboard/federations/fifa" },
  { path: "/dashboard/federations/fifa/cycle-financials?to=BRL" },
  { path: "/dashboard/leagues/310/financials/revenues?to=BRL" },
  { path: "/dashboard/leagues/continental" },
  { path: "/dashboard/leagues/309/info" },
  { path: "/dashboard/clubs" },
];

// Rampa: conexões simultâneas × duração (s)
const stages = [
  { connections: 10, duration: 20 },
  { connections: 25, duration: 25 },
  { connections: 50, duration: 30 },
  { connections: 100, duration: 30 },
];

function runStage({ connections, duration }) {
  return new Promise((resolve, reject) => {
    const inst = autocannon(
      { url: TARGET, connections, duration, requests, timeout: 20 },
      (err, res) => (err ? reject(err) : resolve(res))
    );
    autocannon.track(inst, { renderProgressBar: true, renderResultsTable: false });
  });
}

const pad = (s, n) => String(s).padEnd(n);
const fmt = (n) => (n == null ? "—" : n.toLocaleString("pt-BR"));

console.log(`\n🎯 Alvo: ${TARGET}`);
console.log(`📊 ${requests.length} endpoints no mix · rampa ${stages.map(s => s.connections).join(" → ")} conexões\n`);

const summary = [];
for (const stage of stages) {
  console.log(`\n──── ${stage.connections} conexões / ${stage.duration}s ────`);
  const r = await runStage(stage);
  const non2xx = r.non2xx + (r["1xx"] || 0);
  summary.push({
    conn: stage.connections,
    rps: Math.round(r.requests.average),
    p50: r.latency.p50,
    p99: r.latency.p99,
    max: r.latency.max,
    errors: r.errors,
    timeouts: r.timeouts,
    non2xx,
  });
}

console.log("\n\n══════════════ RESUMO ══════════════");
console.log(`${pad("Conex", 7)}${pad("req/s", 9)}${pad("p50(ms)", 10)}${pad("p99(ms)", 10)}${pad("máx(ms)", 10)}${pad("erros", 8)}${pad("timeout", 9)}${pad("não-2xx", 8)}`);
for (const s of summary) {
  console.log(
    pad(s.conn, 7) + pad(fmt(s.rps), 9) + pad(fmt(s.p50), 10) + pad(fmt(s.p99), 10) +
    pad(fmt(s.max), 10) + pad(fmt(s.errors), 8) + pad(fmt(s.timeouts), 9) + pad(fmt(s.non2xx), 8)
  );
}
console.log("═════════════════════════════════════\n");
