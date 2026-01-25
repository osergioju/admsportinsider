import { useState } from "react";
import { X } from "lucide-react";

export default function NewRegionModal({ isOpen, onClose, onSave }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();

    onSave({
      code,
      name,
      active,
    });

    setCode("");
    setName("");
    setActive(true);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-5">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Nova região</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* CODE */}
          <div>
            <label className="text-sm">Código da região</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: US, BR, EU"
              required
            />
          </div>

          {/* NAME */}
          <div>
            <label className="text-sm">Nome da região</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Estados Unidos"
              required
            />
          </div>

          {/* ACTIVE */}
          <div className="flex items-center gap-2">
            <input
              id="active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="active" className="text-sm">
              Região ativa
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-md"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-4 py-2 text-sm bg-black text-white rounded-md"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
