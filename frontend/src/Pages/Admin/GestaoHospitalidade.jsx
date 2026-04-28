import { useState, useEffect, useRef } from "react";
import { api } from "../../services/api";
import {
  Search, X, Check, Loader2, Trash2, MapPin, ExternalLink,
  Building2, Users, Plus, Edit2,
} from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────

const inputClass =
  "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";
const labelClass =
  "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";
const btnPrimary =
  "flex items-center justify-center gap-2 px-5 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";
const btnSecondary =
  "px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors";

// ─── StadiumRow — card da lista de registros existentes ───────────────────────

function StadiumRow({ record, onEdit, onDelete }) {
  return (
    <div className="group bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-[#7F33D9]/30 hover:shadow-sm transition-all">
      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
        <Building2 size={18} className="text-[#7F33D9]" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 truncate">{record.stadium_name}</p>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {record.clubs?.length > 0 && (
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Users size={10} />
              {record.clubs.join(", ")}
            </span>
          )}
          {record.hospitality_url && (
            <a
              href={record.hospitality_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#7F33D9] flex items-center gap-1 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={10} />
              Ver link
            </a>
          )}
        </div>
        {record.description && (
          <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{record.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(record)}
          className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-[#7F33D9]/10 hover:text-[#7F33D9] hover:border-[#7F33D9]/30 transition-all"
          title="Editar"
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={() => onDelete(record)}
          className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
          title="Remover"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

function HospitalityModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({
    stadium_name: initial?.stadium_name ?? "",
    hospitality_url: initial?.hospitality_url ?? "",
    description: initial?.description ?? "",
  });
  const [searchQ, setSearchQ] = useState(initial?.stadium_name ?? "");
  const [stadiumResults, setStadiumResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef(null);
  const isEditing = !!initial?.hospitality_id;

  // Busca de estádios (só quando criando novo)
  useEffect(() => {
    if (isEditing || searchQ.length < 2) { setStadiumResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get("/admin/hospitality/stadiums", { params: { q: searchQ } });
        setStadiumResults(data.stadiums || []);
      } catch { /* ignore */ } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQ, isEditing]);

  function selectStadium(stadium) {
    setForm((f) => ({
      ...f,
      stadium_name: stadium.stadium_name,
      hospitality_url: stadium.hospitality_url ?? f.hospitality_url,
      description: stadium.description ?? f.description,
    }));
    setStadiumResults([]);
    setSearchQ(stadium.stadium_name);
  }

  async function handleSave() {
    if (!form.stadium_name) return;
    setSaving(true);
    try {
      await api.post("/admin/hospitality", form);
      setSaved(true);
      setTimeout(() => { onSaved(); onClose(); }, 600);
    } catch { setSaving(false); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-base font-bold text-gray-900">
            {isEditing ? "Editar Hospitalidade" : "Nova Hospitalidade"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-7 space-y-5">
          {/* Busca de estádio (apenas ao criar) */}
          {!isEditing ? (
            <div>
              <label className={labelClass}>Estádio</label>
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  className={`${inputClass} pl-9`}
                  placeholder="Buscar estádio pelo nome..."
                  value={searchQ}
                  onChange={(e) => { setSearchQ(e.target.value); setForm((f) => ({ ...f, stadium_name: "" })); }}
                />
                {searching && (
                  <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                )}
              </div>

              {/* Resultados da busca */}
              {stadiumResults.length > 0 && (
                <div className="mt-1.5 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {stadiumResults.map((s) => (
                    <button
                      key={s.stadium_name}
                      onClick={() => selectStadium(s)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition text-left border-b border-gray-100 last:border-0"
                    >
                      <Building2 size={14} className="text-gray-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">{s.stadium_name}</p>
                        {s.clubs?.length > 0 && (
                          <p className="text-[11px] text-gray-400 truncate">{s.clubs.join(", ")}</p>
                        )}
                      </div>
                      {s.hospitality_id && (
                        <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                          já cadastrado
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {form.stadium_name && (
                <p className="mt-2 text-xs text-[#7F33D9] flex items-center gap-1.5">
                  <Check size={12} /> <strong>{form.stadium_name}</strong> selecionado
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className={labelClass}>Estádio</label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                <Building2 size={14} className="text-gray-400" />
                <span className="text-sm text-gray-700 font-medium">{form.stadium_name}</span>
              </div>
            </div>
          )}

          {/* URL */}
          <div>
            <label className={labelClass}>Link de hospitalidade</label>
            <input
              type="url"
              className={inputClass}
              placeholder="https://..."
              value={form.hospitality_url}
              onChange={(e) => setForm((f) => ({ ...f, hospitality_url: e.target.value }))}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className={labelClass}>Texto curto</label>
            <textarea
              className={inputClass}
              rows={2}
              placeholder="Clique para comprar pacotes de hospitalidade e camarotes"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className={btnSecondary}>Cancelar</button>
            <button
              onClick={handleSave}
              disabled={!form.stadium_name || saving || saved}
              className={btnPrimary}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function GestaoHospitalidade() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modal, setModal] = useState(null); // null | { initial }

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/hospitality");
      setRecords(data.records || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(record) {
    if (!window.confirm(`Remover hospitalidade de "${record.stadium_name}"?`)) return;
    try {
      await api.delete(`/admin/hospitality/${record.hospitality_id || record.id}`);
      load();
    } catch { alert("Erro ao remover."); }
  }

  const filtered = records.filter((r) =>
    r.stadium_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.clubs ?? []).some((c) => c.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-6 animate-in fade-in duration-500">

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#111] tracking-tight flex items-center gap-2">
            <MapPin size={22} className="text-[#7F33D9]" />
            Hospitalidade
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Links de camarotes e hospitalidade por estádio.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Busca */}
          <div className="relative group w-full sm:w-64">
            <Search size={16} className="absolute inset-y-0 left-3 my-auto text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Filtrar estádios..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-3 my-auto text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          <button onClick={() => setModal({ initial: {} })} className={btnPrimary}>
            <Plus size={16} /> Novo estádio
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[72px] bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center">
            <Building2 size={32} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-sm font-medium">
              {searchTerm ? "Nenhum estádio encontrado" : "Nenhum estádio cadastrado ainda"}
            </p>
            {!searchTerm && (
              <button onClick={() => setModal({ initial: {} })} className={`${btnPrimary} mx-auto mt-4`}>
                <Plus size={16} /> Cadastrar primeiro estádio
              </button>
            )}
          </div>
        ) : (
          filtered.map((r) => (
            <StadiumRow
              key={r.id}
              record={r}
              onEdit={(rec) => setModal({ initial: { ...rec, hospitality_id: rec.id } })}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Modal */}
      {modal && (
        <HospitalityModal
          initial={modal.initial}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
