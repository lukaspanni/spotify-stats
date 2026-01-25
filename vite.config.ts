import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'assets/*.json',
          dest: '.'
        }
      ]
    })
  ],
  root: 'public',
  publicDir: false,
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: 'public/index.html'
    }
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js']
  },
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer]
    }
  }
});
