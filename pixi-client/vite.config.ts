import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";

import { assetpackPlugin } from "./scripts/assetpack-vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [mkcert(), assetpackPlugin()],
  server: {
    port: 7070,
    open: true,
  },
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
});
