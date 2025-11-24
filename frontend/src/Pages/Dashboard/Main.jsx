import { useState } from "react";
import SelectClubes from "../../components/charts/dashboard/filters/SelectClubes";
import GraficoReceita from "../../components/charts/dashboard/GraficoReceita";
import GraficoPizzaReceitas from "../../components/charts/dashboard/GraficoPizzaReceitas";

export default function Main() {
  const [clubeSelecionado, setClubeSelecionado] = useState("");

  return (
    <div className="space-y-8">
      
      <SelectClubes onChange={setClubeSelecionado} />

      <GraficoReceita clube={clubeSelecionado} />

      <GraficoPizzaReceitas clube={clubeSelecionado} />
    
    </div>
  );
}
