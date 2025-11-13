import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@/components': path.resolve(__dirname, './src/components'),
            '@/services': path.resolve(__dirname, './src/services'),
            '@/types': path.resolve(__dirname, './src/types'),
            '@/config': path.resolve(__dirname, './src/config'),
            '@/hooks': path.resolve(__dirname, './src/hooks'),
            '@/contexts': path.resolve(__dirname, './src/contexts'),
            '@/screens': path.resolve(__dirname, './src/screens')
        }
    },
    server: {
        port: 8001,
        host: true,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/api/, ''); },
                secure: false
            }
        }
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    router: ['react-router-dom']
                }
            }
        }
    },
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    }
});
