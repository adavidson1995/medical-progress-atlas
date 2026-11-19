import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps every asset path relative, so the same build works at a domain
// root, in a GitHub Pages project sub-path, or in a sandboxed preview.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (!env.VITE_SITE_URL) process.env.VITE_SITE_URL = './';
  else if (!env.VITE_SITE_URL.endsWith('/')) process.env.VITE_SITE_URL = env.VITE_SITE_URL + '/';
  return {
    base: './',
    plugins: [react()],
    build: { target: 'es2020', sourcemap: false, chunkSizeWarningLimit: 600 },
  };
});
