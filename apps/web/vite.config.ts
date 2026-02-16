import { URL, fileURLToPath } from "node:url";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { agentTail } from "vite-plugin-agent-tail";

const workspaceRootDir = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  envDir: workspaceRootDir,
  plugins: [react(), vanillaExtractPlugin(), agentTail()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    host: true,
    port: 5173,
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
