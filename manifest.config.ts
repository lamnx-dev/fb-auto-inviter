import { defineManifest } from "@crxjs/vite-plugin"
import pkg from "./package.json" with { type: "json" }

export default defineManifest(async (env) => {
  let name = "FB Auto Inviter"

  const isDev = env.mode === "development"

  if (isDev) {
    name = `[DEV] ${name}`
  }

  return {
    manifest_version: 3,
    name,
    version: pkg.version,
    description: pkg.description,
    icons: {
      48: "logo.png",
    },
    action: {
      default_popup: "src/popup/index.html",
      default_icon: {
        48: "logo.png",
      },
    },
    background: {
      service_worker: "src/background/background.ts",
      type: "module",
    },
    content_scripts: [
      {
        matches: ["https://business.facebook.com/*"],
        js: ["src/content/content.ts"],
        run_at: "document_idle",
      },
    ],
    permissions: ["storage", "tabs"],
    host_permissions: ["https://*.facebook.com/*"],
  }
})
