import { useRef, useEffect } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Heading2, Heading3, Link2, Eraser } from "lucide-react";

// WYSIWYG simples e sem dependências (contentEditable + execCommand).
// Saída: HTML (string) via onChange. Usado no editor de Páginas Legais.
export default function RichTextEditor({ value, onChange, placeholder = "" }) {
  const ref = useRef(null);

  // Sincroniza HTML externo (ex.: ao abrir uma seção p/ editar) sem resetar o
  // cursor a cada tecla: só reescreve quando o valor de fora difere do DOM atual.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || "")) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const emit = () => onChange(ref.current?.innerHTML || "");

  const exec = (cmd, arg) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };

  const onLink = () => {
    const url = window.prompt("URL do link (https://...):", "https://");
    if (url) exec("createLink", url);
  };

  // onMouseDown preventDefault: impede o botão de roubar a seleção do texto.
  const Btn = ({ title, onClick, children }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="p-2 rounded hover:bg-gray-100 text-gray-600 hover:text-[#7F33D9] transition-colors"
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#7F33D9] focus-within:ring-1 focus-within:ring-[#7F33D9] transition-all">
      <style>{`.rte-area:empty:before{content:attr(data-placeholder);color:#9ca3af;}
        .rte-area h2{font-size:1.125rem;font-weight:700;margin:.5rem 0;}
        .rte-area h3{font-size:1rem;font-weight:600;margin:.5rem 0;}
        .rte-area ul{list-style:disc;padding-left:1.25rem;margin:.5rem 0;}
        .rte-area ol{list-style:decimal;padding-left:1.25rem;margin:.5rem 0;}
        .rte-area a{color:#7F33D9;text-decoration:underline;}
        .rte-area p{margin:.5rem 0;}`}</style>

      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/50">
        <Btn title="Negrito" onClick={() => exec("bold")}><Bold size={16} /></Btn>
        <Btn title="Itálico" onClick={() => exec("italic")}><Italic size={16} /></Btn>
        <Btn title="Sublinhado" onClick={() => exec("underline")}><Underline size={16} /></Btn>
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <Btn title="Título" onClick={() => exec("formatBlock", "<h2>")}><Heading2 size={16} /></Btn>
        <Btn title="Subtítulo" onClick={() => exec("formatBlock", "<h3>")}><Heading3 size={16} /></Btn>
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <Btn title="Lista" onClick={() => exec("insertUnorderedList")}><List size={16} /></Btn>
        <Btn title="Lista numerada" onClick={() => exec("insertOrderedList")}><ListOrdered size={16} /></Btn>
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <Btn title="Link" onClick={onLink}><Link2 size={16} /></Btn>
        <Btn title="Limpar formatação" onClick={() => exec("removeFormat")}><Eraser size={16} /></Btn>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        data-placeholder={placeholder}
        className="rte-area min-h-[220px] max-h-[480px] overflow-auto px-4 py-3 text-sm text-gray-800 leading-relaxed focus:outline-none"
      />
    </div>
  );
}
