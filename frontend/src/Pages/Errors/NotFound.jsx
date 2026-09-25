import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const BALLS = [
  { emoji: "⚽", x: 8, y: 12, size: 28, delay: 0, dur: 7 },
  { emoji: "🏀", x: 80, y: 8, size: 22, delay: 1.2, dur: 9 },
  { emoji: "🏈", x: 65, y: 75, size: 20, delay: 0.5, dur: 11 },
  { emoji: "🎾", x: 20, y: 70, size: 18, delay: 2, dur: 8 },
  { emoji: "🏐", x: 90, y: 45, size: 16, delay: 0.8, dur: 10 },
  { emoji: "🏉", x: 5, y: 50, size: 14, delay: 1.5, dur: 12 },
  { emoji: "⚾", x: 50, y: 88, size: 18, delay: 0.3, dur: 9 },
  { emoji: "🏓", x: 75, y: 30, size: 14, delay: 2.5, dur: 7 },
];

export default function NotFound() {
  const navigate = useNavigate();
  const [count, setCount] = useState(5);

  useEffect(() => {
    const t = setInterval(() => setCount(c => c - 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (count <= 0) navigate("/", { replace: true });
  }, [count, navigate]);

  return (
    <div className="relative min-h-screen bg-[#0d0d0d] flex items-center justify-center overflow-hidden">

      {/* Bolas flutuando */}
      {BALLS.map((b, i) => (
        <span
          key={i}
          className="absolute select-none pointer-events-none"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            fontSize: `${b.size}px`,
            opacity: 0.12,
            animation: `float ${b.dur}s ease-in-out ${b.delay}s infinite alternate`,
          }}
        >
          {b.emoji}
        </span>
      ))}

      {/* Glow roxo central */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 600, height: 600,
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(127,51,217,0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">

        {/* 404 */}
        <div className="relative mb-2 leading-none select-none">
          <span
            className="text-[160px] sm:text-[200px] font-black tracking-tighter"
            style={{
              background: "linear-gradient(135deg, #7F33D9 0%, #b57bff 50%, #7F33D9 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 40px rgba(127,51,217,0.5))",
            }}
          >
            404
          </span>
          {/* Bola girando no "0" do meio */}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-3 leading-tight">
          Página fora do campo
        </h1>

        {/* Contagem regressiva */}
        <p className="text-gray-500 text-xs mb-8">
          Redirecionando em{" "}
          <span className="text-purple-400 font-bold tabular-nums">{count}s</span>…
        </p>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-full border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition-all"
          >
            ← Voltar
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 rounded-full text-white text-sm font-bold transition-all"
            style={{
              background: "linear-gradient(135deg, #7F33D9, #9b5cf6)",
              boxShadow: "0 4px 24px rgba(127,51,217,0.4)",
            }}
          >
            Ir para o início
          </button>
        </div>
      </div>

      <style>{`
        @keyframes float {
          from { transform: translateY(0px) rotate(0deg); }
          to   { transform: translateY(-24px) rotate(20deg); }
        }
        @keyframes spin {
          from { transform: translate(-50%, -52%) rotate(0deg); }
          to   { transform: translate(-50%, -52%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
