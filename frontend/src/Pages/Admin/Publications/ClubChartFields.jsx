import { useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { TOKEN_FIELDS, INFO_FIELDS } from "../../../utils/clubModules";

const inputClass =
  "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";
const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";

const CHART_TYPES = [
  { value: "line", label: "Linha" },
  { value: "bar", label: "Barras" },
  { value: "stacked_bar", label: "Barras empilhadas" },
];

// Seleção de indicadores (catálogo financial_indicators). Ordem de seleção = ordem das séries/cores.
export function IndicatorPicker({ catalog, selected, onChange, single = false }) {
  const [q, setQ] = useState("");
  const labelByCode = useMemo(() => Object.fromEntries(catalog.map((i) => [i.code, i.name_pt])), [catalog]);

  const matches = useMemo(() => {
    const term = q.trim().toLowerCase();
    return catalog
      .filter((i) => !term || i.name_pt.toLowerCase().includes(term) || i.code.toLowerCase().includes(term))
      .slice(0, 40);
  }, [catalog, q]);

  function toggle(code) {
    if (single) return onChange([code]);
    onChange(selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code]);
  }

  return (
    <div>
      {!single && selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((code) => (
            <span key={code} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-purple-50 text-[#7F33D9] text-xs font-bold">
              {labelByCode[code] || code}
              <button type="button" onClick={() => toggle(code)} aria-label={`Remover ${labelByCode[code] || code}`} className="p-0.5 hover:bg-purple-100 rounded-full">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative mb-2">
        <Search size={14} className="absolute left-3 top-3 text-gray-400" />
        <input className={`${inputClass} pl-9`} placeholder="Buscar indicador (ex.: receita, dívida, lucro)" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="max-h-44 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
        {matches.map((i) => {
          const on = selected.includes(i.code);
          return (
            <button
              type="button"
              key={i.code}
              onClick={() => toggle(i.code)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-gray-50 ${on ? "bg-purple-50/60 text-[#7F33D9] font-semibold" : "text-gray-700"}`}
            >
              <span className="truncate" style={{ paddingLeft: Math.max(0, (i.level || 1) - 1) * 10 }}>{i.name_pt}</span>
              <code className="text-[10px] text-gray-400 shrink-0">{i.code}</code>
            </button>
          );
        })}
        {matches.length === 0 && <p className="px-3 py-3 text-xs text-gray-400">Nenhum indicador encontrado.</p>}
      </div>
    </div>
  );
}

// Formulário do módulo "Gráfico do clube" (block_type club_chart).
export default function ClubChartFields({ content, updateContent, catalog, pageKey }) {
  const isCompetition = pageKey === "competitions";
  const c = content;
  const codes = useMemo(() => c.indicator_codes || [], [c.indicator_codes]);
  const isSplit = c.variant === "split";
  const [focused, setFocused] = useState("title");
  const [tokenCode, setTokenCode] = useState("");
  const [tokenField, setTokenField] = useState("value");
  const fieldEls = useRef({}); // campo de texto -> elemento (pra inserir a variável no cursor)

  // Insere a variável no campo de texto que estava em foco (na posição do cursor)
  function insertToken(text) {
    const el = fieldEls.current[focused];
    const current = c[focused] || "";
    const start = el?.selectionStart ?? current.length;
    const end = el?.selectionEnd ?? current.length;
    updateContent({ [focused]: current.slice(0, start) + text + current.slice(end) });
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(start + text.length, start + text.length); });
  }

  const tokenOptions = useMemo(() => {
    const seen = new Set(codes);
    return [...codes, ...catalog.map((i) => i.code).filter((code) => !seen.has(code))];
  }, [codes, catalog]);

  const optBtn = (active) =>
    `px-3 py-2 rounded-lg border text-xs font-medium transition-all ${active ? "border-[#7F33D9] bg-purple-50 text-[#7F33D9]" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`;

  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>Layout do módulo</label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => updateContent({ variant: "basic" })} className={optBtn(!isSplit)}>Só gráfico (título + subtítulo)</button>
          <button type="button" onClick={() => updateContent({ variant: "split" })} className={optBtn(isSplit)}>Gráfico + conteúdo</button>
        </div>
        {isSplit && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button type="button" onClick={() => updateContent({ chart_side: "left" })} className={optBtn(c.chart_side !== "right")}>Gráfico à esquerda</button>
            <button type="button" onClick={() => updateContent({ chart_side: "right" })} className={optBtn(c.chart_side === "right")}>Gráfico à direita</button>
          </div>
        )}
      </div>

      <div>
        <label className={labelClass}>Tipo de gráfico</label>
        <div className="grid grid-cols-3 gap-2">
          {CHART_TYPES.map((t) => (
            <button type="button" key={t.value} onClick={() => updateContent({ chart_type: t.value })} className={optBtn((c.chart_type || "line") === t.value)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Formato dos valores</label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => updateContent({ value_format: "currency" })} className={optBtn((c.value_format || "currency") === "currency")}>Dinheiro (moeda da página)</button>
          <button type="button" onClick={() => updateContent({ value_format: "number" })} className={optBtn(c.value_format === "number")}>Número (ex.: público)</button>
        </div>
      </div>

      <div>
        <label className={labelClass}>Indicadores ({codes.length})</label>
        <IndicatorPicker catalog={catalog} selected={codes} onChange={(next) => updateContent({ indicator_codes: next })} />
        <p className="text-xs text-gray-400 mt-1">Os dados vêm da página onde o módulo aparece — o mesmo módulo serve para qualquer clube/federação.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Ano inicial (opcional)</label>
          <input type="number" className={inputClass} placeholder="Ex: 2015" value={c.year_from || ""} onChange={(e) => updateContent({ year_from: e.target.value ? Number(e.target.value) : "" })} />
        </div>
        <div>
          <label className={labelClass}>Ano final (opcional)</label>
          <input type="number" className={inputClass} placeholder="Ex: 2025" value={c.year_to || ""} onChange={(e) => updateContent({ year_to: e.target.value ? Number(e.target.value) : "" })} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Título</label>
        <input ref={(el) => { fieldEls.current.title = el; }} onFocus={() => setFocused("title")} className={inputClass} placeholder="Ex: Receitas em {{revenue.year}}" value={c.title || ""} onChange={(e) => updateContent({ title: e.target.value })} />
      </div>
      <div>
        <label className={labelClass}>Subtítulo (opcional)</label>
        <input ref={(el) => { fieldEls.current.subtitle = el; }} onFocus={() => setFocused("subtitle")} className={inputClass} value={c.subtitle || ""} onChange={(e) => updateContent({ subtitle: e.target.value })} />
      </div>
      {isSplit && (
        <div>
          <label className={labelClass}>Texto ao lado do gráfico</label>
          <textarea
            ref={(el) => { fieldEls.current.body = el; }}
            onFocus={() => setFocused("body")}
            rows={4}
            className={inputClass}
            placeholder="Ex: O {{name}} registrou receita de {{revenue.value}} em {{revenue.year}}{{revenue.compare}}."
            value={c.body || ""}
            onChange={(e) => updateContent({ body: e.target.value })}
          />
        </div>
      )}

      <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-2">
        <p className="text-xs font-bold text-gray-600">Quando mostrar</p>
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input type="checkbox" className="mt-0.5 accent-[#7F33D9]" checked={!!c.hide_when_empty} onChange={(e) => updateContent({ hide_when_empty: e.target.checked })} />
          <span>Ocultar quando não houver dados<span className="block text-xs text-gray-400">Sem dado no gráfico (e sem texto de informação preenchido), o módulo some da página em vez de mostrar "Ah, não!".</span></span>
        </label>
        {isCompetition && (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo de competição</label>
              <select className={inputClass} value={c.team_scope || "any"} onChange={(e) => updateContent({ team_scope: e.target.value })}>
                <option value="any">Todas as competições</option>
                <option value="club">Só competições de clubes</option>
                <option value="national">Só competições de seleções</option>
              </select>
            </div>
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input type="checkbox" className="mt-0.5 accent-[#7F33D9]" checked={!!c.hide_if_has_special} onChange={(e) => updateContent({ hide_if_has_special: e.target.checked })} />
              <span>Ocultar em competições com Premiações ou Público<span className="block text-xs text-gray-400">Regra que a página sempre teve: competições que já têm esses textos não mostram as tiras financeiras.</span></span>
            </label>
          </>
        )}
      </div>

      <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
        <p className="text-xs font-bold text-gray-600 mb-1">Variáveis nos textos</p>
        <p className="text-xs text-gray-500 mb-2">
          Preenchidas com os dados do clube de cada página. Clique em "Inserir" para colocar no campo de texto selecionado (agora: <b>{focused === "title" ? "título" : focused === "subtitle" ? "subtítulo" : "texto"}</b>).
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <button type="button" onClick={() => insertToken("{{name}}")} className="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100">Nome da página</button>
          <select className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white max-w-[9rem]" value={tokenCode} onChange={(e) => setTokenCode(e.target.value)}>
            <option value="">indicador…</option>
            {tokenOptions.map((code) => <option key={code} value={code}>{catalog.find((i) => i.code === code)?.name_pt || code}</option>)}
          </select>
          <select className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white max-w-[9rem]" value={tokenField} onChange={(e) => setTokenField(e.target.value)}>
            {TOKEN_FIELDS.map((f) => <option key={f.field} value={f.field}>{f.field}</option>)}
          </select>
          <button type="button" disabled={!tokenCode} onClick={() => insertToken(`{{${tokenCode}.${tokenField}}}`)} className="px-2.5 py-1.5 rounded-lg bg-[#7F33D9] text-white text-xs font-bold disabled:opacity-40">Inserir</button>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">{TOKEN_FIELDS.find((f) => f.field === tokenField)?.desc}</p>
        {isCompetition && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-1.5">Informações da competição (textos cadastrados nela):</p>
            <div className="flex flex-wrap gap-2">
              {INFO_FIELDS.map((f) => (
                <button key={f.field} type="button" title={f.desc} onClick={() => insertToken(`{{info.${f.field}}}`)} className="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100">{f.field}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
