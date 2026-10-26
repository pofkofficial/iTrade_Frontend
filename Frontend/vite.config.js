import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';

  return {
    plugins: [
      react({
        fastRefresh: true,
        include: /\.(jsx|tsx)$/,
      }),
    ],
    server: {
      port: 5173,
      open: true,
      hmr: {
        protocol: isDevelopment ? 'ws' : 'wss',
        host: 'localhost',
        timeout: 20000,
      },
      proxy: {
        '/api': {
          target: 'https://api.itrade4phones.com',
          changeOrigin: true,
          secure: isDevelopment ? false : true,
          rewrite: (path) => path.replace(/^\/api/, ''), // Remove /api prefix
        },
        '/cdn-cgi': {
          target: 'https://checkout.paystack.com',
          changeOrigin: true,
          secure: isDevelopment ? false : true,
        },
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'react-toastify',
        'react-icons/fa',
        'react-icons/fa6',
        'react-icons/fi',
        'framer-motion',
        'axios',
        'chart.js',
        'react-chartjs-2',
      ],
      force: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: isDevelopment,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: [
              'react',
              'react-dom',
              'react-router-dom',
              'react-toastify',
              'framer-motion',
              'axios',
              'react-chartjs-2',
              'chart.js',
            ],
            icons: ['react-icons/fa', 'react-icons/fa6', 'react-icons/fi'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@components': path.resolve(__dirname, './src/components'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
      },
    },
    esbuild: {
      drop: isDevelopment ? [] : ['console', 'debugger'],
    },
  };
});