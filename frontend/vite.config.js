import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig(({ mode }) => ({
  // 🔥 base só em build de produção
  base: mode === "production" ? "/" : "/",

  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
    tsconfigPaths({
      loose: true,
    }),
  ],

  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") },
      // Todo `import ReactECharts from "echarts-for-react"` passa pelo wrapper com tema claro/escuro.
      // Regex ancorada: o import interno do wrapper ("echarts-for-react/esm/index.js") não é reescrito.
      { find: /^echarts-for-react$/, replacement: path.resolve(__dirname, "src/lib/echartsThemed.jsx") },
    ],
  },
}));
