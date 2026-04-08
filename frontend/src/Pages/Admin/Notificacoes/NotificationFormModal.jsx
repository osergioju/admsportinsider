import { useState, useEffect } from "react";
import { X, Save, Loader2, Users, Bell, FileText, Calendar, Send, AlertCircle, CheckCircle2 } from "lucide-react";

export default function NotificationFormModal({ isOpen, onClose, onSave, initialData }) {
  const [form, setForm] = useState({
    title: "",
    message: "",
    target: "all",
    send_at: ""
  });

  const [sendType, setSendType] = useState("draft");
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Estado de loading local

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setFeedback(null);
      setIsLoading(false);

      if (initialData) {
        setForm({
          title: initialData.title || "",
          message: initialData.message || "",
          target: initialData.target || "all",
          send_at: initialData.send_at ? initialData.send_at.slice(0, 16) : ""
        });

        if (initialData.status === 'scheduled') setSendType('scheduled');
        else if (initialData.status === 'active' || initialData.status === 'sent') setSendType('now');
        else setSendType('draft');

      } else {
        setForm({ title: "", message: "", target: "all", send_at: "" });
        setSendType("draft");
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "O título é obrigatório.";
    if (!form.message.trim()) newErrors.message = "A mensagem é obrigatória.";
    if (sendType === 'scheduled' && !form.send_at) newErrors.send_at = "Selecione a data e hora.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setFeedback(null);
    if (!validate()) return;

    setIsLoading(true);

    const payload = { ...form };
    if (sendType === 'draft') { payload.status = 'draft'; payload.send_at = null; }
    else if (sendType === 'now') { payload.status = 'active'; payload.send_at = new Date().toISOString(); }
    else if (sendType === 'scheduled') { payload.status = 'scheduled'; }

    try {
      // Executa a função do pai (API)
      await onSave(payload);

      // Se deu certo, mostra feedback AQUI e fecha depois
      setFeedback({ type: 'success', text: initialData ? 'Notificação atualizada!' : 'Notificação criada!' });

      setTimeout(() => {
        onClose();
        setFeedback(null); // Limpa para a próxima abertura
      }, 1500);

    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', text: "Erro ao salvar. Tente novamente." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const FeedbackMessage = ({ msg }) => {
    if (!msg) return null;
    const isSuccess = msg.type === 'success';
    return (
      <div className={`mb-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${isSuccess ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
        {isSuccess ? <CheckCircle2 size={18} className="text-green-600 shrink-0" /> : <AlertCircle size={18} className="text-red-600 shrink-0" />}
        <span>{msg.text}</span>
      </div>
    );
  };

  const inputClass = (hasError) => `w-full px-4 py-2.5 rounded-lg text-sm transition-all placeholder:text-gray-400 focus:outline-none focus:ring-1 ${hasError ? "bg-red-50 border border-red-300 focus:border-red-500 focus:ring-red-500 text-red-900" : "bg-white border border-gray-200 focus:border-[#7F33D9] focus:ring-[#7F33D9]"}`;
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";

  const SelectionCard = ({ type, icon: Icon, label, colorClass }) => {
    const isSelected = sendType === type;
    return (
      <button onClick={() => setSendType(type)} className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 text-center gap-2 ${isSelected ? `bg-white ${colorClass} shadow-md scale-[1.02]` : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100"}`}>
        <Icon size={24} className={isSelected ? "" : "text-gray-400"} />
        <span className={`block text-sm font-bold ${isSelected ? "text-gray-900" : "text-gray-500"}`}>{label}</span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isLoading && onClose()} />
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">

        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Bell className="text-[#7F33D9]" size={20} /> {initialData ? "Editar Notificação" : "Nova Notificação"}
          </h2>
          <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Título</label>
              <input type="text" className={inputClass(errors.title)} placeholder="Ex: Novidade no app!" value={form.title} onChange={e => handleChange("title", e.target.value)} />
              {errors.title && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.title}</p>}
            </div>
            <div>
              <label className={labelClass}>Mensagem</label>
              <textarea rows={3} className={inputClass(errors.message)} placeholder="Digite o conteúdo..." value={form.message} onChange={e => handleChange("message", e.target.value)} />
              {errors.message && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.message}</p>}
            </div>
            <div>
              <label className={labelClass}><Users size={12} className="inline mr-1" /> Público-Alvo</label>
              <select className={inputClass(false)} value={form.target} onChange={e => handleChange("target", e.target.value)}>
                <option value="all">Todos os usuários</option>
                <option value="user">Apenas Usuários</option>
                <option value="admin">Apenas Admins</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <label className={labelClass + " mb-3 block"}>Quando enviar?</label>
            <div className="flex gap-3 mb-4">
              <SelectionCard type="draft" icon={FileText} label="Rascunho" colorclassName="border-gray-300 text-gray-600" />
              <SelectionCard type="now" icon={Send} label="Imediato" colorclassName="border-green-500 text-green-600" />
              <SelectionCard type="scheduled" icon={Calendar} label="Agendar" colorclassName="border-blue-500 text-blue-600" />
            </div>
            {sendType === 'scheduled' && (
              <div className="animate-in slide-in-from-top-2 fade-in">
                <label className={labelClass}>Data e Hora</label>
                <input type="datetime-local" className={inputClass(errors.send_at)} value={form.send_at} onChange={e => handleChange("send_at", e.target.value)} />
                {errors.send_at && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.send_at}</p>}
              </div>
            )}
            {sendType === 'now' && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-xs flex items-center gap-2"><AlertCircle size={14} /> Envio imediato após salvar.</div>}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-3 shrink-0">
          <FeedbackMessage msg={feedback} />
          <div className="flex justify-end gap-3 w-full">
            <button onClick={onClose} disabled={isLoading} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
            <button onClick={handleSubmit} disabled={isLoading} className="flex items-center gap-2 px-6 py-2 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70">
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> {sendType === 'now' ? 'Enviar' : 'Salvar'}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}