import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";
import localAdminPlugin from "./scripts/local-admin.mjs";

export default defineConfig({
 site: "http://localhost:4321",
 vite: {plugins: [localAdminPlugin(fileURLToPath(new URL(".", import.meta.url)))]},
});
