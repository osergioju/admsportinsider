import { useNavigate } from "react-router-dom";

export default function MenuItem({ icon, label, to }) {
  const navigate = useNavigate();

  return (
    <li>
      <button
        onClick={() => navigate(to)}
        className="cursor-pointer w-full flex items-center gap-3 px-5 py-3 rounded-full hover:bg-white/60 transition">
        <span className="text-gray-400">{icon}</span>
        <span className="text-sm font-[300] text-[#0A0A0A]">{label}</span>
      </button>
    </li>
  );
}
