import { useNavigate } from "react-router-dom";

export default function SubItem({ label, to }) {
  const navigate = useNavigate();

  return (
    <li>
      <button
        onClick={() => navigate(to)}
        className="cursor-pointer text-sm text-gray-600 hover:text-[#7F33D9] transition"
      >
        {label}
      </button>
    </li>
  );
}
