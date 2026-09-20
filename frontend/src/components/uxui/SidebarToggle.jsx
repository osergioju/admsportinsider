import { ChevronsLeft, ChevronsRight } from "lucide-react";

// Botão fixo no rodapé do menu lateral (desktop): recolhe/expande, como no WordPress.
export default function SidebarToggle({ collapsed, onToggle, collapseLabel = "Recolher menu", expandLabel = "Expandir menu" }) {
  return (
    <div className="hidden lg:block shrink-0 border-t border-gray-100 p-2">
      <button
        onClick={onToggle}
        title={collapsed ? expandLabel : collapseLabel}
        aria-label={collapsed ? expandLabel : collapseLabel}
        aria-expanded={!collapsed}
        className="w-full flex items-center justify-center gap-2.5 px-3 py-2 rounded-full text-[13px] text-gray-400 hover:bg-purple-50 hover:text-[#7F33D9] transition-colors cursor-pointer"
      >
        {collapsed ? <ChevronsRight strokeWidth={1.25} size={18} /> : <><ChevronsLeft strokeWidth={1.25} size={18} /><span>{collapseLabel}</span></>}
      </button>
    </div>
  );
}
