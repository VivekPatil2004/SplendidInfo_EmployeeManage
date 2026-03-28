import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(async () => {
  // Fall back to Tailwind's WASI build on Windows when the native oxide
  // binary can't be loaded correctly in the local environment.
  process.env.NAPI_RS_FORCE_WASI ??= "1";

  const { default: tailwindcss } = await import("@tailwindcss/" + "vite");

  return {
    plugins: [react(), tailwindcss()],
  };
});
