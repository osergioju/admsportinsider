import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import {
  KeyRound, PlugZap, Loader2, CheckCircle2, XCircle,
  Eye, EyeOff, Trash2, Save, FlaskConical, Globe, ExternalLink, Trophy, ArrowRight,
} from "lucide-react";

export default function ApiIntegration() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);   // { hasToken, tokenMasked, updatedAt }
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);      // { type, text }

  const [testing, setTesting] = useState(false);
  const [chosenOnly, setChosenOnly] = useState(true);
  const [result, setResult] = useState(null);        // { ok, message, count, competitions }

  async function loadSettings() {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/api-integration");
      setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSettings(); }, []);

  async function handleSave() {
    if (!token.trim()) {
      setSaveMsg({ type: "error", text: "Cole o token antes de salvar." });
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      await api.put("/admin/api-integration/token", { token: token.trim() });
      setToken("");
      setShowToken(false);
      setSaveMsg({ type: "success", text: "Token salvo com sucesso." });
      loadSettings();
    } catch (err) {
      setSaveMsg({ type: "error", text: err?.response?.data?.message || "Erro ao salvar o token." });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirm("Remover o token salvo? As chamadas à API deixarão de funcionar até salvar outro.")) return;
    setRemoving(true);
    setSaveMsg(null);
    try {
      await api.delete("/admin/api-integration/token");
      setResult(null);
      setSaveMsg({ type: "success", text: "Token removido." });
      loadSettings();
    } catch (err) {
      setSaveMsg({ type: "error", text: err?.response?.data?.message || "Erro ao remover o token." });
    } finally {
      setRemoving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setResult(null);
    try {
      // Se o usuário digitou um token novo (ainda não salvo), testa ele direto.
      const payload = { chosenOnly };
      if (token.trim()) payload.token = token.trim();
      const { data } = await api.post("/admin/api-integration/test", payload);
      setResult(data);
    } catch (err) {
      setResult({ ok: false, message: err?.response?.data?.message || "Erro ao testar o token." });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
          <PlugZap size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">API de dados esportivos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Salve e teste o token do FootyStats que alimenta as competições.{" "}
            <a href="https://footystats.org/api/documentations" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-0.5 text-violet-600 hover:text-violet-800 font-semibold">
              Documentação <ExternalLink size={12} />
            </a>
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 className="animate-spin w-5 h-5" />
          <span className="text-sm">Carregando…</span>
        </div>
      ) : (
        <>
          {/* ── Atalho: importar dados ── */}
          {settings?.hasToken && (
            <Link to="/admin/api/importar"
              className="flex items-center justify-between gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-5 py-4 hover:bg-emerald-50 transition-colors group">
              <span className="flex items-center gap-2.5 text-sm font-bold text-emerald-700">
                <Trophy size={18} /> Importar dados via API — partidas, stats e jogadores
              </span>
              <ArrowRight size={16} className="text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}

          {/* ── Card: Token ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <KeyRound size={18} className="text-gray-400" />
              <h2 className="font-bold text-gray-900 text-sm">Token de acesso</h2>
            </div>

            {/* Estado atual */}
            <div className="flex flex-wrap items-center gap-2">
              {settings?.hasToken ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                  <CheckCircle2 size={13} /> Token salvo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                  <XCircle size={13} /> Nenhum token salvo
                </span>
              )}
              {settings?.hasToken && (
                <>
                  <code className="text-xs font-mono text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                    {settings.tokenMasked}
                  </code>
                  {settings.updatedAt && (
                    <span className="text-xs text-gray-400">
                      atualizado em {new Date(settings.updatedAt).toLocaleString("pt-BR")}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                {settings?.hasToken ? "Substituir token" : "Colar token"}
              </label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Cole aqui sua API key do FootyStats"
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 pr-11 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-all"
                />
                <button type="button" onClick={() => setShowToken((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700 transition-colors"
                  aria-label={showToken ? "Ocultar" : "Mostrar"}>
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {saveMsg && (
              <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
                saveMsg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {saveMsg.type === "success" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                {saveMsg.text}
              </div>
            )}

            <div className="flex items-center gap-2.5 pt-1">
              <button onClick={handleSave} disabled={saving || !token.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Salvar token
              </button>
              {settings?.hasToken && (
                <button onClick={handleRemove} disabled={removing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-600 text-sm font-bold hover:bg-red-50 transition-colors disabled:opacity-40">
                  {removing ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  Remover
                </button>
              )}
            </div>
          </div>

          {/* ── Card: Teste ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <FlaskConical size={18} className="text-gray-400" />
              <h2 className="font-bold text-gray-900 text-sm">Testar conexão</h2>
            </div>
            <p className="text-sm text-gray-500">
              Faz uma chamada real à API e lista as competições liberadas para a sua chave.
              Se você digitou um token acima sem salvar, o teste usa esse token.
            </p>

            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={chosenOnly} onChange={(e) => setChosenOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-400" />
              <span className="text-sm text-gray-600">Apenas minhas competições selecionadas</span>
            </label>

            <div>
              <button onClick={handleTest} disabled={testing || (!settings?.hasToken && !token.trim())}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {testing ? <Loader2 size={15} className="animate-spin" /> : <PlugZap size={15} />}
                Testar token
              </button>
            </div>

            {/* Resultado */}
            {result && (
              <div className="space-y-3 pt-1">
                <div className={`flex items-center gap-2 text-sm font-semibold rounded-lg px-3 py-2.5 ${
                  result.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {result.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {result.message}
                </div>

                {result.ok && (
                  <Link to="/admin/api/resultados"
                    className="flex items-center justify-between gap-2 rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3 hover:bg-violet-50 transition-colors group">
                    <span className="flex items-center gap-2 text-sm font-semibold text-violet-700">
                      <Trophy size={16} /> Ver resultados da Copa do Mundo (teste)
                    </span>
                    <ArrowRight size={16} className="text-violet-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}

                {result.ok && result.competitions?.length > 0 && (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Globe size={13} /> Competições disponíveis
                      </span>
                      <span className="text-xs font-bold text-gray-400">{result.count}</span>
                    </div>
                    <div className="max-h-[420px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white">
                          <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                            <th className="text-left font-semibold py-2 px-4">País</th>
                            <th className="text-left font-semibold py-2 px-4">Competição</th>
                            <th className="text-center font-semibold py-2 px-3">Temporadas</th>
                            <th className="text-center font-semibold py-2 px-3">Mais recente</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.competitions.map((c, i) => (
                            <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                              <td className="py-2 px-4 text-gray-500">{c.country}</td>
                              <td className="py-2 px-4 font-semibold text-gray-800">{c.name}</td>
                              <td className="py-2 px-3 text-center text-gray-500 tabular-nums">{c.seasonsCount}</td>
                              <td className="py-2 px-3 text-center text-gray-500 tabular-nums">{c.latestSeason ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
