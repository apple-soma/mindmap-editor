import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // ✅ `react` をインポート

export default defineConfig({
  plugins: [react()], // ✅ `react()` を使用
  define: {
    "process.env": process.env,
  },
});
