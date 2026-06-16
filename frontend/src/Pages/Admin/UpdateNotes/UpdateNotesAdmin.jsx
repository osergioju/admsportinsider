import { useEffect, useState } from "react";
import { api } from "../../../services/api";
import {
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  XCircle,
  Search,
  FileText,
  Loader2,
  GripVertical
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import RichTextEditor from "../../../components/uxui/RichTextEditor";

function toHtml(note) {
  if (note?.body_html) return note.body_html;
  const arr = Array.isArray(note?.paragraphs) ? note.paragraphs : [];
  return arr.map(p => `<p>${p}</p>`).join("");
}

function toPlain(html) {
  return (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function UpdateNotesAdmin() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [tag, setTag] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  async function loadNotes() {
    try {
      const res = await api.get("/admin/update-notes");
      const sorted = res.data.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      setNotes(sorted);
    } catch (error) {
      console.error("Erro ao carregar notas de atualização", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotes();
  }, []);

  async function syncServerOrder(updatedList) {
    try {
      await api.patch("/admin/update-notes/order", {
        items: updatedList.map((item, index) => ({ id: item.id, sort_order: index }))
      });
    } catch (error) {
      console.error("Erro ao sincronizar ordem:", error);
    }
  }

  async function handleOnDragEnd(result) {
    if (!result.destination) return;
    const newItems = Array.from(notes);
    const [moved] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, moved);
    const full = newItems.map((item, index) => ({ ...item, sort_order: index }));
    setNotes(full);
    await syncServerOrder(full);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      tag,
      body_html: bodyHtml,
      sort_order: Number(sortOrder),
      is_active: isActive
    };

    try {
      if (editingId) {
        await api.put(`/admin/update-notes/${editingId}`, payload);
      } else {
        await api.post("/admin/update-notes", payload);
      }
      resetForm();
      loadNotes();
    } catch (error) {
      alert("Erro ao salvar nota");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setTag("");
    setBodyHtml("");
    setSortOrder(notes.length);
    setEditingId(null);
    setIsActive(true);
  }

  function handleEdit(note) {
    setEditingId(note.id);
    setTag(note.tag);
    setBodyHtml(toHtml(note));
    setSortOrder(note.sort_order ?? 0);
    setIsActive(note.is_active);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!confirm("Deseja realmente excluir esta nota?")) return;
    try {
      await api.delete(`/admin/update-notes/${id}`);
      const remaining = notes.filter(s => s.id !== id);
      await syncServerOrder(remaining);
      loadNotes();
    } catch (error) {
      alert("Erro ao excluir");
    }
  }

  const filtered = notes.filter(s =>
    s.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    toPlain(toHtml(s)).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";
  const btnPrimary = "flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70";

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">Notas de Atualização</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie as notas da página /update-notes.</p>
        </div>

        <div className="relative group w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#7F33D9] transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Buscar nota..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        <div className="lg:col-span-1 lg:sticky lg:top-8">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              {editingId ? <Pencil size={18} className="text-[#7F33D9]" /> : <Plus size={18} className="text-[#7F33D9]" />}
              <h2 className="font-bold text-gray-900">{editingId ? "Editar Nota" : "Nova Nota"}</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className={labelClass}>Título da nota</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Ex: v2.4 — Junho/2026"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Conteúdo</label>
                <RichTextEditor
                  value={bodyHtml}
                  onChange={setBodyHtml}
                  placeholder="Descreva o que mudou nesta atualização…"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Ordem manual</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full px-4 py-2.5 rounded-lg text-sm border flex items-center justify-center gap-2 transition-all ${isActive ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                  >
                    {isActive ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {isActive ? "Ativa" : "Inativa"}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 flex-1"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className={`${btnPrimary} flex-1`}
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <>{editingId ? "Atualizar" : "Adicionar"}</>}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Loader2 size={32} className="animate-spin mb-2 text-[#7F33D9]" />
              <p className="text-sm">Carregando notas...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                <FileText size={24} className="text-gray-300" />
              </div>
              <h3 className="text-gray-900 font-bold">Nenhuma nota encontrada</h3>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleOnDragEnd}>
              <Droppable droppableId="update-notes-admin-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {filtered.map((note, index) => (
                      <Draggable key={note.id} draggableId={String(note.id)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`group bg-white border rounded-xl p-5 transition-all ${snapshot.isDragging ? 'shadow-2xl border-[#7F33D9] z-50' : 'hover:shadow-md border-gray-200'} ${editingId === note.id ? 'border-[#7F33D9] ring-1 ring-[#7F33D9]' : ''}`}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div
                                {...provided.dragHandleProps}
                                className="mt-1 text-gray-300 hover:text-[#7F33D9] transition-colors cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical size={22} />
                              </div>

                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                    Posição {note.sort_order}
                                  </span>
                                  {note.is_active ? (
                                    <span className="text-green-600 text-[10px] font-bold flex items-center gap-1 uppercase tracking-wide">
                                      <CheckCircle2 size={12} /> Ativa
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-[10px] font-bold flex items-center gap-1 uppercase tracking-wide">
                                      <XCircle size={12} /> Inativa
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-base font-bold text-gray-900">{note.tag}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{toPlain(toHtml(note))}</p>
                              </div>

                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => handleEdit(note)}
                                  className="p-2 text-gray-400 hover:text-[#7F33D9] hover:bg-purple-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Pencil size={18} />
                                </button>
                                <button
                                  onClick={() => handleDelete(note.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

      </div>
    </div>
  );
}
