FROM node:24-bookworm-slim
WORKDIR /app
COPY --chown=node:node deployments/deepseek-harness/package.json deployments/deepseek-harness/package-lock.json ./
RUN --mount=type=secret,id=build_ca,target=/tmp/build-ca.pem \
    if [ -f /tmp/build-ca.pem ]; then export NODE_EXTRA_CA_CERTS=/tmp/build-ca.pem; fi; \
    npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --chown=node:node deployments/deepseek-harness/engine.js deployments/deepseek-harness/server.js /app/deployments/deepseek-harness/
COPY --chown=node:node src/sse.js src/tutor-models.js src/tutor-agent.js src/tutor-attachments.js src/content.js src/tutor-context.js src/atlas-content.js src/atlas-sources.js src/atlas-labs.js src/atlas-lab-data.js /app/src/
COPY --chown=node:node server/secret-filter.js server/harness-gateway.js server/tutor-mcp.js server/tutor-skills.js /app/server/
COPY --chown=node:node skills/tutor/ /app/skills/tutor/
USER node
WORKDIR /app/deployments/deepseek-harness
ENV NODE_ENV=production PORT=3080
EXPOSE 3080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3080/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
