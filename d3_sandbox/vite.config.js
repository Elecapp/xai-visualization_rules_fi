import { defineConfig } from 'vite';

export default defineConfig({
  // index.html is at the project root
  root: '.',

  // Serve the 'public' directory (which contains a 'static' symlink) at '/'
  // so that /static/... URLs resolve correctly
  publicDir: 'public',

  server: {
    host: 'localhost',
    port: 8008,
    open: false,
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

