
export default function SubItemSubItem({ label }) {
  return (
    <li>
      <button className="text-sm text-gray-600 hover:text-black transition">
        {label}
      </button>
    </li>
  );
}
