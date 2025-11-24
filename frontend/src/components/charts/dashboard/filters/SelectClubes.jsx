import { useEffect, useState } from "react";

export default function SelectClubes({ onChange }) {
  const [clubes, setClubes] = useState([]);

  useEffect(() => {
    async function loadClubes() {
      const res = await fetch("http://localhost:3000/dashboard/clubes");
      const json = await res.json();
      setClubes(json.clubes);
    }

    loadClubes();
  }, []);

  return (
    <select
      onChange={(e) => onChange(e.target.value)}
      className="border rounded-lg p-2 mb-4"
    >
      <option value="">Todos os clubes</option>
      {clubes.map((clube) => (
        <option key={clube} value={clube}>
          {clube}
        </option>
      ))}
    </select>
  );
}
