import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

// Юнит-тесты на чистые функции (деньги/серии/даты). Среда node — серверных
// импортов в тестируемых модулях нет. Алиас @ повторяет tsconfig paths.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
