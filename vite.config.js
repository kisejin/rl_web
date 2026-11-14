import tutorHandler from "./api/tutor.js";
import { defineConfig, loadEnv } from "vite";
export default defineConfig({
  plugins: [
    {
      name: "local-study-tutor",
      configureServer(server) {
        const settings = loadEnv(
          server.config.mode,
          server.config.envDir,
          "QWENCODER_",
        );
        for (const [name, value] of Object.entries(settings))
          if (!process.env[name]) process.env[name] = value;
        server.middlewares.use((req, res, next) => {
          if (req.url?.split("?")[0] !== "/api/tutor") return next();
          tutorHandler(req, res);
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
