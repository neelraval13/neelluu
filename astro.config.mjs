// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://neelluu.com",
  trailingSlash: "never",
  integrations: [react()],

  vite: {
    assetsInclude: ["**/*.glb"],
  },
});
