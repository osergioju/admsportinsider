import { useNavigate } from "react-router-dom";

export default function MenuItem({ icon, label, to, compact = false, ...props }) {
  const navigate = useNavigate();

  return (
    <li>
      <button
        title={compact && typeof label?.props?.children === "string" ? label.props.children : undefined}
        {...props}
        onClick={(e) => {
          props.onClick?.(e);
          navigate(to);
        }}
        className={compact
          ? "cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 mb-0.5 rounded-full hover:bg-white/60 transition group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:gap-0 group-data-[collapsed=true]/sb:px-0"
          : "cursor-pointer w-full flex items-center gap-3 px-3 py-3 rounded-full hover:bg-white/60 transition"}
      >
        <span className="text-gray-400">{icon}</span>
        <span className={compact ? "text-[13px] font-normal text-[#0A0A0A]" : "text-sm font-[400] text-[#0A0A0A]"}>{label}</span>
      </button>
    </li>
  );
}
