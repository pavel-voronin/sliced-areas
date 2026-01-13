import { fileURLToPath } from 'node:url'
import type { UserConfig } from 'vite'
import { mergeConfig, defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig as UserConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      root: fileURLToPath(new URL('./', import.meta.url)),
      setupFiles: ['./tests/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        reportsDirectory: './coverage',
        include: ['src/plugin/**'],
        exclude: ['src/plugin/styles.css'],
        thresholds: {
          lines: 100,
          statements: 100,
          functions: 100,
          branches: 100,
        },
      },
    },
  }),
)
