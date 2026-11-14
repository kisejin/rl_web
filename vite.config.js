import tutorHandler from "./api/tutor.js";
import harnessHandler from "./api/harness.js";
import { defineConfig, loadEnv } from "vite";
export default defineConfig({
  plugins: [
    {
      name: "local-study-tutor",
      configureServer(server) {
        const settings = loadEnv(server.config.mode, server.config.envDir, [
          "QWENCODER_",
          "HARNESS_",
          "DEEPSEEK_HARNESS_",
        ]);
        for (const [name, value] of Object.entries(settings))
          if (!process.env[name]) process.env[name] = value;
        server.middlewares.use((req, res, next) => {
          const path = req.url?.split("?")[0];
          if (path === "/api/tutor") return tutorHandler(req, res);
          if (
            path === "/api/harness" ||
            path === "/harness/v1/chat/completions"
          )
            return harnessHandler(req, res);
          next();
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: { main: "index.html", lab: "lab.html" },
      output: {
        manualChunks(id) {
          if (
            id.includes("/node_modules/@codemirror/") ||
            id.includes("/node_modules/@lezer/") ||
            id.includes("/node_modules/codemirror/")
          )
            return "editor";
          if (id.includes("/node_modules/katex/")) return "math";
        },
      },
    },
  },
});
