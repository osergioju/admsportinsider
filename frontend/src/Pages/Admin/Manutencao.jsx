import { useState, useEffect, useMemo } from "react";
import { api } from "../../services/api";
import {
  AlertTriangle, Search, X, Globe, Trophy, Shield,
  ChevronDown, ChevronUp, Loader2, CheckCircle2,
  ToggleLeft, ToggleRight, Zap, RefreshCw, MonitorCog, CornerDownRight
} from "lucide-react";

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ active, onChange, loading, disabled }) {
  return (
    <button
      onClick={() => !loading && !disabled && onChange(!active)}
      disabled={loading || disabled}
      className={`relative inline-flex items-center w-11 h-6 rounded-full transition-all duration-200 focus:outline-none shrink-0 ${
        active ? "bg-emerald-500" : "bg-gray-300"
      } ${loading ? "opacity-60 cursor-wait" : disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:opacity-90"}`}
    >
      <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${active ? "translate-x-6" : "translate-x-1"}`} />
      {loading && <Loader2 size={10} className="absolute right-0.5 animate-spin text-white" />}
    </button>
  );
}

// ─── Seção expansível ─────────────────────────────────────────────────────────

function Section({ title, icon: Icon, count, activeCount, color, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const inactiveCount = count - activeCount;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={18} className="text-white" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-900 text-sm">{title}</p>
            <p className="text-xs text-gray-400">
              <span className="text-emerald-600 font-semibold">{activeCount} ativos</span>
              {inactiveCount > 0 && <span className="text-red-500 font-semibold"> · {inactiveCount} inativos</span>}
              <span className="text-gray-300"> · {count} total</span>
            </p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && <div className="border-t border-gray-100">{children}</div>}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Manutencao() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [toggling, setToggling] = useState({}); // { "country_7": true }
  const [tab, setTab]         = useState("countries"); // countries | leagues | federations | system
  const [confirm, setConfirm]       = useState(null); // { type, id, name, active, cascade, affected }
  const [bulkLoading, setBulkLoading] = useState(false);
  const [sysFeatures, setSysFeatures] = useState(null); // [{ key, label, group, parent, active }]

  async function load() {
    setLoading(true);
    try {
      const [{ data: d }, { data: sys }] = await Promise.all([
        api.get("/admin/maintenance/overview"),
        api.get("/admin/maintenance/system"),
      ]);
      setData(d);
      setSysFeatures(sys.features || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  // ─ Manutenção do Sistema (páginas/menus do usuário) ─

  async function toggleSystemFeature(key, active) {
    const tkey = `system_${key}`;
    setToggling(p => ({ ...p, [tkey]: true }));
    try {
      await api.put(`/admin/maintenance/system/${key}`, { active });
      setSysFeatures(prev => prev.map(f => f.key === key ? { ...f, active } : f));
    } catch { alert("Erro ao alternar funcionalidade."); }
    finally { setToggling(p => { const n = { ...p }; delete n[tkey]; return n; }); }
  }

  // ─ Toggle handlers ─

  async function doBulkToggle(type, items, active) {
    setBulkLoading(true);
    try {
      const idKey = type === "country" ? "id_country" : type === "league" ? "id_league" : "id_federation";
      const ids = items.map(i => i[idKey]);
      await api.post("/admin/maintenance/bulk", { type, ids, active });
      await load();
    } catch { alert("Erro no bulk toggle."); }
    finally { setBulkLoading(false); }
  }

  async function doToggle(type, id, active, cascade = true) {
    const key = `${type}_${id}`;
    setToggling(p => ({ ...p, [key]: true }));
    try {
      const url = type === "country"     ? `/admin/maintenance/country/${id}/toggle`
                : type === "league"      ? `/admin/maintenance/league/${id}/toggle`
                : `/admin/maintenance/federation/${id}/toggle`;
      await api.put(url, { active, cascade });
      await load();
    } catch { alert("Erro ao alternar."); }
    finally { setToggling(p => { const n = { ...p }; delete n[key]; return n; }); }
  }

  function requestToggle(type, id, name, currentActive, cascade, affected) {
    const newActive = !currentActive;
    if (!newActive) {
      // Confirma desativação
      setConfirm({ type, id, name, active: newActive, cascade, affected });
    } else {
      doToggle(type, id, newActive, cascade);
    }
  }

  // ─ Filtros ─

  const q = search.toLowerCase();

  const filteredCountries = useMemo(() => {
    if (!data?.countries) return [];
    return data.countries.filter(c => c.name.toLowerCase().includes(q));
  }, [data, q]);

  const filteredLeagues = useMemo(() => {
    if (!data?.leagues) return [];
    return data.leagues.filter(l =>
      l.name.toLowerCase().includes(q) ||
      (l.country_name || "").toLowerCase().includes(q) ||
      (l.federation_acronym || "").toLowerCase().includes(q)
    );
  }, [data, q]);

  const filteredFeds = useMemo(() => {
    if (!data?.federations) return [];
    return data.federations.filter(f =>
      f.name.toLowerCase().includes(q) || f.acronym.toLowerCase().includes(q)
    );
  }, [data, q]);

  // Header com botão Ativar/Desativar todos
  function BulkHeader({ items, type }) {
    const allActive   = items.every(i => i.active);
      const label = allActive   ? "Desativar todos" : "Ativar todos";
    const nextActive = !allActive;

    return (
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/60">
        <p className="text-xs text-gray-400">
          {items.filter(i => i.active).length} de {items.length} ativos
        </p>
        <button
          onClick={() => doBulkToggle(type, items, nextActive)}
          disabled={bulkLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            nextActive
              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
          } disabled:opacity-50`}
        >
          {bulkLoading
            ? <Loader2 size={11} className="animate-spin" />
            : nextActive ? <ToggleRight size={13}/> : <ToggleLeft size={13}/>
          }
          {label}
        </button>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-[#7F33D9]" />
      </div>
    );
  }

  const totalInactive = (data?.countries?.filter(c => !c.active).length || 0)
    + (data?.leagues?.filter(l => !l.active).length || 0)
    + (data?.federations?.filter(f => !f.active).length || 0);

  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-6 space-y-6 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 p-6 sm:p-8 shadow-2xl">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-red-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-500/20 border border-red-500/40 rounded-2xl flex items-center justify-center">
              <Zap size={28} className="text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-2xl font-black text-white tracking-tight">Modo Manutenção</h1>
                {totalInactive > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {totalInactive} inativo{totalInactive > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="text-sm text-white/50">Ative ou desative países, competições e federações. Ações em cascata afetam tudo associado.</p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-full text-sm hover:bg-white/20 transition-all"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>
      </div>

      {/* ── Busca + tabs ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar país, competição ou federação…"
            className="w-full pl-10 pr-9 py-2.5 text-sm border border-gray-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition shadow-sm"
          />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-full p-1 shrink-0">
          {[
            { key: "countries",   label: "Países",       count: data?.countries?.length || 0 },
            { key: "leagues",     label: "Competições",  count: data?.leagues?.length || 0 },
            { key: "federations", label: "Federações",   count: data?.federations?.length || 0 },
            { key: "system",      label: "Sistema",      count: sysFeatures?.length || 0 },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t.label} <span className="opacity-50 ml-0.5">{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Países ── */}
      {tab === "countries" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {filteredCountries.length > 0 && <BulkHeader items={filteredCountries} type="country" idKey="id_country" />}
          <div className="divide-y divide-gray-50">
            {filteredCountries.length === 0 && (
              <p className="p-8 text-center text-sm text-gray-400">Nenhum país encontrado.</p>
            )}
            {filteredCountries.map(c => {
              const key = `country_${c.id_country}`;
              const clubs_n  = Number(c.clubs_active) + Number(c.clubs_inactive);
              const leagues_n = Number(c.leagues_active) + Number(c.leagues_inactive);
              return (
                <div key={c.id_country} className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${!c.active ? "bg-red-50/40" : "hover:bg-gray-50/50"}`}>
                  {c.flag_url
                    ? <img src={c.flag_url} className="w-8 h-5 object-cover rounded-sm shrink-0 shadow-sm" alt="" />
                    : <Globe size={18} className="text-gray-300 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${!c.active ? "text-gray-400 line-through" : "text-gray-800"}`}>{c.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {clubs_n} clube{clubs_n !== 1 ? "s" : ""} · {leagues_n} liga{leagues_n !== 1 ? "s" : ""}
                      {!c.active && <span className="ml-2 text-red-400 font-semibold">● inativo</span>}
                    </p>
                  </div>
                  <Toggle
                    active={c.active}
                    loading={!!toggling[key]}
                    onChange={() => requestToggle("country", c.id_country, c.name, c.active, true, { clubs: clubs_n, leagues: leagues_n })}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Competições ── */}
      {tab === "leagues" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {filteredLeagues.length > 0 && <BulkHeader items={filteredLeagues} type="league" idKey="id_league" />}
          <div className="divide-y divide-gray-50">
            {filteredLeagues.length === 0 && (
              <p className="p-8 text-center text-sm text-gray-400">Nenhuma competição encontrada.</p>
            )}
            {filteredLeagues.map(l => {
              const key = `league_${l.id_league}`;
              return (
                <div key={l.id_league} className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${!l.active ? "bg-red-50/40" : "hover:bg-gray-50/50"}`}>
                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    {l.slug
                      ? <img src={`https://pro.sportinsider.com.br/uploads/ligas/reduced/reduced_${l.slug}.webp`} className="w-7 h-7 object-contain" alt="" onError={e => e.currentTarget.style.display='none'} />
                      : <Trophy size={16} className="text-gray-300" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${!l.active ? "text-gray-400 line-through" : "text-gray-800"}`}>{l.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {l.country_name || l.continent_name || "Internacional"}
                      {l.federation_acronym && <span className="ml-1.5 bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{l.federation_acronym}</span>}
                      {!l.active && <span className="ml-2 text-red-400 font-semibold">● inativo</span>}
                    </p>
                  </div>
                  <Toggle
                    active={l.active}
                    loading={!!toggling[key]}
                    onChange={() => requestToggle("league", l.id_league, l.name, l.active, false, null)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Federações ── */}
      {tab === "federations" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {filteredFeds.length > 0 && <BulkHeader items={filteredFeds} type="federation" idKey="id_federation" />}
          <div className="divide-y divide-gray-50">
            {filteredFeds.length === 0 && (
              <p className="p-8 text-center text-sm text-gray-400">Nenhuma federação encontrada.</p>
            )}
            {filteredFeds.map(f => {
              const key = `federation_${f.id_federation}`;
              const leagues_n = Number(f.leagues_active) + Number(f.leagues_inactive);
              return (
                <div key={f.id_federation} className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${!f.active ? "bg-red-50/40" : "hover:bg-gray-50/50"}`}>
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                    {f.slug
                      ? <img src={`https://pro.sportinsider.com.br/uploads/federacoes/thumb/${f.slug}.webp`} className="w-6 h-6 object-contain" alt="" onError={e => e.currentTarget.style.display='none'} />
                      : <Shield size={14} className="text-gray-300" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${!f.active ? "text-gray-400 line-through" : "text-gray-800"}`}>
                      {f.acronym} <span className="font-normal text-gray-400 text-xs">· {f.name}</span>
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {leagues_n} competiç{leagues_n !== 1 ? "ões" : "ão"}
                      <span className="ml-1 bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 capitalize">{f.sphere}</span>
                      {!f.active && <span className="ml-2 text-red-400 font-semibold">● inativo</span>}
                    </p>
                  </div>
                  <Toggle
                    active={f.active}
                    loading={!!toggling[key]}
                    onChange={() => requestToggle("federation", f.id_federation, f.acronym, f.active, true, { leagues: leagues_n })}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Sistema (páginas/menus do usuário) ── */}
      {tab === "system" && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-purple-50 border border-purple-100 rounded-2xl px-5 py-4">
            <MonitorCog size={18} className="text-[#7F33D9] shrink-0 mt-0.5" />
            <p className="text-xs text-purple-900/70 leading-relaxed">
              Controle o que aparece para o usuário: desativar um item <strong>esconde o menu e bloqueia o acesso direto pela URL</strong>.
              Desativar um item principal desativa também os subitens em cascata.
            </p>
          </div>

          {["Menu principal", "Minha conta", "Suporte"].map(group => {
            const items = (sysFeatures || []).filter(f =>
              f.group === group &&
              (f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q) || !q)
            );
            if (!items.length) return null;
            const actives = items.filter(i => i.active).length;
            return (
              <div key={group} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/60">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{group}</p>
                  <p className="text-xs text-gray-400">{actives} de {items.length} ativos</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map(f => {
                    const tkey = `system_${f.key}`;
                    const parentOff = f.parent && sysFeatures.some(p => p.key === f.parent && !p.active);
                    const effectiveOff = !f.active || parentOff;
                    return (
                      <div key={f.key} className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${effectiveOff ? "bg-red-50/40" : "hover:bg-gray-50/50"}`}>
                        {f.parent && <CornerDownRight size={14} className="text-gray-300 shrink-0 ml-4" />}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${effectiveOff ? "text-gray-400 line-through" : "text-gray-800"}`}>{f.label}</p>
                          <p className="text-[11px] text-gray-400">
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono">{f.key}</span>
                            {!f.active && <span className="ml-2 text-red-400 font-semibold">● desativado</span>}
                            {f.active && parentOff && <span className="ml-2 text-orange-400 font-semibold">● oculto pelo item principal</span>}
                          </p>
                        </div>
                        <Toggle
                          active={f.active}
                          loading={!!toggling[tkey]}
                          onChange={(next) => toggleSystemFeature(f.key, next)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal de confirmação ── */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConfirm(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4 flex items-center gap-3">
              <AlertTriangle size={22} className="text-white shrink-0" />
              <h3 className="font-bold text-white text-lg">Confirmar desativação</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Desativar <strong className="text-gray-900">{confirm.name}</strong>
                {confirm.cascade && confirm.affected && (
                  <span> também vai desativar em cascata:</span>
                )}
              </p>
              {confirm.cascade && confirm.affected && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5 space-y-1.5">
                  {confirm.affected.clubs > 0 && (
                    <div className="flex items-center gap-2 text-sm text-red-700">
                      <span className="w-2 h-2 bg-red-400 rounded-full shrink-0" />
                      <strong>{confirm.affected.clubs}</strong> clube{confirm.affected.clubs !== 1 ? "s" : ""}
                    </div>
                  )}
                  {confirm.affected.leagues > 0 && (
                    <div className="flex items-center gap-2 text-sm text-red-700">
                      <span className="w-2 h-2 bg-red-400 rounded-full shrink-0" />
                      <strong>{confirm.affected.leagues}</strong> competiç{confirm.affected.leagues !== 1 ? "ões" : "ão"}
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setConfirm(null)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={() => { doToggle(confirm.type, confirm.id, confirm.active, confirm.cascade); setConfirm(null); }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full text-sm font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/30"
                >
                  Sim, desativar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
