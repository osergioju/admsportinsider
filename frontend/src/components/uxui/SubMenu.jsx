import { useNavigate } from "react-router-dom";

export default function SubItem({ label, to, ...props }) {
  const navigate = useNavigate();

  return (
    <li>
      <button
        {...props}
        onClick={(e) => {
          props.onClick?.(e);
          navigate(to);
        }}
        className="text-left cursor-pointer text-sm text-gray-600 hover:text-[#7F33D9] transition"
      >
        {label}
      </button>
    </li>
  );
}
