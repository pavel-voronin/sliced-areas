import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/plugin/index.ts',
        vue: 'src/plugin/vue.ts',
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
