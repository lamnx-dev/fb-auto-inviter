import path from "path"

import { crx } from "@crxjs/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import zip from "vite-plugin-zip-pack"

import manifest from "./manifest.config.ts"
import { name, version } from "./package.json" with { type: "json" }

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    modulePreload: false,
  },
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest }),
    zip({ outDir: "release", outFileName: `${name}-v${version}.zip` }),
  ],
})
