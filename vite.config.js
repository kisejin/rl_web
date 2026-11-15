import paperContentHandler from "./api/paper-content.js";
import paperPdfHandler from "./api/paper-pdf.js";
import researchHandler from "./api/research.js";
import researchRefreshHandler from "./api/research-refresh.js";
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
          "BLOB_",
          "CRON_",
        ]);
        for (const [name, value] of Object.entries(settings))
          if (!process.env[name]) process.env[name] = value;
        server.middlewares.use((req, res, next) => {
          const path = req.url?.split("?")[0];
          if (
            [
              "/api/research",
              "/api/research-refresh",
              "/api/paper-content",
              "/api/paper-pdf",
            ].includes(path)
          ) {
            res.status = (status) => {
              res.statusCode = status;
              return res;
            };
            res.json = (value) => res.end(JSON.stringify(value));
          }
          if (path === "/api/paper-content")
            return paperContentHandler(req, res);
          if (path === "/api/paper-pdf") return paperPdfHandler(req, res);
          if (path === "/api/research") return researchHandler(req, res);
          if (path === "/api/research-refresh")
            return researchRefreshHandler(req, res);
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
