import HomeBanners from "../../components/uxui/banner"

{/* Gráficos */}
import RevenuesChart from "./charts/revenues/RevenuesChart";

export default function Main() {
  return (
    <div className="space-y-8">
      {/* Banners */}
      <HomeBanners></HomeBanners>

      <RevenuesChart />
    
    </div>
  );
}
