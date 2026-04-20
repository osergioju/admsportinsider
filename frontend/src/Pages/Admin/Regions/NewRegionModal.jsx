import { useState, useEffect } from "react";
import { X, Save, Loader2, MapPin, Globe, CheckCircle2, AlertCircle } from "lucide-react";

export default function NewRegionModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    code: "",
    active: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset form ao abrir
  useEffect(() => {
    if (isOpen) {
      setForm({ name: "", code: "", active: true });
      setErrors({});
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "O nome é obrigatório.";
    if (!form.code.trim()) newErrors.code = "O código é obrigatório.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    await onSave(form);
    setIsLoading(false);
  };

  // Helper para inputs
  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  // Estilos
  const inputClass = (hasError) => `
    w-full px-4 py-2.5 rounded-lg text-sm transition-all placeholder:text-gray-400 focus:outline-none focus:ring-1 
    ${hasError
      ? "bg-red-50 border border-red-300 focus:border-red-500 focus:ring-red-500 text-red-900"
      : "bg-white border border-gray-200 focus:border-[#7F33D9] focus:ring-[#7F33D9]"
    }
  `;

  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/40 " onClick={onClose} />

      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Globe className="text-[#7F33D9]" size={20} />
            Nova Região
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          <div>
            <label className={labelClass}>Nome da Região</label>
            <input
              type="text"
              className={inputClass(errors.name)}
              placeholder="Ex: País"
              value={form.name}
              onChange={e => handleChange("name", e.target.value)}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Código (ISO)</label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 text-gray-400 pointer-events-none">
                  <MapPin size={16} />
                </div>
                <input
                  type="text"
                  className={`${inputClass(errors.code)} pl-9 uppercase`}
                  placeholder="Ex: US"
                  value={form.code}
                  onChange={e => handleChange("code", e.target.value.toUpperCase())}
                  maxLength={5}
                />
              </div>
              {errors.code && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.code}</p>}
            </div>

            <div>
              <label className={labelClass}>Status Inicial</label>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, active: !prev.active }))}
                className={`w-full px-4 py-2.5 rounded-lg text-sm border flex items-center justify-center gap-2 transition-all ${form.active ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
              >
                {form.active ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                {form.active ? "Ativa" : "Inativa"}
              </button>
            </div>
          </div>

          <input type="submit" hidden />
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Salvar</>}
          </button>
        </div>
      </div>
    </div>
  );
}