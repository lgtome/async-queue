import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['specs/**/*.ts'],
    api: true,
    coverage: {
      enabled: true,
    },
  },
})
