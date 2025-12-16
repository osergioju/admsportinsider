
export default function SubItemSubItem({ label }) {
  return (
    <li>
      <button className="cursor-pointer text-sm text-gray-600 hover:text-[#7F33D9] transition">
        {label}
      </button>
    </li>
  );
}
